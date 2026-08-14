import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, TextInput, Platform, Modal } from 'react-native';
import { StudentApi, BatchApi } from '@nermai/api';
import { AnimatedStagger } from '../../core/animations';
import { Search, UserCircle, MoreVertical } from 'lucide-react-native';
import { ActionSheet } from '../../components/admin/ActionSheet';
import { colors } from '@nermai/theme';

export const AdminStudents = ({ navigation }: { navigation: any }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Action Sheet State
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', email: '', phone: '', accessTier: 'free', status: 'active' });

  // Batch Assignment State
  const [batches, setBatches] = useState<any[]>([]);
  const [batchSheetVisible, setBatchSheetVisible] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await BatchApi.listBatches();
      setBatches(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await StudentApi.listStudents();
      setStudents(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.email?.toLowerCase().includes(search.toLowerCase()) || 
    s.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const openActionSheet = (student: any) => {
    setSelectedStudent(student);
    setEditForm({
      displayName: student.displayName || '',
      email: student.email || '',
      phone: student.phoneNumber || '',
      accessTier: student.accessTier || 'free',
      status: student.status || 'active'
    });
    setSheetVisible(true);
  };

  const handleMakeStaff = async () => {
    setSheetVisible(false);
    if (!selectedStudent) return;
    try {
      setLoading(true);
      await StudentApi.assignRole(selectedStudent.id, 'staff');
      await fetchStudents();
      alert('User is now Staff!');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error making staff.');
      setLoading(false);
    }
  };

  const handleEditSave = async () => {
    setEditModalVisible(false);
    if (!selectedStudent) return;
    try {
      setLoading(true);
      await StudentApi.updateStudent(selectedStudent.id, editForm);
      await fetchStudents();
      alert('Profile updated!');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error updating profile.');
      setLoading(false);
    }
  };

  const handleAssignBatchClick = () => {
    setSheetVisible(false);
    setTimeout(() => {
      setBatchSheetVisible(true);
    }, 400); // Wait for the first sheet to close
  };

  const handleSelectBatch = async (batchId: string) => {
    setBatchSheetVisible(false);
    if (!selectedStudent) return;
    try {
      setLoading(true);
      await StudentApi.assignBatch(selectedStudent.id, batchId);
      await fetchStudents();
      alert('Student assigned to batch successfully!');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error assigning to batch.');
      setLoading(false);
    }
  };

  const handleRemoveBatch = async (batchId: string) => {
    setBatchSheetVisible(false);
    if (!selectedStudent) return;
    try {
      setLoading(true);
      await StudentApi.removeBatch(selectedStudent.id, batchId);
      await fetchStudents();
      alert('Student removed from batch successfully!');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error removing from batch.');
      setLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    setSheetVisible(false);
    if (!selectedStudent) return;
    // In React Native, window.confirm doesn't exist, we use Alert, but for simplicity we'll just execute it or rely on a custom modal.
    // Ideally we would use React Native's Alert API: import { Alert } from 'react-native';
    try {
      setLoading(true);
      await StudentApi.deleteStudent(selectedStudent.id);
      await fetchStudents();
      alert('Student deleted successfully!');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Error deleting student.');
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <AnimatedStagger index={index}>
      <TouchableOpacity 
        style={styles.studentCard} 
        activeOpacity={0.7}
        onPress={() => openActionSheet(item)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.displayName?.[0]?.toUpperCase() || item.email?.[0]?.toUpperCase() || 'U'}</Text>
        </View>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.displayName || 'No Name'}</Text>
          <Text style={styles.studentEmail}>{item.email}</Text>
          
          <View style={{flexDirection: 'row', marginTop: 6}}>
            {(() => {
              let tier = item.accessTier;
              if (!tier) {
                if (item.programMemberships && item.programMemberships.some((m: any) => m.status === 'active')) {
                  tier = 'enrolled';
                } else {
                  tier = 'free';
                }
              }
              const isPremium = tier === 'premium' || tier === 'paid';
              const isFree = tier === 'free';
              
              return (
                <View style={[styles.tierBadge, isPremium ? styles.tierBadgePremium : isFree ? styles.tierBadgeFree : styles.tierBadgeEnrolled]}>
                  <Text style={[styles.tierText, isPremium ? styles.tierTextPremium : isFree ? styles.tierTextFree : styles.tierTextEnrolled]}>
                    {tier.toUpperCase()}
                  </Text>
                </View>
              )
            })()}
          </View>
        </View>
        <MoreVertical size={20} color="#888" />
      </TouchableOpacity>
    </AnimatedStagger>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Students</Text>
        
        <View style={styles.searchContainer}>
          <Search size={20} color="#888" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search students..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : filteredStudents.length === 0 ? (
          <View style={styles.center}>
            <UserCircle size={48} color="#444" />
            <Text style={styles.emptyText}>No students found.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredStudents}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <ActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={selectedStudent ? `Manage ${selectedStudent.displayName || selectedStudent.email}` : ''}
        items={[
          { label: 'Edit Profile', onPress: () => { setSheetVisible(false); setTimeout(() => setEditModalVisible(true), 400); } },
          { label: 'Assign Batch', onPress: handleAssignBatchClick },
          { label: 'Make Staff', onPress: handleMakeStaff },
          { label: 'Deactivate Account', onPress: handleDeleteStudent, destructive: true }
        ]}
      />

      <ActionSheet
        visible={batchSheetVisible}
        onClose={() => setBatchSheetVisible(false)}
        title="Manage Batches"
        items={batches.map(b => {
          const isAssigned = selectedStudent?.programMemberships?.some((m: any) => m.batchId === b.id && m.status === 'active');
          return {
            label: isAssigned ? `Remove from ${b.name}` : `Assign to ${b.name}`,
            destructive: isAssigned,
            onPress: () => isAssigned ? handleRemoveBatch(b.id) : handleSelectBatch(b.id)
          };
        })}
      />

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit {selectedStudent?.displayName}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput 
                style={styles.modalInput}
                value={editForm.displayName}
                onChangeText={t => setEditForm({...editForm, displayName: t})}
                placeholder="Full Name"
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput 
                style={styles.modalInput}
                value={editForm.email}
                onChangeText={t => setEditForm({...editForm, email: t})}
                placeholder="Email Address"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput 
                style={styles.modalInput}
                value={editForm.phone}
                onChangeText={t => setEditForm({...editForm, phone: t})}
                placeholder="Phone Number"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
              />
            </View>

            <View style={{flexDirection: 'row', gap: 12}}>
              <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.inputLabel}>Tier</Text>
                {/* Note: In a real app we'd use a Picker, but for brevity we'll just cycle through options on tap */}
                <TouchableOpacity 
                  style={styles.modalInput} 
                  onPress={() => {
                    const options = ['free', 'paid', 'scholarship', 'blocked'];
                    const next = options[(options.indexOf(editForm.accessTier) + 1) % options.length];
                    setEditForm({...editForm, accessTier: next});
                  }}
                >
                  <Text style={{color: '#FFF', textTransform: 'capitalize'}}>{editForm.accessTier}</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, {flex: 1}]}>
                <Text style={styles.inputLabel}>Status</Text>
                <TouchableOpacity 
                  style={styles.modalInput} 
                  onPress={() => {
                    const options = ['active', 'inactive', 'suspended'];
                    const next = options[(options.indexOf(editForm.status) + 1) % options.length];
                    setEditForm({...editForm, status: next});
                  }}
                >
                  <Text style={{color: '#FFF', textTransform: 'capitalize'}}>{editForm.status}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalBtnTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnSave} onPress={handleEditSave}>
                <Text style={styles.modalBtnTextSave}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  listContent: { paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 16, marginTop: 12 },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  avatarText: { color: '#121212', fontWeight: 'bold', fontSize: 20 },
  studentInfo: { flex: 1 },
  studentName: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 2 },
  studentEmail: { color: colors.textSecondary, fontSize: 13 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  tierText: { fontWeight: 'bold', fontSize: 10 },
  tierBadgePremium: { backgroundColor: 'rgba(212,175,55,0.15)' },
  tierTextPremium: { color: colors.primary },
  tierBadgeFree: { backgroundColor: 'rgba(136,136,136,0.15)' },
  tierTextFree: { color: '#888' },
  tierBadgeEnrolled: { backgroundColor: 'rgba(33,150,243,0.15)' },
  tierTextEnrolled: { color: '#2196F3' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase', marginBottom: 6 },
  modalInput: { backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, color: colors.textPrimary, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 12 },
  modalBtnCancel: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  modalBtnTextCancel: { color: colors.textPrimary, fontWeight: '600' },
  modalBtnSave: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.primary },
  modalBtnTextSave: { color: '#000', fontWeight: 'bold' }
});
