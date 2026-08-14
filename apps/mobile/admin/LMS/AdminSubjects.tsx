import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert, Platform } from 'react-native';
import { CourseApi } from '@nermai/api';
import { CourseCard } from '../../components/admin/CourseCard';
import { AdminFAB } from '../../components/admin/AdminFAB';
import { ActionSheet } from '../../components/admin/ActionSheet';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@nermai/theme';
import { SubjectFormSheet } from './SubjectFormSheet';

export const AdminSubjects = ({ route, navigation }: { route: any, navigation: any }) => {
  const { courseId, courseTitle } = route.params;
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ActionSheet State
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  // Form Sheet State
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await CourseApi.listSubjectsByCourse(courseId);
      const data = response.data?.data || response.data || [];
      const enriched = data.map((s: any) => ({
        ...s,
        metrics: [
          { label: 'Topics', value: s.topicCount || 0 },
          { label: 'Classes', value: s.classCount || 0 }
        ]
      }));
      setSubjects(enriched);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const openActionSheet = (subject: any) => {
    setSelectedSubject(subject);
    setSheetVisible(true);
  };

  const handleEdit = () => {
    setSheetVisible(false);
    setTimeout(() => setFormVisible(true), 400);
  };

  const handleDuplicate = async () => {
    if (!selectedSubject) return;
    try {
      await CourseApi.createSubject(courseId, {
        ...selectedSubject,
        id: undefined,
        name: `${selectedSubject.name || selectedSubject.title} (Copy)`
      });
      fetchSubjects();
    } catch (err) {
      Alert.alert('Error', 'Failed to duplicate subject.');
    }
  };

  const handleDelete = () => {
    if (!selectedSubject) return;
    const msg = `Deleting this Subject will remove all its Topics and Classes.\n\nAre you sure you want to delete "${selectedSubject.name || selectedSubject.title}"?`;
    const executeDelete = async () => {
      try {
        setSheetVisible(false);
        await CourseApi.deleteSubject(selectedSubject.id);
        await fetchSubjects();
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete subject.';
        if (Platform.OS === 'web') { window.alert(errMsg); } else { Alert.alert('Error', errMsg); }
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) executeDelete();
    } else {
      Alert.alert('Delete Subject?', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete }
      ]);
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <CourseCard
      title={item.name || item.title}
      subtitle={`Sequence: ${item.sequenceIndex || 0}`}
      metrics={item.metrics}
      delay={index * 100}
      onPress={() => navigation.navigate('AdminTopics', { subjectId: item.id, subjectTitle: item.name || item.title, courseTitle })}
      onOptionsPress={() => openActionSheet(item)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color="#F8F8F8" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.breadcrumb}>{courseTitle}</Text>
            <Text style={styles.pageTitle}>Subjects</Text>
          </View>
        </View>
        
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : subjects.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No subjects found in this course.</Text>
          </View>
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        <AdminFAB label="+ Subject" onPress={() => { setSelectedSubject(null); setFormVisible(true); }} />

        <ActionSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          title={selectedSubject ? `Manage ${selectedSubject.name || selectedSubject.title}` : ''}
          items={[
            { label: 'Edit', onPress: handleEdit },
            { label: 'Duplicate', onPress: handleDuplicate },
            { label: 'View Details', onPress: () => navigation.navigate('AdminTopics', { subjectId: selectedSubject?.id, subjectTitle: selectedSubject?.name, courseTitle }) },
            { label: 'Delete', onPress: handleDelete, destructive: true }
          ]}
        />

        <SubjectFormSheet 
          visible={formVisible} 
          onClose={() => setFormVisible(false)} 
          courseId={courseId}
          existingSubject={selectedSubject}
          onSuccess={fetchSubjects}
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
  breadcrumb: { color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase', marginBottom: 2 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  listContent: { paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 16 }
});
