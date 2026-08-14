import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Platform } from 'react-native';
import { ChevronLeft, Plus, Trash2, Upload } from 'lucide-react-native';
import { colors } from '@nermai/theme';
import { ResourceApi, CourseApi, BatchApi } from '@nermai/api';
import { TextField } from '../../components/ui/TextField';
import { Dropdown } from '../../components/ui/Dropdown';
import * as DocumentPicker from 'expo-document-picker';

export const ResourceForm = ({ route, navigation }: { route: any, navigation: any }) => {
  const { resource } = route.params || {};
  const isEditing = !!resource;
  
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  
  // Lookups
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  // 1. Core
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PDF');
  const [status, setStatus] = useState('published');
  
  // 2. Source
  const [uploadMode, setUploadMode] = useState<'file' | 'drive' | 'firebase'>('file');
  const [externalUrl, setExternalUrl] = useState('');
  const [file, setFile] = useState<any>(null);

  // 3. Metadata
  const [author, setAuthor] = useState('');
  const [language, setLanguage] = useState('English');
  const [pageCount, setPageCount] = useState('');
  const [tags, setTags] = useState('');

  // 4. Access & Visibility
  const [visibility, setVisibility] = useState('public');
  const [displayGroup, setDisplayGroup] = useState('normal');
  const [targetBatchIds, setTargetBatchIds] = useState<string[]>([]);
  const [isSecure, setIsSecure] = useState(true);
  const [offlineAvailable, setOfflineAvailable] = useState(true);
  
  // 5. Distribution
  const [isGeneral, setIsGeneral] = useState(false);
  const [distributions, setDistributions] = useState<any[]>([]);

  useEffect(() => {
    fetchLookups();
  }, []);

  const fetchLookups = async () => {
    try {
      // Execute synchronously to avoid overloading the database and triggering 500 timeouts
      const cRes = await CourseApi.listCourses();
      const sRes = await CourseApi.listAllSubjects();
      const tRes = await CourseApi.listAllTopics();
      const clRes = await CourseApi.listAllClasses();
      const bRes = await BatchApi.listBatches();
      
      const c = cRes.data.data || cRes.data;
      const s = sRes.data.data || sRes.data;
      const t = tRes.data.data || tRes.data;
      const cl = clRes.data.data || clRes.data;
      const b = bRes.data.data || bRes.data;

      setCourses(c);
      setSubjects(s);
      setTopics(t);
      setClasses(cl);
      setBatches(b);

      if (isEditing) {
        setTitle(resource.title || '');
        setDescription(resource.description || '');
        setType(resource.type || 'PDF');
        setStatus(resource.status || 'published');
        
        if (resource.provider === 'google_drive' || resource.provider === 'external_link') {
          setUploadMode('drive');
        } else if (resource.provider === 'firebase_asset') {
          setUploadMode('firebase');
        } else {
          setUploadMode('file');
        }
        setExternalUrl(resource.sourceUrl || '');
        
        setAuthor(resource.author || '');
        setLanguage(resource.language || 'English');
        setPageCount(resource.pageCount ? String(resource.pageCount) : '');
        setTags(resource.tags ? resource.tags.join(', ') : '');
        
        setVisibility(resource.visibility || 'public');
        setDisplayGroup(resource.displayGroup || 'normal');
        setTargetBatchIds(resource.targetBatchIds || []);
        setIsSecure(resource.isSecure !== false);
        setOfflineAvailable(resource.offlineAvailable !== false);
        
        setIsGeneral(resource.isGeneral || false);
        
        const initDists: any[] = [];
        resource.courseIds?.forEach((id: string) => initDists.push({ type: 'course', courseId: id }));
        resource.subjectIds?.forEach((id: string) => {
          const subj = s.find((x:any) => x.id === id);
          initDists.push({ type: 'subject', courseId: subj?.courseId || '', subjectId: id });
        });
        resource.topicIds?.forEach((id: string) => {
          const top = t.find((x:any) => x.id === id);
          const subj = s.find((x:any) => x.id === top?.subjectId);
          initDists.push({ type: 'topic', courseId: subj?.courseId || '', subjectId: top?.subjectId || '', topicId: id });
        });
        resource.classIds?.forEach((id: string) => {
          const cls = cl.find((x:any) => x.id === id);
          const top = t.find((x:any) => x.id === cls?.topicId);
          const subj = s.find((x:any) => x.id === top?.subjectId);
          initDists.push({ type: 'class', courseId: subj?.courseId || '', subjectId: top?.subjectId || '', topicId: cls?.topicId || '', classId: id });
        });
        setDistributions(initDists);
      }
    } catch (error) {
      console.error('Failed to load lookups', error);
      Alert.alert('Error', 'Failed to load system data');
    } finally {
      setInitLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Document picker error:', error);
    }
  };

  const addDistribution = () => {
    setDistributions([...distributions, { type: 'course', courseId: '', subjectId: '', topicId: '', classId: '' }]);
  };

  const updateDist = (index: number, field: string, value: string) => {
    const newDists = [...distributions];
    newDists[index][field] = value;
    if (field === 'type') {
      newDists[index].courseId = '';
      newDists[index].subjectId = '';
      newDists[index].topicId = '';
      newDists[index].classId = '';
    }
    if (field === 'courseId') { newDists[index].subjectId = ''; newDists[index].topicId = ''; newDists[index].classId = ''; }
    if (field === 'subjectId') { newDists[index].topicId = ''; newDists[index].classId = ''; }
    if (field === 'topicId') { newDists[index].classId = ''; }
    setDistributions(newDists);
  };

  const removeDist = (index: number) => {
    const newDists = [...distributions];
    newDists.splice(index, 1);
    setDistributions(newDists);
  };

  const toggleBatch = (batchId: string) => {
    if (targetBatchIds.includes(batchId)) {
      setTargetBatchIds(targetBatchIds.filter(id => id !== batchId));
    } else {
      setTargetBatchIds([...targetBatchIds, batchId]);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Title and Description are required.');
      return;
    }

    try {
      setLoading(true);

      const courseIds = new Set<string>();
      const subjectIds = new Set<string>();
      const topicIds = new Set<string>();
      const classIds = new Set<string>();

      distributions.forEach(d => {
        if (d.type === 'course' && d.courseId) courseIds.add(d.courseId);
        if (d.type === 'subject' && d.subjectId) subjectIds.add(d.subjectId);
        if (d.type === 'topic' && d.topicId) topicIds.add(d.topicId);
        if (d.type === 'class' && d.classId) classIds.add(d.classId);
      });

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);
      formData.append('categoryId', 'reference');
      formData.append('displayGroup', displayGroup);
      formData.append('visibility', visibility);
      formData.append('status', status);
      formData.append('isGeneral', isGeneral.toString());
      formData.append('offlineAvailable', offlineAvailable.toString());
      formData.append('isSecure', (visibility === 'public' ? isSecure : true).toString());
      
      if (author) formData.append('author', author);
      if (language) formData.append('language', language);
      if (pageCount) formData.append('pageCount', pageCount);
      if (tags) formData.append('tags', JSON.stringify(tags.split(',').map((t: string)=>t.trim()).filter(Boolean)));

      if (targetBatchIds.length > 0 && visibility === 'batch') formData.append('targetBatchIds', JSON.stringify(targetBatchIds));
      formData.append('courseIds', JSON.stringify(Array.from(courseIds)));
      formData.append('subjectIds', JSON.stringify(Array.from(subjectIds)));
      formData.append('topicIds', JSON.stringify(Array.from(topicIds)));
      formData.append('classIds', JSON.stringify(Array.from(classIds)));

      if (isEditing) {
        // UPDATE (Simplified payload for update)
        const updatePayload = {
          title, description, type, categoryId: 'reference', displayGroup, visibility, status, isGeneral, offlineAvailable,
          isSecure: visibility === 'public' ? isSecure : true,
          author, language, pageCount, tags: tags.split(',').map((t: string)=>t.trim()),
          targetBatchIds: visibility === 'batch' ? targetBatchIds : [],
          courseIds: Array.from(courseIds),
          subjectIds: Array.from(subjectIds),
          topicIds: Array.from(topicIds),
          classIds: Array.from(classIds)
        };
        await ResourceApi.updateResource(resource.id, updatePayload);
        
        if (file) {
          const versionData = new FormData();
          versionData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream'
          } as any);
          await ResourceApi.uploadNewVersion(resource.id, versionData);
        }
      } else {
        // CREATE
        if (uploadMode === 'file' && !file) {
          setLoading(false);
          Alert.alert('Error', 'Please select a file to upload.');
          return;
        }
        if ((uploadMode === 'drive' || uploadMode === 'firebase') && !externalUrl) {
          setLoading(false);
          Alert.alert('Error', 'Please provide the URL.');
          return;
        }
        
        if (uploadMode === 'file' && file) {
          formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/octet-stream'
          } as any);
        } else {
          let parsedUrl = externalUrl;
          if (uploadMode === 'drive') {
            const match = externalUrl.match(/[-\w]{25,}/);
            if (match) {
              parsedUrl = match[0];
            } else {
              setLoading(false);
              Alert.alert('Error', 'Could not extract Google Drive File ID. Please ensure you paste a valid Google Drive shareable link.');
              return;
            }
          }
          formData.append('externalUrl', parsedUrl);
          formData.append('provider', uploadMode === 'drive' ? 'google_drive' : 'firebase_asset');
        }

        await ResourceApi.createResource(formData);
      }

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save resource', error);
      Alert.alert('Error', 'Failed to save resource. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>{isEditing ? 'Edit Resource' : 'New Resource'}</Text>
        </View>

        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 100 }}>
          
          <Text style={styles.sectionTitle}>1. Core Identity</Text>
          <TextField label="Asset Title" placeholder="e.g. History Notes" value={title} onChangeText={setTitle} />
          <TextField label="Description" placeholder="Description..." value={description} onChangeText={setDescription} />
          
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Dropdown label="Type" value={type} onSelect={setType} options={[
                { label: 'PDF', value: 'PDF' }, { label: 'Video', value: 'VIDEO_ATTACHMENT' }, { label: 'Link', value: 'LINK' }
              ]} />
            </View>
            <View style={{ flex: 1 }}>
              <Dropdown label="Status" value={status} onSelect={setStatus} options={[
                { label: 'Draft', value: 'draft' }, { label: 'Published', value: 'published' }
              ]} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>2. Asset Source (Firebase / Google Drive)</Text>
          <View style={styles.tabsRow}>
            <TouchableOpacity onPress={() => setUploadMode('file')} style={[styles.tabBtn, uploadMode==='file' && styles.tabBtnActive]}>
              <Text style={[styles.tabText, uploadMode==='file' && styles.tabTextActive]}>Upload PDF (Firebase)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setUploadMode('drive')} style={[styles.tabBtn, uploadMode==='drive' && styles.tabBtnActive]}>
              <Text style={[styles.tabText, uploadMode==='drive' && styles.tabTextActive]}>Paste Google Drive Link</Text>
            </TouchableOpacity>
          </View>

          {uploadMode === 'file' ? (
            <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
              <Upload size={32} color={colors.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={{ color: colors.textPrimary }}>{file ? file.name : 'Tap to select file'}</Text>
            </TouchableOpacity>
          ) : (
            <TextField label="Source URL" placeholder="https://..." value={externalUrl} onChangeText={setExternalUrl} />
          )}

          <Text style={styles.sectionTitle}>3. Visibility & Access</Text>
          <Dropdown label="Visibility" value={visibility} onSelect={setVisibility} options={[
            { label: 'Public (Everyone)', value: 'public' },
            { label: 'Specific Batches', value: 'batch' },
            { label: 'Premium Only', value: 'premium' }
          ]} />
          
          {visibility === 'batch' && (
            <View style={styles.batchesContainer}>
              <Text style={styles.label}>Select Target Batches</Text>
              {batches.map(b => (
                <TouchableOpacity key={b.id} style={styles.checkboxRow} onPress={() => toggleBatch(b.id)}>
                  <View style={[styles.checkbox, targetBatchIds.includes(b.id) && styles.checkboxActive]} />
                  <Text style={styles.checkboxLabel}>{b.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>4. Distribution Rules</Text>
          <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsGeneral(!isGeneral)}>
             <View style={[styles.checkbox, isGeneral && styles.checkboxActive]} />
             <Text style={styles.checkboxLabel}>Make this a Global Resource (General Library)</Text>
          </TouchableOpacity>

          {distributions.map((dist, index) => (
            <View key={index} style={styles.distCard}>
              <TouchableOpacity onPress={() => removeDist(index)} style={styles.removeDistBtn}>
                <Trash2 size={16} color={colors.error} />
              </TouchableOpacity>
              <Dropdown label="Assign to" value={dist.type} onSelect={(val) => updateDist(index, 'type', val)} options={[
                { label: 'Entire Course', value: 'course' }, { label: 'Specific Subject', value: 'subject' },
                { label: 'Specific Topic', value: 'topic' }, { label: 'Specific Class', value: 'class' }
              ]} />
              
              <Dropdown label="Select Course" value={dist.courseId} onSelect={(val) => updateDist(index, 'courseId', val)} options={[
                { label: '-- Choose Course --', value: '' }, ...courses.map(c => ({ label: c.title || c.name, value: c.id }))
              ]} />

              {['subject', 'topic', 'class'].includes(dist.type) && (
                <Dropdown label="Select Subject" value={dist.subjectId} onSelect={(val) => updateDist(index, 'subjectId', val)} options={[
                  { label: '-- Choose Subject --', value: '' }, ...subjects.filter(s => s.courseId === dist.courseId).map(s => ({ label: s.name, value: s.id }))
                ]} />
              )}
              {['topic', 'class'].includes(dist.type) && (
                <Dropdown label="Select Topic" value={dist.topicId} onSelect={(val) => updateDist(index, 'topicId', val)} options={[
                  { label: '-- Choose Topic --', value: '' }, ...topics.filter(t => t.subjectId === dist.subjectId).map(t => ({ label: t.name || t.title, value: t.id }))
                ]} />
              )}
              {['class'].includes(dist.type) && (
                <Dropdown label="Select Class" value={dist.classId} onSelect={(val) => updateDist(index, 'classId', val)} options={[
                  { label: '-- Choose Class --', value: '' }, ...classes.filter(c => c.topicId === dist.topicId).map(c => ({ label: c.title, value: c.id }))
                ]} />
              )}
            </View>
          ))}
          
          <TouchableOpacity style={styles.addRuleBtn} onPress={addDistribution}>
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addRuleText}>Add Rule</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.background} /> : <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Upload Asset'}</Text>}
          </TouchableOpacity>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backButton: { marginRight: 16 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  formContainer: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 12, marginTop: 20, letterSpacing: 1 },
  
  tabsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: colors.surface },
  tabBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}1A` },
  tabText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  
  uploadArea: { borderWidth: 1, borderColor: colors.surface, borderStyle: 'dashed', borderRadius: 12, padding: 32, alignItems: 'center', backgroundColor: `${colors.surface}50`, marginBottom: 16 },
  
  batchesContainer: { backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginBottom: 16 },
  label: { fontSize: 12, color: colors.textSecondary, marginBottom: 8, fontWeight: '600' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: colors.textSecondary },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { color: colors.textPrimary, fontSize: 14, flex: 1 },
  
  distCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 16, paddingTop: 32 },
  removeDistBtn: { position: 'absolute', top: 12, right: 12, padding: 4 },
  
  addRuleBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, paddingVertical: 8, marginBottom: 32 },
  addRuleText: { color: colors.primary, fontWeight: 'bold' },
  
  saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: colors.background, fontSize: 18, fontWeight: 'bold' }
});
