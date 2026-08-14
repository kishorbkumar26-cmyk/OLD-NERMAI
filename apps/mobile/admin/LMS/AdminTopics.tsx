import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert, Platform } from 'react-native';
import { CourseApi } from '@nermai/api';
import { CourseCard } from '../../components/admin/CourseCard';
import { AdminFAB } from '../../components/admin/AdminFAB';
import { ActionSheet } from '../../components/admin/ActionSheet';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@nermai/theme';
import { TopicFormSheet } from './TopicFormSheet';

export const AdminTopics = ({ route, navigation }: { route: any, navigation: any }) => {
  const { subjectId, subjectTitle, courseTitle } = route.params;
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ActionSheet State
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<any>(null);

  // Form Sheet State
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await CourseApi.listTopicsBySubject(subjectId);
      const data = response.data?.data || response.data || [];
      const enriched = data.map((t: any) => ({
        ...t,
        metrics: [
          { label: 'Classes', value: t.classCount || 0 },
          { label: 'Resources', value: t.resourceCount || 0 }
        ]
      }));
      setTopics(enriched);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const openActionSheet = (topic: any) => {
    setSelectedTopic(topic);
    setSheetVisible(true);
  };

  const handleEdit = () => {
    setSheetVisible(false);
    setTimeout(() => setFormVisible(true), 400);
  };

  const handleDuplicate = async () => {
    if (!selectedTopic) return;
    try {
      await CourseApi.createTopic(subjectId, {
        ...selectedTopic,
        id: undefined,
        name: `${selectedTopic.name || selectedTopic.title} (Copy)`
      });
      fetchTopics();
    } catch (err) {
      Alert.alert('Error', 'Failed to duplicate topic.');
    }
  };

  const handleDelete = () => {
    if (!selectedTopic) return;
    const msg = `Deleting this Topic will remove all its Classes and Resources.\n\nAre you sure you want to delete "${selectedTopic.name || selectedTopic.title}"?`;
    const executeDelete = async () => {
      try {
        setSheetVisible(false);
        await CourseApi.deleteTopic(selectedTopic.id);
        await fetchTopics();
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || err?.message || 'Failed to delete topic.';
        if (Platform.OS === 'web') { window.alert(errMsg); } else { Alert.alert('Error', errMsg); }
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) executeDelete();
    } else {
      Alert.alert('Delete Topic?', msg, [
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
      onPress={() => navigation.navigate('AdminClasses', { topicId: item.id, topicTitle: item.name || item.title, breadcrumb: `${courseTitle} > ${subjectTitle}` })}
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
            <Text style={styles.breadcrumb}>{courseTitle} {'>'} {subjectTitle}</Text>
            <Text style={styles.pageTitle}>Topics</Text>
          </View>
        </View>
        
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : topics.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No topics found in this subject.</Text>
          </View>
        ) : (
          <FlatList
            data={topics}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        <AdminFAB label="+ Topic" onPress={() => { setSelectedTopic(null); setFormVisible(true); }} />

        <ActionSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          title={selectedTopic ? `Manage ${selectedTopic.name || selectedTopic.title}` : ''}
          items={[
            { label: 'Edit', onPress: handleEdit },
            { label: 'Duplicate', onPress: handleDuplicate },
            { label: 'View Details', onPress: () => navigation.navigate('AdminClasses', { topicId: selectedTopic?.id, topicTitle: selectedTopic?.name, breadcrumb: `${courseTitle} > ${subjectTitle}` }) },
            { label: 'Delete', onPress: handleDelete, destructive: true }
          ]}
        />

        <TopicFormSheet 
          visible={formVisible} 
          onClose={() => setFormVisible(false)} 
          subjectId={subjectId}
          existingTopic={selectedTopic}
          onSuccess={fetchTopics}
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 16 }
});
