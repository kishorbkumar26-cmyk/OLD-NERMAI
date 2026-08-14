import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  AppState,
  AppStateStatus,
  Linking,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../core/api';
import { useAuth } from '../../core/auth/AuthProvider';
import { Card } from '../../components/ui';
import { globalTracker } from '../../services/debug/ViewerPerformanceTracker';

// Native-only imports — guarded by Platform checks at runtime
let PdfProxy: any = null;
let ScreenCapture: any = null;
let ResourceCacheManager: any = null;
let CacheState: any = { ONLINE: 'ONLINE', DOWNLOADING: 'DOWNLOADING', CACHED: 'CACHED', OFFLINE: 'OFFLINE', STALE: 'STALE', ERROR: 'ERROR' };
let PdfViewerAssetManager: any = null;
let ResourceDebugPanel: any = null;

if (Platform.OS !== 'web') {
  // These modules use expo-file-system and expo-secure-store which crash on web
  PdfProxy = require('../../components/PdfProxy').default;
  ScreenCapture = require('expo-screen-capture');
  const cacheModule = require('../../services/cache/ResourceCacheManager');
  ResourceCacheManager = cacheModule.ResourceCacheManager;
  CacheState = cacheModule.CacheState;
  PdfViewerAssetManager = require('../../services/cache/PdfViewerAssetManager').PdfViewerAssetManager;
  ResourceDebugPanel = require('../../components/debug/ResourceDebugPanel').ResourceDebugPanel;
}

