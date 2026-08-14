import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { ResourceCacheManager, CacheState } from '../../services/cache/ResourceCacheManager';
import { PdfViewerAssetManager } from '../../services/cache/PdfViewerAssetManager';
import { globalTracker } from '../../services/debug/ViewerPerformanceTracker';
import * as Clipboard from 'expo-clipboard';

interface ResourceDebugPanelProps {
  visible: boolean;
  onClose: () => void;
  resourceId: string;
  backendVersion: number;
  cacheState: CacheState;
  openTimeMs: number;
  onForceRefresh: () => void;
}

export const ResourceDebugPanel: React.FC<ResourceDebugPanelProps> = ({
  visible,
  onClose,
  resourceId,
  backendVersion,
  cacheState,
  openTimeMs,
  onForceRefresh
}) => {
  const [localVersion, setLocalVersion] = useState<number | null>(null);
  const [fileSize, setFileSize] = useState<string>('0 MB');
  const [downloadedAt, setDownloadedAt] = useState<string>('N/A');
  const [lastOpened, setLastOpened] = useState<string>('N/A');
  const [isOfflineMarked, setIsOfflineMarked] = useState<boolean>(false);
  const [readingProgress, setReadingProgress] = useState<string>('N/A');
  const [timeline, setTimeline] = useState<any[]>([]);
  const [ttfb, setTtfb] = useState<string>('N/A');
  const [firstPage, setFirstPage] = useState<string>('N/A');
  
  const [isSimulatingOffline, setIsSimulatingOffline] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchDebugData();
      setIsSimulatingOffline(ResourceCacheManager.isSimulatingOffline);
      
      const interval = setInterval(() => {
        const events = globalTracker.getTimeline();
        setTimeline([...events]);
        
        const firstByte = events.find((e: any) => e.event === '[WebView] First Byte Received');
        if (firstByte) setTtfb(`${firstByte.timeMs.toFixed(0)} ms`);
        
        const firstPageEvt = events.find((e: any) => e.event === '[WebView] First Page Rendered');
        if (firstPageEvt) setFirstPage(`${firstPageEvt.timeMs.toFixed(0)} ms`);
        
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [visible, cacheState]);

  const fetchDebugData = async () => {
    const meta = await ResourceCacheManager.getCachedMetadata(resourceId);
    if (meta) {
      setLocalVersion(meta.version);
      setFileSize((meta.fileSize / (1024 * 1024)).toFixed(2) + ' MB');
      setDownloadedAt(new Date(meta.downloadedAt).toLocaleString());
      setLastOpened(new Date(meta.lastOpened).toLocaleString());
      setIsOfflineMarked(meta.isOfflineMarked);
    } else {
      setLocalVersion(null);
      setFileSize('N/A');
      setDownloadedAt('N/A');
      setLastOpened('N/A');
      setIsOfflineMarked(false);
    }

    const prog = await ResourceCacheManager.getReadingProgress(resourceId);
    if (prog) {
      setReadingProgress(`Page ${prog.page}`);
    } else {
      setReadingProgress('N/A');
    }
  };

  const toggleSimulateOffline = () => {
    const newVal = !isSimulatingOffline;
    setIsSimulatingOffline(newVal);
    ResourceCacheManager.isSimulatingOffline = newVal;
  };

  const handleDeleteCache = async () => {
    const meta = await ResourceCacheManager.getCachedMetadata(resourceId);
    if (meta) {
      await ResourceCacheManager.deleteCache(resourceId);
      onForceRefresh();
      onClose();
    }
  };

  const handleClearMetadata = async () => {
    await ResourceCacheManager.deleteCache(resourceId);
    onForceRefresh();
    onClose();
  };

  const handleExportDiagnostics = async () => {
    const data = globalTracker.exportDiagnostics(resourceId, 'unknown', cacheState);
    await Clipboard.setStringAsync(data);
    alert('Diagnostics copied to clipboard!');
  };

  if (!__DEV__) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>🐞 Resource Debug</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>Close</Text></TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            <DebugRow label="Resource ID" value={resourceId} />
            <DebugRow label="Backend Version" value={String(backendVersion)} />
            <DebugRow label="Local Version" value={localVersion ? String(localVersion) : 'N/A'} />
            <DebugRow label="Cache State" value={cacheState} highlight={cacheState === CacheState.CACHED} />
            <DebugRow label="Cache Size" value={fileSize} />
            <DebugRow label="Offline Allowed" value={isOfflineMarked ? 'YES' : 'NO'} />
            <DebugRow label="Downloaded" value={downloadedAt} />
            <DebugRow label="Last Opened" value={lastOpened} />
            <DebugRow label="Reading Progress" value={readingProgress} />
            
            <View style={styles.divider} />
            
            <DebugRow label="Viewer Assets" value={`Version ${PdfViewerAssetManager['VIEWER_VERSION'] || 1}`} />
            <DebugRow label="Source" value={cacheState === CacheState.CACHED ? 'LOCAL CACHE' : 'NETWORK'} />
            <DebugRow label="Open Time" value={`${openTimeMs.toFixed(0)} ms`} />
            <DebugRow label="TTFB (First Byte)" value={ttfb} highlight={ttfb !== 'N/A'} />
            <DebugRow label="First Page Render" value={firstPage} highlight={firstPage !== 'N/A'} />

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Event Timeline</Text>
            {timeline.map((evt, idx) => (
              <View key={idx} style={styles.timelineRow}>
                <Text style={styles.timelineTime}>{evt.timeMs.toFixed(0)} ms</Text>
                <Text style={styles.timelineEvent}>{evt.event}</Text>
              </View>
            ))}

            <View style={styles.divider} />
            
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Simulate Offline</Text>
              <Switch value={isSimulatingOffline} onValueChange={toggleSimulateOffline} />
            </View>

            <TouchableOpacity style={styles.btnDanger} onPress={handleDeleteCache}>
              <Text style={styles.btnText}>Delete Cached Copy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.btnWarning} onPress={handleClearMetadata}>
              <Text style={styles.btnText}>Clear Metadata</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleExportDiagnostics}>
              <Text style={styles.btnText}>Copy Export Diagnostics</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} onPress={() => { onForceRefresh(); onClose(); }}>
              <Text style={styles.btnText}>Force Refresh / Download Again</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const DebugRow = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, highlight && styles.highlight]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '80%',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 16,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    color: '#94A3B8',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  label: {
    color: '#94A3B8',
    fontSize: 14,
  },
  value: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '500',
  },
  highlight: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  toggleLabel: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '500',
  },
  btnPrimary: {
    backgroundColor: '#3B82F6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnDanger: {
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnWarning: {
    backgroundColor: '#F59E0B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnSecondary: {
    backgroundColor: '#64748B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineTime: {
    width: 60,
    color: '#D4AF37',
    fontSize: 12,
  },
  timelineEvent: {
    color: '#F8FAFC',
    fontSize: 12,
  }
});
