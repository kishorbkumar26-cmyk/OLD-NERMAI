import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { AnimatedSlideUp } from '../../core/animations';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@nermai/theme';
import { BatchApi } from '@nermai/api';

export const BatchForm = ({ route, navigation }: { route: any, navigation: any }) => {
  const editingBatch = route.params?.batch;
  const courses = route.params?.courses || [];
  const isEditing = !!editingBatch;
  
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('100');
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState('');
  const [batchType, setBatchType] = useState('online');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setName(editingBatch.name || '');
      setCourseId(editingBatch.courseId || '');
      setMaxCapacity(String(editingBatch.maxCapacity || 100));
      setStatus(editingBatch.status || 'active');
      setBatchType(editingBatch.batchType || 'online');
      setStartDate(editingBatch.startDate ? new Date(editingBatch.startDate).toISOString().slice(0,10) : '');
    }
  }, [isEditing, editingBatch]);

  const handleSave = async () => {
    if (!name.trim() || !courseId) {
      Alert.alert('Validation Error', 'Batch Name and Course are required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name,
        courseId,
        maxCapacity: Number(maxCapacity),
        status,
        batchType,
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString()
      };

      if (isEditing) {
        await BatchApi.updateBatch(editingBatch.id, payload);
      } else {
        await BatchApi.createBatch(payload);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save batch', error);
      Alert.alert('Error', 'Failed to save batch.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft color={colors.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Batch' : 'New Batch'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AnimatedSlideUp>
          <Text style={styles.label}>Batch Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g., LDC Morning Batch"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />
          
          <Text style={[styles.label, { marginTop: 24 }]}>Belongs to Course</Text>
          <View style={styles.segmentContainer}>
            {courses.length === 0 && <Text style={{color: colors.textSecondary, padding: 12}}>No courses available</Text>}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {courses.map((c: any) => (
                <TouchableOpacity 
                  key={c.id}
                  style={[styles.segmentBtn, courseId === c.id && styles.segmentBtnActive]}
                  onPress={() => setCourseId(c.id)}
                >
                  <Text style={[styles.segmentBtnText, courseId === c.id && styles.segmentBtnTextActive]}>
                    {c.title || c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={[styles.label, { marginTop: 24 }]}>Batch Type</Text>
          <View style={styles.segmentContainer}>
            <TouchableOpacity 
              style={[styles.segmentBtn, {flex: 1}, batchType === 'online' && styles.segmentBtnActive]}
              onPress={() => setBatchType('online')}
            >
              <Text style={[styles.segmentBtnText, batchType === 'online' && styles.segmentBtnTextActive]}>Online</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentBtn, {flex: 1}, batchType === 'offline' && styles.segmentBtnActive]}
              onPress={() => setBatchType('offline')}
            >
              <Text style={[styles.segmentBtnText, batchType === 'offline' && styles.segmentBtnTextActive]}>Offline</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentBtn, {flex: 1}, batchType === 'recorded' && styles.segmentBtnActive]}
              onPress={() => setBatchType('recorded')}
            >
              <Text style={[styles.segmentBtnText, batchType === 'recorded' && styles.segmentBtnTextActive]}>Recorded</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.label, { marginTop: 24 }]}>Max Capacity</Text>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric"
                value={maxCapacity}
                onChangeText={setMaxCapacity}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.label, { marginTop: 24 }]}>Status</Text>
              <TouchableOpacity 
                style={styles.input}
                onPress={() => setStatus(status === 'active' ? 'upcoming' : 'active')}
              >
                <Text style={{color: status === 'active' ? '#34C759' : '#FF9500', fontWeight: 'bold'}}>
                  {status.toUpperCase()}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color={colors.background} /> : <Text style={styles.saveBtnText}>Save Batch</Text>}
          </TouchableOpacity>
        </AnimatedSlideUp>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  scrollContent: { padding: 20, paddingBottom: 100 },
  label: { color: colors.textSecondary, fontSize: 14, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, color: colors.textPrimary, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  segmentContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  segmentBtn: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', borderRadius: 8, marginRight: 4 },
  segmentBtnActive: { backgroundColor: colors.surface },
  segmentBtnText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  segmentBtnTextActive: { color: colors.primary },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 40 },
  saveBtnText: { color: colors.background, fontSize: 18, fontWeight: 'bold' }
});
