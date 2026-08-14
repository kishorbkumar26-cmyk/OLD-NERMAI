import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { AnimatedSlideUp } from '../../core/animations';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@nermai/theme';
import { CourseApi } from '@nermai/api';
import { TextField } from '../../components/ui/TextField';
import { Dropdown } from '../../components/ui/Dropdown';

export const ClassForm = ({ route, navigation }: { route: any, navigation: any }) => {
  const { topicId: initialTopicId, cls, breadcrumb } = route.params || {};
  const isEditing = !!cls;
  
  const [topicId, setTopicId] = useState(initialTopicId);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [topics, setTopics] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [classType, setClassType] = useState('recorded');
  const [provider, setProvider] = useState('zoom');
  const [customProviderId, setCustomProviderId] = useState('');
  const [providerPasscode, setProviderPasscode] = useState('');
  const [duration, setDuration] = useState('60');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  // Attendance State
  const [attendanceMode, setAttendanceMode] = useState('percentage');
  const [attendanceValue, setAttendanceValue] = useState('75');
  const [lockAfterStart, setLockAfterStart] = useState(true);
  
  const formatDateLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const formatTimeLocal = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  
  const [startDate, setStartDate] = useState(() => formatDateLocal(new Date()));
  const [startTime, setStartTime] = useState(() => formatTimeLocal(new Date()));
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!initialTopicId) {
      CourseApi.listCourses().then(res => {
        const fetchedCourses = res.data?.data || [];
        setCourses(fetchedCourses);
        if (fetchedCourses.length > 0) {
          setSelectedCourseId(fetchedCourses[0].id);
        }
      }).catch(err => console.error('Failed to fetch courses', err));
    }
  }, [initialTopicId]);

  useEffect(() => {
    if (selectedCourseId) {
      CourseApi.listSubjectsByCourse(selectedCourseId).then(res => {
        const fetchedSubjects = res.data?.data || [];
        setSubjects(fetchedSubjects);
        if (fetchedSubjects.length > 0) {
          setSelectedSubjectId(fetchedSubjects[0].id);
        } else {
          setSelectedSubjectId('');
          setTopics([]);
          setTopicId('');
        }
      }).catch(err => console.error('Failed to fetch subjects', err));
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedSubjectId) {
      CourseApi.listTopicsBySubject(selectedSubjectId).then(res => {
        const fetchedTopics = res.data?.data || [];
        setTopics(fetchedTopics);
        if (fetchedTopics.length > 0) {
          setTopicId(fetchedTopics[0].id);
        } else {
          setTopicId('');
        }
      }).catch(err => console.error('Failed to fetch topics', err));
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    if (isEditing) {
      setTitle(cls.title || cls.name || '');
      setClassType(cls.classType || 'recorded');
      setProvider(cls.liveSession?.provider || 'zoom');
      setDuration(String(cls.expectedDurationMinutes || 60));
      
      let initialYoutubeUrl = cls.youtubeUrl || '';
      if (!initialYoutubeUrl && cls.externalVideoId && (cls.classType === 'live' || cls.classType === 'recorded')) {
        initialYoutubeUrl = `https://www.youtube.com/watch?v=${cls.externalVideoId}`;
      }
      setYoutubeUrl(initialYoutubeUrl);
      
      if (cls.attendance) {
        setAttendanceMode(cls.attendance.mode || 'percentage');
        setAttendanceValue(String(cls.attendance.value || 75));
        setLockAfterStart(cls.attendance.lockAfterStart ?? true);
      }
      
      if (cls.scheduledStartTime) {
        const d = new Date(cls.scheduledStartTime);
        setStartDate(formatDateLocal(d));
        setStartTime(formatTimeLocal(d));
      } else {
        setStartDate(formatDateLocal(new Date()));
        setStartTime(formatTimeLocal(new Date()));
      }
    }
  }, [isEditing, cls]);

  const handleSave = async () => {
    if (!topicId) {
      Alert.alert('Validation Error', 'Please select a topic.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Class title is required.');
      return;
    }

    try {
      setIsSaving(true);
      const payload: any = {
        topicId,
        title,
        classType,
        expectedDurationMinutes: parseInt(duration) || 60,
        attendance: {
          mode: attendanceMode,
          value: parseFloat(attendanceValue) || 0,
          lockAfterStart,
          allowEditBeforeStart: true,
          version: isEditing && cls.attendance ? (cls.attendance.version || 1) + 1 : 1
        }
      };

      if (classType === 'recorded' && youtubeUrl.trim() !== '') {
        let finalUrl = youtubeUrl.trim();
        if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
        payload.youtubeUrl = finalUrl;
      }
      if (classType === 'live') {
        const timePart = startTime.length <= 5 ? `${startTime}:00` : startTime;
        const localDate = new Date(`${startDate}T${timePart.replace(/-/g, ':')}`);
        payload.scheduledStartTime = localDate.toISOString();
      }

      if (isEditing) {
        await CourseApi.updateClass(cls.id, payload);
      } else {
        await CourseApi.createClass(topicId, payload);
      }
      
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to save class', error);
      const serverMsg = error.response?.data?.message || '';
      const serverErrors = error.response?.data?.errors ? JSON.stringify(error.response.data.errors) : '';
      Alert.alert('Error', `Failed to save class. ${serverMsg} ${serverErrors}`);
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
          <View>
            <Text style={styles.breadcrumb}>{breadcrumb || 'Quick Actions'}</Text>
            <Text style={styles.pageTitle}>{isEditing ? 'Edit Class' : 'New Class'}</Text>
          </View>
        </View>

        <ScrollView style={styles.formContainer}>
          <AnimatedSlideUp>
            {!initialTopicId && (
              <View style={{ marginBottom: 16 }}>
                {courses.length > 0 && (
                  <Dropdown 
                    label="Select Course"
                    value={selectedCourseId}
                    options={courses.map(c => ({ label: c.name, value: c.id }))}
                    onSelect={setSelectedCourseId}
                  />
                )}
                {subjects.length > 0 && (
                  <Dropdown 
                    label="Select Subject"
                    value={selectedSubjectId}
                    options={subjects.map(s => ({ label: s.name, value: s.id }))}
                    onSelect={setSelectedSubjectId}
                  />
                )}
                {topics.length > 0 && (
                  <Dropdown 
                    label="Select Topic"
                    value={topicId}
                    options={topics.map(t => ({ label: t.name, value: t.id }))}
                    onSelect={setTopicId}
                  />
                )}
              </View>
            )}
            
            <TextField 
              label="Class Title" 
              placeholder="e.g. Introduction to Variables"
              value={title}
              onChangeText={setTitle}
            />

            <Dropdown 
              label="Class Type"
              value={classType}
              options={[
                { label: 'Recorded', value: 'recorded' },
                { label: 'Live', value: 'live' }
              ]}
              onSelect={setClassType}
            />

            {classType === 'live' && (
              <Dropdown 
                label="Live Provider"
                value={provider}
                options={[
                  { label: 'Zoom', value: 'zoom' },
                  { label: 'YouTube Live', value: 'youtube' }
                ]}
                onSelect={setProvider}
              />
            )}

            {classType === 'live' && provider === 'zoom' && (
              <View style={{ marginTop: 12, marginBottom: 12, padding: 12, backgroundColor: colors.surface, borderRadius: 8 }}>
                <Text style={{ color: colors.textSecondary, marginBottom: 12, fontSize: 14 }}>Advanced Options (Manual Zoom Room)</Text>
                <TextField 
                  label="Zoom Meeting ID (Optional)" 
                  placeholder="e.g. 123 456 7890"
                  value={customProviderId}
                  onChangeText={setCustomProviderId}
                />
                <TextField 
                  label="Passcode (Optional)" 
                  placeholder="Meeting Passcode"
                  value={providerPasscode}
                  onChangeText={setProviderPasscode}
                />
              </View>
            )}

            {classType === 'recorded' && (
              <TextField 
                label="YouTube URL" 
                placeholder="https://youtube.com/..."
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
              />
            )}

            {classType === 'live' && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <TextField 
                    label="Date" 
                    placeholder="YYYY-MM-DD"
                    value={startDate}
                    onChangeText={setStartDate}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextField 
                    label="Time" 
                    placeholder="HH:MM"
                    value={startTime}
                    onChangeText={setStartTime}
                  />
                </View>
              </View>
            )}

            <TextField 
              label="Duration (minutes)" 
              placeholder="e.g. 60"
              keyboardType="number-pad"
              value={duration}
              onChangeText={setDuration}
            />

            <View style={{ marginTop: 24, padding: 16, backgroundColor: colors.surface, borderRadius: 12 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Attendance Policy</Text>
              
              <Dropdown 
                label="Mode"
                value={attendanceMode}
                options={[
                  { label: 'Percentage', value: 'percentage' },
                  { label: 'Fixed Minutes', value: 'fixed_minutes' },
                  { label: 'Full Attendance', value: 'full' },
                  { label: 'Manual', value: 'manual' }
                ]}
                onSelect={setAttendanceMode}
              />

              {(attendanceMode === 'percentage' || attendanceMode === 'fixed_minutes') && (
                <TextField 
                  label={attendanceMode === 'percentage' ? "Percentage Required" : "Minutes Required"}
                  value={attendanceValue}
                  onChangeText={setAttendanceValue}
                  keyboardType="number-pad"
                />
              )}

              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}
                onPress={() => setLockAfterStart(!lockAfterStart)}
              >
                <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.primary, marginRight: 8, backgroundColor: lockAfterStart ? colors.primary : 'transparent' }} />
                <Text style={{ color: colors.textSecondary }}>Lock policy after class starts</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} 
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Create Class'}</Text>
              )}
            </TouchableOpacity>
          </AnimatedSlideUp>
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
  breadcrumb: { color: colors.textSecondary, fontSize: 10, textTransform: 'uppercase', marginBottom: 2 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  formContainer: { padding: 20, flex: 1 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  saveBtnText: { color: colors.background, fontSize: 18, fontWeight: 'bold' }
});