const BouncingWatermark = ({ studentName, studentEmail }: { studentName: string, studentEmail: string }) => {
  const { width, height } = Dimensions.get('window');
  
  const BADGE_WIDTH = 200;
  const BADGE_HEIGHT = 80;
  const VIEW_HEIGHT = height - (Platform.OS === 'ios' ? 90 : 70); // Adjust for header height
  
  const state = useRef({
    x: Math.random() * (width - BADGE_WIDTH),
    y: Math.random() * (VIEW_HEIGHT - BADGE_HEIGHT),
    dx: (Math.random() > 0.5 ? 1 : -1) * 1.5,
    dy: (Math.random() > 0.5 ? 1 : -1) * 1.5
  }).current;
  
  const pan = useRef(new Animated.ValueXY({ x: state.x, y: state.y })).current;
  const animRef = useRef<number>();

  useEffect(() => {
    let lastTime = Date.now();
    const animate = () => {
      // Basic time delta scaling for smoother animation regardless of framerate
      const now = Date.now();
      const dt = Math.min((now - lastTime) / 16, 2); // Cap delta to prevent huge jumps
      lastTime = now;

      state.x += state.dx * dt;
      state.y += state.dy * dt;

      if (state.x <= 0) {
        state.x = 0;
        state.dx *= -1;
      } else if (state.x + BADGE_WIDTH >= width) {
        state.x = width - BADGE_WIDTH;
        state.dx *= -1;
      }

      if (state.y <= 0) {
        state.y = 0;
        state.dy *= -1;
      } else if (state.y + BADGE_HEIGHT >= VIEW_HEIGHT) {
        state.y = VIEW_HEIGHT - BADGE_HEIGHT;
        state.dy *= -1;
      }

      pan.setValue({ x: state.x, y: state.y });
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const dodge = () => {
    const maxX = Math.max(0, width - BADGE_WIDTH);
    const maxY = Math.max(0, VIEW_HEIGHT - BADGE_HEIGHT);
    
    let newX = state.x;
    let newY = state.y;
    
    while (Math.abs(newX - state.x) < maxX * 0.25 || Math.abs(newY - state.y) < maxY * 0.25) {
      newX = Math.random() * maxX;
      newY = Math.random() * maxY;
    }
    
    state.x = newX;
    state.y = newY;
    state.dx = (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random());
    state.dy = (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random());
    pan.setValue({ x: state.x, y: state.y });
  };

  return (
    <Animated.View
      onTouchStart={dodge}
      style={[
        {
          position: 'absolute',
          width: BADGE_WIDTH,
          height: BADGE_HEIGHT,
          backgroundColor: 'transparent',
          padding: 12,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0.25,
          zIndex: 9999,
        },
        pan.getLayout()
      ]}
    >
      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#000', marginBottom: 4 }}>
        NERMAI ACADEMY
      </Text>
      <Text style={{ fontSize: 11, color: '#333', textAlign: 'center' }}>
        {studentName}
      </Text>
      <Text style={{ fontSize: 11, color: '#333', textAlign: 'center' }}>
        {studentEmail}
      </Text>
      <Text style={{ fontSize: 11, color: '#333', textAlign: 'center' }}>
        {new Date().toLocaleDateString()}
      </Text>
    </Animated.View>
  );
};

interface ResourceViewerProps {

  route?: any;
  navigation?: any;
}

export const ResourceViewer: React.FC<ResourceViewerProps> = (props) => {
  const { params } = props.route || { params: {} };
  const { resourceId, title, studentName = 'Student', studentEmail = '' } = params;
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<any>(null);

  // Cache State (native only — on web always ONLINE)
  const [cacheState, setCacheState] = useState<string>(CacheState.ONLINE);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isOfflineMarked, setIsOfflineMarked] = useState(false);

  // Viewer State
  const [viewerAssets, setViewerAssets] = useState<{ htmlUri: string; baseDir: string } | null>(null);
  const [isViewing, setIsViewing] = useState(false);
  const [localPath, setLocalPath] = useState<string | null>(null);
  const [preparingViewer, setPreparingViewer] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startPage, setStartPage] = useState(1);

  // Debug State (native only)
  const [debugVisible, setDebugVisible] = useState(false);
  const [openTimeMs, setOpenTimeMs] = useState(0);

  // ─── Fetch metadata & set initial cache state ────────────────────────────────
  const fetchAndSetState = async () => {
    try {
      setLoading(true);

      // Prepare PDF viewer assets (native only)
      if (Platform.OS !== 'web' && PdfViewerAssetManager) {
        try {
          const htmlUri = await PdfViewerAssetManager.preparePdfViewerAssets();
          setViewerAssets({ htmlUri, baseDir: PdfViewerAssetManager.currentViewerDir });
        } catch (assetErr) {
          console.warn('[ResourceViewer] Could not prepare PDF.js assets:', assetErr);
        }
      }

      const res = await api.get(`/resources/${resourceId}/access`);
      const data = res.data.data;
      setMetadata(data);

      console.log(`
========== RESOURCE ==========
Open Clicked
Mode
ONLINE
Resource
${title || resourceId}
==============================`);

    } catch (e: any) {
      console.error('[ResourceViewer] fetchAndSetState error:', e);
      Alert.alert('Access Denied', e.response?.data?.error || 'Unable to access resource.');
      if (props.navigation) props.navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!resourceId) {
      Alert.alert('Error', 'No resource ID provided.');
      if (props.navigation) props.navigation.goBack();
      return;
    }
    fetchAndSetState();
  }, [resourceId]);

  // App background — cleanup temp decrypted files on native
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (ResourceCacheManager) ResourceCacheManager.cleanupTemp();
        if (isViewing) setLocalPath(null);
      }
    });

    return () => {
      subscription.remove();
      if (ResourceCacheManager) ResourceCacheManager.cleanupTemp();
      if (ScreenCapture) {
        try { ScreenCapture.allowScreenCaptureAsync(); } catch (_) {}
      }
    };
  }, [isViewing]);

  // ─── Open Viewer ─────────────────────────────────────────────────────────────
  const handleOpenViewer = async () => {
    if (!metadata) return;
    globalTracker.start();
    const startMs = Date.now();

    setPreparingViewer(true);
    setDownloadProgress(0);

    try {
      let currentMetadata = metadata;
      
      // Expiry Check for Online Viewer
      if (currentMetadata?.expiresAt && new Date(currentMetadata.expiresAt) < new Date()) {
        console.log('[ResourceViewer] Token expired, refreshing /access...');
        const res = await api.get(`/resources/${resourceId}/access`);
        currentMetadata = res.data.data;
        setMetadata(currentMetadata);
      }
      // ── WEB: No FileSystem available. Use viewerUrl from /access if present
      if (Platform.OS === 'web') {
        const openUrl = currentMetadata.viewerUrl || currentMetadata.signedUrl;
        if (openUrl) await Linking.openURL(openUrl);
        return;
      }

      // ── NATIVE: Pure Online Streaming ────────────────────────────────────────
      if (ScreenCapture) {
        try { await ScreenCapture.preventScreenCaptureAsync(); } catch (_) {}
      }

      setLocalPath(null);
      setIsViewing(true);
    } catch (e: any) {
      console.error('[ResourceViewer] handleOpenViewer error:', e);
      setCacheState(CacheState.ERROR);
      Alert.alert('Error', e.message || 'Failed to open resource.');
    } finally {
      setOpenTimeMs(Date.now() - startMs);
      setPreparingViewer(false);
    }
  };

  // ─── Close / Back ────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (isViewing) {
      setIsViewing(false);
      setLocalPath(null);
      if (Platform.OS !== 'web' && ResourceCacheManager) ResourceCacheManager.cleanupTemp();
      if (Platform.OS !== 'web' && ScreenCapture) {
        try { ScreenCapture.allowScreenCaptureAsync(); } catch (_) {}
      }
    } else {
      if (props.navigation) props.navigation.goBack();
    }
  };

  // ─── Favorites (native-only, silently ignored on web) ────────────────────────
  const toggleFavorite = async () => {
    if (Platform.OS === 'web' || !ResourceCacheManager) return;
    const newState = await ResourceCacheManager.toggleFavorite(resourceId);
    setIsFavorite(newState);
  };

  const toggleOffline = async () => {
    if (Platform.OS === 'web' || !ResourceCacheManager) return;
    const newState = !isOfflineMarked;
    await ResourceCacheManager.setOfflineMarked(resourceId, newState);
    setIsOfflineMarked(newState);
    
    // If we just marked it for offline and it's not cached, download it in the background
    if (newState && cacheState !== CacheState.CACHED) {
       setCacheState(CacheState.DOWNLOADING);
       try {
         const token = await getToken();
         const streamUrl = `${api.defaults.baseURL}/resources/${resourceId}/content`;
         await ResourceCacheManager.downloadAndCache(
           resourceId,
           metadata?.version || 1,
           metadata?.checksum || '',
           streamUrl,
           metadata?.contentType || 'application/pdf',
           token || '',
           (prog: number) => setDownloadProgress(prog)
         );
         setCacheState(CacheState.CACHED);
         Alert.alert('Download Complete', 'Resource is now available offline.');
       } catch (err: any) {
         setCacheState(CacheState.ERROR);
         setIsOfflineMarked(false);
         await ResourceCacheManager.setOfflineMarked(resourceId, false);
         Alert.alert('Download Failed', err.message || 'Could not save offline.');
       }
    }
  };

  // ─── Debug Badge (native DEV only) ───────────────────────────────────────────
  const renderDebugBadge = () => {
    if (!__DEV__ || Platform.OS === 'web') return null;
    let color = '#3B82F6';
    if (cacheState === CacheState.CACHED) color = '#10B981';
    if (cacheState === CacheState.DOWNLOADING) color = '#F59E0B';
    if (cacheState === CacheState.ERROR) color = '#EF4444';

    return (
      <View style={{ backgroundColor: color, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
        <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>{cacheState}</Text>
      </View>
    );
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  // ─── Info card (before opening) ──────────────────────────────────────────────
  if (!isViewing) {
    const isWeb = Platform.OS === 'web';

    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.cardHeaderTitle}>Resource Info</Text>
        </View>

        <View style={styles.cardContent}>
          <Card style={styles.infoCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="document-text" size={40} color="#D4AF37" />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onLongPress={() => __DEV__ && !isWeb && setDebugVisible(true)}
              style={styles.titleRow}
            >
              <Text style={styles.titleText}>{title}</Text>
              {renderDebugBadge()}
            </TouchableOpacity>

            <View style={styles.metaContainer}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={styles.metaValue}>{isWeb ? 'ONLINE (Browser)' : cacheState}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Version</Text>
                <Text style={styles.metaValue}>v{metadata?.version || 1}</Text>
              </View>
              {isWeb && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Platform</Text>
                  <Text style={[styles.metaValue, { color: '#F59E0B' }]}>Web — opens in new tab</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, preparingViewer && styles.primaryBtnDisabled]}
              onPress={handleOpenViewer}
              disabled={preparingViewer}
            >
              {preparingViewer ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#000" />
                  <Text style={styles.primaryBtnText}>
                    {downloadProgress > 0 ? `${Math.round(downloadProgress * 100)}%` : 'Preparing...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.primaryBtnText}>
                  {isWeb ? 'Open in Browser' : 'Open Secure Viewer'}
                </Text>
              )}
            </TouchableOpacity>

            {!isWeb && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={toggleFavorite}>
                  <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={20} color="#D4AF37" />
                  <Text style={styles.secondaryBtnText}>{isFavorite ? 'Favorited' : 'Favorite'}</Text>
                </TouchableOpacity>

                {metadata?.offlineAllowed && (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={toggleOffline} disabled={cacheState === CacheState.DOWNLOADING}>
                    {cacheState === CacheState.DOWNLOADING ? (
                      <>
                        <ActivityIndicator size="small" color="#D4AF37" />
                        <Text style={styles.secondaryBtnText}>
                          {downloadProgress > 0 ? `${Math.round(downloadProgress * 100)}%` : 'Starting...'}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons
                          name={isOfflineMarked ? 'cloud-done' : 'cloud-download-outline'}
                          size={20}
                          color={isOfflineMarked ? '#10b981' : '#D4AF37'}
                        />
                        <Text style={styles.secondaryBtnText}>
                          {isOfflineMarked ? 'Offline Ready' : 'Make Offline'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Card>
        </View>

        {/* Debug panel — native DEV only */}
        {__DEV__ && Platform.OS !== 'web' && ResourceDebugPanel && (
          <ResourceDebugPanel
            visible={debugVisible}
            onClose={() => setDebugVisible(false)}
            resourceId={resourceId}
            backendVersion={metadata?.version || 1}
            cacheState={cacheState}
            openTimeMs={openTimeMs}
            onForceRefresh={fetchAndSetState}
          />
        )}
      </SafeAreaView>
    );
  }

  // ─── Native PDF viewer (shown only after successful download/cache on native) ─
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="arrow-back" size={24} color="#D4AF37" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => __DEV__ && setDebugVisible(true)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Text style={styles.headerTitle} numberOfLines={1}>{title || 'Document'}</Text>
            {renderDebugBadge()}
          </TouchableOpacity>
          {metadata?.contentType?.includes('pdf') && totalPages > 1 && (
            <Text style={styles.pageText}>Page {currentPage} / {totalPages}</Text>
          )}
        </View>

        <TouchableOpacity onPress={toggleFavorite} style={styles.actionBtn}>
          <Ionicons name={isFavorite ? 'star' : 'star-outline'} size={22} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      <View style={styles.viewerContent}>
        {localPath && viewerAssets && metadata?.contentType?.includes('pdf') && PdfProxy ? (
          <PdfProxy
            localUri={localPath}
            viewerAssets={viewerAssets}
            startPage={startPage}
            watermark={{
              text: 'NERMAI ACADEMY CONFIDENTIAL',
              subtext: `${studentName} • ${studentEmail}\n${new Date().toLocaleDateString()}`,
            }}
            onLoadComplete={(numPages: number) => setTotalPages(numPages)}
            onPageChanged={(page: number, _total: number) => {
              setCurrentPage(page);
              if (resourceId && ResourceCacheManager) {
                ResourceCacheManager.saveReadingProgress(resourceId, { page, scrollPosition: 0 });
              }
            }}
            onError={(error: any) => {
              console.error('[PdfProxy] render error:', error);
              Alert.alert('Error', 'Failed to render secure PDF.');
            }}
            style={styles.pdf}
          />
        ) : isViewing && !localPath ? (
          metadata?.contentType?.includes('pdf') && metadata?.viewerType !== 'webview' && viewerAssets && PdfProxy ? (
            <PdfProxy
              onlineUrl={metadata?.viewerUrl || ''}
              viewerAssets={viewerAssets}
              startPage={startPage}
              watermark={{
                text: 'NERMAI ACADEMY CONFIDENTIAL',
                subtext: `${studentName} • ${studentEmail}\n${new Date().toLocaleDateString()}`,
              }}
              onLoadComplete={(numPages: number) => setTotalPages(numPages)}
              onPageChanged={(page: number, _total: number) => {
                setCurrentPage(page);
                if (resourceId && ResourceCacheManager) {
                  ResourceCacheManager.saveReadingProgress(resourceId, { page, scrollPosition: 0 });
                }
              }}
              onError={(error: any) => {
                console.error('[PdfProxy] online render error:', error);
                Alert.alert('Error', 'Failed to render secure online PDF.');
              }}
              style={styles.pdf}
            />
          ) : (
            <View style={{ flex: 1, position: 'relative', width: Dimensions.get('window').width }}>
              <WebView
                source={{ uri: metadata?.viewerUrl || '' }}
                style={{ flex: 1, width: '100%' }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                scalesPageToFit={true}
                bounces={false}
                injectedJavaScript={`
                  const meta = document.createElement('meta');
                  meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=10, user-scalable=yes');
                  meta.setAttribute('name', 'viewport');
                  document.getElementsByTagName('head')[0].appendChild(meta);
                  true;
                `}
                onLoadStart={() => globalTracker.track('WebView Load Start')}
                onLoadEnd={() => globalTracker.track('WebView Load End')}
                onError={(e) => console.error('WebView error:', e.nativeEvent)}
              />
              
              {/* Top-Right Touch Blocker to prevent clicking the Google Drive Share/Pop-out button */}
              <View 
                style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, backgroundColor: 'rgba(255, 255, 255, 0.01)' }} 
                pointerEvents="auto" 
              />

            {/* Dynamic Animated Watermark */}
            <BouncingWatermark studentName={studentName} studentEmail={studentEmail} />
          </View>
          )
        ) : (
          <View style={styles.fallbackContainer}>
            <Ionicons name="document-text" size={64} color="#10b981" />
            <Text style={styles.fallbackTitle}>Secure Offline Cache</Text>
            <Text style={styles.fallbackDesc}>This file type cannot be previewed natively.</Text>
          </View>
        )}
      </View>

      {__DEV__ && Platform.OS !== 'web' && ResourceDebugPanel && (
        <ResourceDebugPanel
          visible={debugVisible}
          onClose={() => setDebugVisible(false)}
          resourceId={resourceId}
          backendVersion={metadata?.version || 1}
          cacheState={cacheState}
          openTimeMs={openTimeMs}
          onForceRefresh={() => { setIsViewing(false); fetchAndSetState(); }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060913',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#060913',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  cardHeaderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  infoCard: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.15)',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212,175,55,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  titleText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metaContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  metaLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  metaValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryBtnDisabled: {
    backgroundColor: '#7A641A',
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  secondaryBtnText: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#1B1B1B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.2)',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#F8F8F8',
    fontSize: 16,
    fontWeight: '700',
  },
  pageText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: { padding: 8 },
  actionBtn: { padding: 8 },
  viewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  fallbackContainer: {
    alignItems: 'center',
    padding: 32,
  },
  fallbackTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  fallbackDesc: {
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },
});
