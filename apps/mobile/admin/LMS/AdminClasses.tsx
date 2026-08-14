import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CourseApi, LiveSessionApi } from '@nermai/api';
import { CourseCard } from '../../components/admin/CourseCard';
import { AdminFAB } from '../../components/admin/AdminFAB';
import { ActionSheet } from '../../components/admin/ActionSheet';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@nermai/theme';

export const AdminClasses = ({ route, navigation }: { route: any, navigation: any }) => {
  const { topicId, topicTitle, breadcrumb } = route.params;
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      fetchClasses();
      
      // Simulating server time synchronization.
      // In production, backend should return serverTime on fetch, and we set offset = serverTime - Date.now()
      setServerTimeOffset(0);
    }, [topicId])
  );

  const fetchClasses = async () => {
    try {
      const response = await CourseApi.listClassesByTopic(topicId);
      const data = response.data?.data || response.data || [];
      const enriched = data.map((c: any) => ({
        ...c,
        metrics: [
          { label: 'Type', value: c.classType === 'live' ? 'Live' : 'Recorded' },
          { label: 'Status', value: c.classType === 'live' ? (c.liveSession?.status || 'SCHEDULED') : 'N/A' },
          { label: 'Duration', value: `${c.expectedDurationMinutes || 0} mins` }
        ]
      }));
      setClasses(enriched);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const openActionSheet = (cls: any) => {
    setSelectedClass(cls);
    setSheetVisible(true);
  };

  const handleDuplicate = async () => {
    if (!selectedClass) return;
    try {
      await CourseApi.createClass(topicId, {
        ...selectedClass,
        id: undefined,
        title: `${selectedClass.title || selectedClass.name} (Copy)`
      });
      fetchClasses();
      setSheetVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to duplicate class.');
    }
  };

  const handleDelete = () => {
    if (!selectedClass) return;
    const msg = `Are you sure you want to delete the class "${selectedClass.title || selectedClass.name}"?`;
    
    const executeDelete = async () => {
      try {
        setSheetVisible(false);
        if (selectedClass.classType === 'live' && selectedClass.liveSession?.id) {
          try {
            await LiveSessionApi.deleteSession(selectedClass.liveSession.id);
          } catch (e) {
            console.warn('Failed to delete associated live session', e);
          }
        }
        await CourseApi.deleteClass(selectedClass.id);
        await fetchClasses();
      } catch (err: any) {
        if (Platform.OS === 'web') {
          window.alert(err?.response?.data?.message || err.message || 'Failed to delete class.');
        } else {
          Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to delete class.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Delete Class?',
        msg,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: executeDelete }
        ]
      );
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <CourseCard
      title={item.title || item.name}
      subtitle={item.classType === 'live' && item.scheduledStartTime ? `Live at ${new Date(item.scheduledStartTime).toLocaleString()}` : 'Pre-recorded'}
      metrics={item.metrics}
      delay={index * 100}
      onPress={() => {
        navigation.navigate('ClassForm', { topicId, cls: item, breadcrumb: `${breadcrumb} > ${topicTitle}` });
      }}
      onOptionsPress={() => openActionSheet(item)}
    />
  );

  const getActionSheetItems = () => {
    const items: any[] = [
      { 
        label: 'Edit', 
        onPress: () => {
          setSheetVisible(false);
          navigation.navigate('ClassForm', { topicId, cls: selectedClass, breadcrumb: `${breadcrumb} > ${topicTitle}` });
        }
      },
      { label: 'Duplicate', onPress: handleDuplicate }
    ];

    if (selectedClass?.classType === 'live') {
      items.push({ 
        label: 'Live Console', 
        onPress: () => {
          setSheetVisible(false);
          navigation.navigate('More', {
            screen: 'LiveAttendanceControl',
            params: { session: selectedClass }
          });
        }
      });
    }

    items.push({ label: 'Delete', onPress: handleDelete, destructive: true });
    return items;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color="#F8F8F8" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.breadcrumb}>{breadcrumb} {'>'} {topicTitle}</Text>
            <Text style={styles.pageTitle}>Classes</Text>
          </View>
        </View>
        
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : classes.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No classes found in this topic.</Text>
          </View>
        ) : (
          <FlatList
            data={classes}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        <AdminFAB label="+ Class" onPress={() => navigation.navigate('ClassForm', { topicId, breadcrumb: `${breadcrumb} > ${topicTitle}` })} />

        <ActionSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          title={selectedClass ? `Manage ${selectedClass.title || selectedClass.name}` : ''}
          items={getActionSheetItems()}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingTop: 10 },
  backButton: { marginRight: 12, padding: 4 },
  breadcrumb: { color: colors.textSecondary, fontSize: 10, textTransform: 'uppercase', marginBottom: 2 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  listContent: { paddingBottom: 100 },
  emptyText: { color: colors.textSecondary, fontSize: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
