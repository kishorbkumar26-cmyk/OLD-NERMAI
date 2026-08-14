import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Platform } from 'react-native';
import { ResourceApi } from '@nermai/api';
import { FileText, ChevronRight, Search, Folder, Clock, DownloadCloud, Star, FolderOpen, ArrowLeft } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { ResourceStateManager } from '../../services/cache/ResourceStateManager';

const PAGE_SIZE = 20;

export const StudentResourcesPage = ({ navigation }: { navigation: any }) => {
  const [allResources, setAllResources] = useState<any[]>([]);
  const [displayedResources, setDisplayedResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Dynamic Folder Hierarchy (Breadcrumbs)
  const [path, setPath] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'Resources' }]);
  
  // Infinite Scroll State
  const [pageIndex, setPageIndex] = useState(1);
  
  // Local state cache for UI badging
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    fetchResources();
    loadLocalState();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      // Fetch all for local search/filtering (or implement pagination at API level if preferred)
      const response = await ResourceApi.list({ visibility: 'FREE' }); // Example params
      setAllResources(response.data?.data || response.data || []);
      setPageIndex(1);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocalState = async () => {
    const favs = await ResourceStateManager.getFavorites();
    setFavorites(favs);
  };

  // Local Search & Filtering Logic
  const filteredData = useMemo(() => {
    let result = allResources;

    // Apply Filter Chips
    if (activeFilter === 'Favorites') {
      result = result.filter(r => favorites.includes(r.id));
    } else if (activeFilter === 'PDF') {
      result = result.filter(r => r.type === 'PDF');
    } else if (activeFilter === 'PPT') {
      result = result.filter(r => r.type === 'PPT');
    }

    // Apply Local Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        (r.title && r.title.toLowerCase().includes(q)) || 
        (r.description && r.description.toLowerCase().includes(q)) ||
        (r.subject && r.subject.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allResources, searchQuery, activeFilter, favorites]);

  // Handle Lazy Loading / Pagination
  useEffect(() => {
    setDisplayedResources(filteredData.slice(0, PAGE_SIZE * pageIndex));
  }, [filteredData, pageIndex]);

  const handleLoadMore = () => {
    if (displayedResources.length < filteredData.length) {
      setPageIndex(prev => prev + 1);
    }
  };

  const handlePress = (resource: any) => {
    // If it's a folder, navigate deeper
    if (resource.isFolder) {
      setPath(prev => [...prev, { id: resource.id, name: resource.title }]);
      return;
    }
    
    // Otherwise open viewer
    navigation.navigate('ResourceViewer', { 
      resourceId: resource.id, 
      title: resource.title,
      mimeType: resource.type === 'PDF' ? 'application/pdf' : 'application/octet-stream',
      signedUrl: resource.url || '', // Passed safely
      version: resource.version || 1, 
      checksum: resource.checksum || ''
    });
  };

  const handleBreadcrumbClick = (index: number) => {
    setPath(prev => prev.slice(0, index + 1));
  };

  const renderFilterChip = (label: string) => {
    const isActive = activeFilter === label;
    return (
      <TouchableOpacity 
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => { setActiveFilter(label); setPageIndex(1); }}
      >
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isFav = favorites.includes(item.id);
    const isFolder = item.isFolder;

    return (
      <TouchableOpacity style={styles.card} onPress={() => handlePress(item)} activeOpacity={0.7}>
        <BlurView intensity={20} tint="dark" style={styles.cardBlur}>
          <View style={styles.iconContainer}>
            {isFolder ? <Folder size={28} color="#D4AF37" /> : <FileText size={28} color="#10b981" />}
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            
            {!isFolder && (
              <View style={styles.metaRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.type || 'PDF'}</Text>
                </View>
                {item.fileSize ? (
                   <Text style={styles.metaText}>{(item.fileSize / 1024 / 1024).toFixed(1)} MB</Text>
                ) : null}
                <Text style={styles.metaText}>•</Text>
                <Text style={styles.metaText}>
                  {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          {!isFolder && isFav && (
            <Star size={16} color="#D4AF37" fill="#D4AF37" style={{ marginRight: 12 }} />
          )}
          
          <ChevronRight size={20} color="#64748b" />
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header & Search */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Resource Center</Text>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#94a3b8" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search materials, subjects..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={(t) => { setSearchQuery(t); setPageIndex(1); }}
          />
        </View>

        {/* Filter Chips */}
        <View style={styles.filtersWrapper}>
           <FlatList 
             horizontal 
             showsHorizontalScrollIndicator={false}
             data={['All', 'Favorites', 'PDF', 'PPT', 'Recent']}
             keyExtractor={i => i}
             renderItem={({item}) => renderFilterChip(item)}
             contentContainerStyle={styles.filterList}
           />
        </View>
      </View>

      {/* Breadcrumbs */}
      {path.length > 1 && (
        <View style={styles.breadcrumbs}>
          {path.map((crumb, index) => (
             <React.Fragment key={crumb.id}>
               {index > 0 && <ChevronRight size={14} color="#64748b" style={{ marginHorizontal: 4 }} />}
               <TouchableOpacity onPress={() => handleBreadcrumbClick(index)}>
                 <Text style={[styles.crumbText, index === path.length - 1 && styles.crumbTextActive]}>
                   {crumb.name}
                 </Text>
               </TouchableOpacity>
             </React.Fragment>
          ))}
        </View>
      )}

      {/* Content List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : displayedResources.length === 0 ? (
        <View style={styles.center}>
          <FolderOpen size={64} color="#334155" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Nothing Here</Text>
          <Text style={styles.emptyText}>No resources found in this section.</Text>
        </View>
      ) : (
        <FlatList
          data={displayedResources}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060913',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#131B2F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.15)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8F8F8',
    fontSize: 15,
  },
  filtersWrapper: {
    marginLeft: -16,
    marginRight: -16,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: '#D4AF37',
  },
  filterChipText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: '#D4AF37',
  },
  breadcrumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0A0F1D',
  },
  crumbText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  crumbTextActive: {
    color: '#F8F8F8',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F8F8F8',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8F8F8',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
