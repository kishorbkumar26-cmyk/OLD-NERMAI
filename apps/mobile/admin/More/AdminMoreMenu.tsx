import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Platform, Alert } from 'react-native';
import { AdminCard } from '../../components/admin/AdminCard';
import { FileText, Radio, Bell, CheckSquare, Users, Settings, User } from 'lucide-react-native';
import { colors } from '@nermai/theme';

export const AdminMoreMenu = ({ navigation }: { navigation: any }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>More Options</Text>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionTitle}>Content & Communications</Text>
          <AdminCard 
            title="Resources" 
            subtitle="Upload PDFs, PPTs, Images" 
            icon={<FileText size={20} color="#D4AF37" />} 
            onPress={() => navigation.navigate('AdminResources')} 
            delay={100}
          />
          <AdminCard 
            title="Live Sessions" 
            subtitle="Manage upcoming & active broadcasts" 
            icon={<Radio size={20} color="#FF6B6B" />} 
            onPress={() => navigation.navigate('AdminLiveSessions')} 
            delay={150}
          />


          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Management</Text>
          <AdminCard 
            title="Attendance" 
            subtitle="View & reconcile attendance records" 
            icon={<CheckSquare size={20} color="#2196F3" />} 
            onPress={() => Alert.alert('Coming Soon', 'Attendance module is under development.')}
            delay={250}
          />
          <AdminCard 
            title="Batches" 
            subtitle="Manage student groupings" 
            icon={<Users size={20} color="#9C27B0" />} 
            onPress={() => navigation.navigate('AdminBatches')} 
            delay={300}
          />

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>System</Text>
          <AdminCard 
            title="Settings" 
            subtitle="App configuration & policies" 
            icon={<Settings size={20} color="#888" />} 
            onPress={() => Alert.alert('Coming Soon', 'Settings module is under development.')}
            delay={350}
          />
          <AdminCard 
            title="My Profile" 
            subtitle="Manage your admin account" 
            icon={<User size={20} color="#888" />} 
            onPress={() => Alert.alert('Coming Soon', 'Profile management is under development.')}
            delay={400}
          />
          
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.textSecondary, marginBottom: 12, textTransform: 'uppercase' },
  scrollContent: { paddingBottom: 100 }
});
