import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CourseApi } from '@nermai/api';
import { CourseCard } from '../../components/admin/CourseCard';
import { AdminFAB } from '../../components/admin/AdminFAB';
import { ActionSheet } from '../../components/admin/ActionSheet';
import { colors } from '@nermai/theme';

export const AdminCourses = ({ navigation }: { navigation: any }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ActionSheet State
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchCourses();
    }, [])
  );

  const fetchCourses = async () => {
    try {
      const response = await CourseApi.listCourses();
      // Fetch subjects and classes to enrich metrics (mocked metrics for now if not returned by API)
      const data = response.data?.data || response.data || [];
      const enriched = data.map((c: any) => ({
        ...c,
        metrics: [
          { label: 'Subjects', value: c.subjectCount || 0 },
          { label: 'Classes', value: c.classCount || 0 },
          { label: 'Students', value: c.studentCount || 0 }
        ]
      }));
      setCourses(enriched);
    } catch (error) {
      console.error('Failed to fetch admin courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const openActionSheet = (course: any) => {
    setSelectedCourse(course);
    setSheetVisible(true);
  };

  const handleDelete = () => {
    if (!selectedCourse) return;
    const msg = `Deleting this Course will remove all its Subjects, Topics, and Classes.\n\nAre you sure you want to delete "${selectedCourse.title || selectedCourse.name}"?`;
    const executeDelete = async () => {
      try {
        setSheetVisible(false);
        await CourseApi.deleteCourse(selectedCourse.id);
        await fetchCourses();
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete course.';
        if (Platform.OS === 'web') { window.alert(errMsg); } else { Alert.alert('Error', errMsg); }
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) executeDelete();
    } else {
      Alert.alert('Delete Course?', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete }
      ]);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedCourse) return;
    try {
      // In the future: Route via Offline Sync Queue
      await CourseApi.createCourse({
        ...selectedCourse,
        id: undefined,
        title: `${selectedCourse.title || selectedCourse.name} (Copy)`
      });
      fetchCourses();
    } catch (err) {
      Alert.alert('Error', 'Failed to duplicate course.');
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <CourseCard
      title={item.title || item.name}
      subtitle={`${item.visibility === 'public' ? 'Public' : 'Batch Restricted'} • ${item.batchIds?.length || 0} Batches`}
      metrics={item.metrics}
      delay={index * 100}
      onPress={() => navigation.navigate('AdminSubjects', { courseId: item.id, courseTitle: item.title || item.name })}
      onOptionsPress={() => openActionSheet(item)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Courses</Text>
        
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No courses found.</Text>
          </View>
        ) : (
          <FlatList
            data={courses}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        <AdminFAB label="+ Course" onPress={() => navigation.navigate('CourseForm')} />
        
        <ActionSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          title={selectedCourse ? `Manage ${selectedCourse.title || selectedCourse.name}` : ''}
          items={[
            { label: 'Edit', onPress: () => navigation.navigate('CourseForm', { course: selectedCourse }) },
            { label: 'Duplicate', onPress: handleDuplicate },
            { label: 'View Details', onPress: () => navigation.navigate('AdminSubjects', { courseId: selectedCourse?.id, courseTitle: selectedCourse?.title }) },
            { label: 'Archive', onPress: () => Alert.alert('Notice', 'Archive feature coming soon.') },
            { label: 'Delete', onPress: handleDelete, destructive: true }
          ]}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 20 },
  listContent: { paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 16 }
});
