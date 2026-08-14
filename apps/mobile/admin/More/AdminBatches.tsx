import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { BatchApi, CourseApi } from '@nermai/api';
import { AnimatedStagger } from '../../core/animations';
import { Plus, Users, MoreVertical, ChevronLeft } from 'lucide-react-native';
import { ActionSheet } from '../../components/admin/ActionSheet';
import { colors } from '@nermai/theme';

export const AdminBatches = ({ navigation }: { navigation: any }) => {
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Action Sheet State
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    fetchData();
    return unsubscribe;
  }, [navigation]);

  const fetchData = async () => {
    try {
      const [batchRes, courseRes] = await Promise.all([
        BatchApi.listBatches(),
        CourseApi.listCourses()
      ]);
      setBatches(batchRes.data?.data || []);
      setCourses(courseRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openActionSheet = (batch: any) => {
    setSelectedBatch(batch);
    setSheetVisible(true);
  };

  const handleEdit = () => {
    setSheetVisible(false);
    if (!selectedBatch) return;
    setTimeout(() => {
      navigation.navigate('BatchForm', { batch: selectedBatch, courses });
    }, 300);
  };

  const handleDelete = async () => {
    setSheetVisible(false);
    if (!selectedBatch) return;
    try {
      setLoading(true);
      await BatchApi.deleteBatch(selectedBatch.id);
      fetchData();
    } catch (error: any) {
      alert('Error deleting batch.');
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const courseName = courses.find(c => c.id === item.courseId)?.title || 'No Course';
    
    return (
      <AnimatedStagger index={index}>
        <TouchableOpacity 
          style={styles.card} 
          activeOpacity={0.7}
          onPress={() => openActionSheet(item)}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.subtitle}>{courseName}</Text>
            </View>
            <View style={[styles.statusBadge, item.status === 'active' ? styles.statusActive : styles.statusUpcoming]}>
              <Text style={[styles.statusText, item.status === 'active' ? styles.statusTextActive : styles.statusTextUpcoming]}>
                {item.status?.toUpperCase() || 'UPCOMING'}
              </Text>
            </View>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.stat}>
              <Users size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.statText}>{item.currentEnrollment || 0} / {item.maxCapacity || 100} Enrolled</Text>
            </View>
            <MoreVertical size={20} color="#888" />
          </View>
        </TouchableOpacity>
      </AnimatedStagger>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Batches</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : batches.length === 0 ? (
          <View style={styles.center}>
            <Users size={48} color="#444" />
            <Text style={styles.emptyText}>No batches found.</Text>
          </View>
        ) : (
          <FlatList
            data={batches}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('BatchForm', { courses })}
        activeOpacity={0.8}
      >
        <Plus color="#121212" size={24} />
      </TouchableOpacity>

      <ActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={selectedBatch ? `Manage ${selectedBatch.name}` : ''}
        items={[
          { label: 'Edit Batch', onPress: handleEdit },
          { label: 'Delete Batch', onPress: handleDelete, destructive: true }
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10, paddingTop: Platform.OS === 'android' ? 40 : 10 },
  backBtn: { padding: 8, marginLeft: -8 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  container: { flex: 1, paddingHorizontal: 20 },
  listContent: { paddingBottom: 100, paddingTop: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 16, marginTop: 12 },
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 13 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusActive: { backgroundColor: 'rgba(52, 199, 89, 0.15)' },
  statusUpcoming: { backgroundColor: 'rgba(255, 149, 0, 0.15)' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  statusTextActive: { color: '#34C759' },
  statusTextUpcoming: { color: '#FF9500' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
  stat: { flexDirection: 'row', alignItems: 'center' },
  statText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }
});
