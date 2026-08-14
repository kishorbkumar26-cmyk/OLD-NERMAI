import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { ResourceApi } from '@nermai/api';
import { ResourceCard } from '../../components/admin/ResourceCard';
import { AdminFAB } from '../../components/admin/AdminFAB';
import { ChevronLeft, Upload } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ActionSheet } from '../../components/admin/ActionSheet';
import { colors } from '@nermai/theme';

export const AdminResources = ({ navigation }: { navigation: any }) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [uploadSheetVisible, setUploadSheetVisible] = useState(false);
  const [optionsSheetVisible, setOptionsSheetVisible] = useState(false);
  const [selectedResource, setSelectedResource] = useState<any>(null);
  
  // Refresh listener
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchResources();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await ResourceApi.list({});
      setResources(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('Selected file:', file.name, file.uri);
        // Implement upload logic to backend using ResourceApi
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  const handleDelete = () => {
    setOptionsSheetVisible(false);
    if (!selectedResource) return;
    
    Alert.alert(
      'Delete Resource',
      `Are you sure you want to delete "${selectedResource.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await ResourceApi.deleteResource(selectedResource.id);
              fetchResources();
            } catch (error) {
              console.error('Failed to delete', error);
              Alert.alert('Error', 'Failed to delete resource');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <ResourceCard
      title={item.title}
      type={item.type || 'PDF'}
      batchInfo={`${item.batchIds?.length || 0} Batches`}
      isFeatured={item.isFeatured}
      version={`v${item.version || 1}`}
      delay={index * 100}
      onOptionsPress={() => {
        setSelectedResource(item);
        setOptionsSheetVisible(true);
      }}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color="#F8F8F8" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Resources</Text>
        </View>
        
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : resources.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No resources found.</Text>
          </View>
        ) : (
          <FlatList
            data={resources}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        <AdminFAB label="Upload" onPress={() => setUploadSheetVisible(true)} icon={<Upload size={20} color={colors.background} />} />
      </View>

      <ActionSheet
        visible={uploadSheetVisible}
        onClose={() => setUploadSheetVisible(false)}
        title="Create Resource"
        items={[
          { label: 'Upload Asset', onPress: () => {
            setUploadSheetVisible(false);
            navigation.navigate('ResourceForm');
          }}
        ]}
      />

      <ActionSheet
        visible={optionsSheetVisible}
        onClose={() => setOptionsSheetVisible(false)}
        title={selectedResource ? `Manage ${selectedResource.title}` : ''}
        items={[
          { label: 'Edit Asset', onPress: () => {
            setOptionsSheetVisible(false);
            navigation.navigate('ResourceForm', { resource: selectedResource });
          }},
          { label: 'Delete', onPress: handleDelete, destructive: true }
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingTop: 10 },
  backButton: { marginRight: 12, padding: 4 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  listContent: { paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 16 }
});
