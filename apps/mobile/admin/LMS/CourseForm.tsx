import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Switch, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { AnimatedFadeIn, AnimatedSlideUp, configureLayoutAnimation } from '../../core/animations';
import { ChevronLeft, ShieldAlert } from 'lucide-react-native';
import { colors } from '@nermai/theme';
import { CourseApi, BatchApi } from '@nermai/api';

export const CourseForm = ({ route, navigation }: { route: any, navigation: any }) => {
  const editingCourse = route.params?.course;
  const isEditing = !!editingCourse;
  
  const [activeSegment, setActiveSegment] = useState('Basic Info');
  const segments = ['Basic Info', 'Visibility', 'Review'];

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);

  useEffect(() => {
    if (isEditing) {
      setTitle(editingCourse.title || editingCourse.name || '');
      setDescription(editingCourse.description || '');
      setIsPublic(editingCourse.visibility === 'public');
      
      // Fetch all batches
      BatchApi.listBatches().then(res => {
        const allBatches = res.data?.data || res.data || [];
        setBatches(allBatches);
      }).catch(console.error);
    } else {
      BatchApi.listBatches().then(res => {
        const allBatches = res.data?.data || res.data || [];
        setBatches(allBatches);
      }).catch(console.error);
    }
  }, [isEditing, editingCourse]);

  const handleToggleBatch = async (batch: any, newValue: boolean) => {
    if (!isEditing) {
      Alert.alert('Notice', 'Please create the course first before assigning batches.');
      return;
    }

    try {
      const newCourseId = newValue ? editingCourse.id : 'unassigned';
      await BatchApi.updateBatch(batch.id, { courseId: newCourseId });
      setBatches(prev => prev.map(b => b.id === batch.id ? { ...b, courseId: newCourseId } : b));
    } catch (error) {
      console.error('Failed to toggle batch', error);
      Alert.alert('Error', 'Failed to update batch access.');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Course title is required.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: title,
        description,
        visibility: isPublic ? 'public' : 'private'
      };

      // In the future: Route via Offline Sync Queue
      if (isEditing) {
        await CourseApi.updateCourse(editingCourse.id, payload);
      } else {
        await CourseApi.createCourse(payload);
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save course', error);
      Alert.alert('Error', 'Failed to save course. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>{isEditing ? 'Edit Course' : 'New Course'}</Text>
        </View>

        {/* Segments Nav */}
        <View style={styles.segmentsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {segments.map((seg, i) => (
              <TouchableOpacity key={i} onPress={() => { configureLayoutAnimation(); setActiveSegment(seg); }}>
                <Text style={[styles.segmentText, activeSegment === seg && styles.activeSegmentText]}>
                  {seg}
                </Text>
                {activeSegment === seg && (
                  <View style={styles.activeIndicator} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Form Content */}
        <ScrollView style={styles.formContainer}>
          {activeSegment === 'Basic Info' && (
            <AnimatedFadeIn>
              <Text style={styles.label}>Course Title</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Complete Indian History" 
                placeholderTextColor={colors.textSecondary} 
                value={title}
                onChangeText={setTitle}
              />
              
              <Text style={styles.label}>Description</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                multiline 
                placeholder="Course description..." 
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
              />
            </AnimatedFadeIn>
          )}

          {activeSegment === 'Visibility' && (
            <AnimatedFadeIn>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Publicly Available</Text>
                <Switch 
                  trackColor={{ false: '#333', true: colors.primary }} 
                  value={isPublic} 
                  onValueChange={setIsPublic}
                />
              </View>
              <Text style={styles.helpText}>If disabled, only assigned batches can view this course.</Text>

              {!isPublic && (
                <View style={styles.batchesListContainer}>
                  <Text style={styles.label}>Batches with Access</Text>
                  {batches.length > 0 ? (
                    batches.map((b, idx) => {
                      const hasAccess = b.courseId === editingCourse?.id;
                      return (
                        <View key={idx} style={styles.batchItem}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <ShieldAlert size={16} color={hasAccess ? colors.accent : '#555'} />
                            <Text style={[styles.batchItemText, !hasAccess && { color: '#888' }]}>{b.name}</Text>
                          </View>
                          <Switch
                            trackColor={{ false: '#333', true: colors.primary }}
                            value={hasAccess}
                            onValueChange={(val) => handleToggleBatch(b, val)}
                          />
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.helpText}>No batches are currently assigned to this course. You can assign batches from the CRM/Batches module.</Text>
                  )}
                </View>
              )}
            </AnimatedFadeIn>
          )}

          {activeSegment === 'Review' && (
            <AnimatedSlideUp>
              <Text style={styles.reviewTitle}>Summary</Text>
              <Text style={styles.helpText}>Please review the settings before {isEditing ? 'saving changes' : 'publishing'}.</Text>
              <TouchableOpacity 
                style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} 
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Create Course'}</Text>
                )}
              </TouchableOpacity>
            </AnimatedSlideUp>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backButton: { marginRight: 16 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  segmentsContainer: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 20 },
  segmentText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600', marginRight: 24, paddingBottom: 12 },
  activeSegmentText: { color: colors.primary },
  activeIndicator: { position: 'absolute', bottom: -1, left: 0, right: 24, height: 2, backgroundColor: colors.primary },
  formContainer: { padding: 20, flex: 1 },
  label: { color: colors.textPrimary, fontSize: 16, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#FFF', borderRadius: 8, padding: 16, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  helpText: { color: colors.textSecondary, fontSize: 13, marginTop: 8 },
  selectorBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
  reviewTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: colors.background, fontSize: 18, fontWeight: 'bold' },
  batchesListContainer: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  batchItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', justifyContent: 'space-between' },
  batchItemText: { color: colors.textPrimary, marginLeft: 8, fontSize: 15, fontWeight: '500' }
});
