/**
 * NERMAI SACS — Mobile Premium Student Profile
 *
 * Design:
 *   - Dark Neumorphism with Gold/Red glowing accents
 *   - Glassmorphism effect over Neumorphic surfaces
 *   - Rich user details with modern cards
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../core/auth/AuthProvider';
import { DashboardApi } from '@nermai/api';
import { colors } from '@nermai/theme';
import { Settings, Bell, LogOut, ShieldCheck, Mail, GraduationCap, ChevronRight } from 'lucide-react-native';

const BG       = colors.background;   // #0E0E0E
const SURFACE  = colors.surface;      // #1B1B1B
const GOLD     = colors.primary;      // #D4AF37
const RED      = colors.accent;       // #FF3B30
const TEXT     = colors.textPrimary;  // #F8F8F8
const MUTED    = colors.textSecondary; // #A0A0A0

export const MobileStudentProfile = ({ navigation }: { navigation: any }) => {
  const { currentUser, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      DashboardApi.getStudentOverview()
        .then(res => {
          if (isActive) {
            setData(res.data?.data || res.data);
            setLoading(false);
          }
        })
        .catch(err => {
          console.warn('Profile stats fetch failed', err);
          if (isActive) setLoading(false);
        });
      return () => { isActive = false; };
    }, [])
  );

  const email = currentUser?.email || 'scholar@nermai.com';
  const name = currentUser?.displayName || email.split('@')[0].toUpperCase();

  return (
    <View style={styles.container}>
      {/* Background ambient glow */}
      <View style={styles.ambientGlow} />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header Card */}
        <View style={styles.neuCardProfile}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{name.charAt(0)}</Text>
          </View>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.roleBadge}>PREMIUM SCHOLAR</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>
                {loading ? <ActivityIndicator size="small" color={GOLD} /> : (data?.myCourses?.length || data?.totalCourses || 0)}
              </Text>
              <Text style={styles.statLabel}>COURSES</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>
                {loading ? <ActivityIndicator size="small" color={GOLD} /> : (data?.attendance || 'N/A')}
              </Text>
              <Text style={styles.statLabel}>ATTENDANCE</Text>
            </View>
          </View>
        </View>

        {/* Info Section */}
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.neuCardList}>
          
          <View style={styles.listItem}>
            <View style={styles.iconWrapGold}>
              <Mail size={18} color={GOLD} />
            </View>
            <View style={styles.listTextWrap}>
              <Text style={styles.listLabel}>Email Address</Text>
              <Text style={styles.listValue}>{email}</Text>
            </View>
          </View>

          <View style={styles.listItemDivider} />

          <View style={styles.listItem}>
            <View style={styles.iconWrapGold}>
              <GraduationCap size={18} color={GOLD} />
            </View>
            <View style={styles.listTextWrap}>
              <Text style={styles.listLabel}>Current Batch</Text>
              <Text style={styles.listValue}>{data?.batchName || 'Not Assigned'}</Text>
            </View>
          </View>

          <View style={styles.listItemDivider} />

          <View style={styles.listItem}>
            <View style={styles.iconWrapGold}>
              <ShieldCheck size={18} color={GOLD} />
            </View>
            <View style={styles.listTextWrap}>
              <Text style={styles.listLabel}>Account Status</Text>
              <Text style={[styles.listValue, { color: '#34C759' }]}>Active & Verified</Text>
            </View>
          </View>

        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.neuCardList}>
          
          <TouchableOpacity style={styles.listItemAction} activeOpacity={0.7} onPress={() => Alert.alert('Coming Soon', 'Settings module is under development.')}>
            <View style={styles.iconWrapPlain}>
              <Settings size={18} color={TEXT} />
            </View>
            <Text style={styles.listActionText}>App Settings</Text>
            <ChevronRight size={18} color={MUTED} />
          </TouchableOpacity>

          <View style={styles.listItemDivider} />

          <TouchableOpacity style={styles.listItemAction} activeOpacity={0.7} onPress={() => Alert.alert('Coming Soon', 'Notification settings are under development.')}>
            <View style={styles.iconWrapPlain}>
              <Bell size={18} color={TEXT} />
            </View>
            <Text style={styles.listActionText}>Notifications</Text>
            <ChevronRight size={18} color={MUTED} />
          </TouchableOpacity>

        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={logout}>
          <LogOut size={20} color={RED} />
          <Text style={styles.logoutText}>Log Out Securely</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>NERMAI ACADEMY v2.0.0</Text>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    position: 'relative',
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: `${GOLD}10`,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },

  /* Profile Card */
  neuCardProfile: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30,
    // Neumorphic shadow
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: GOLD,
    // Outer glow
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: GOLD,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: TEXT,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: `${GOLD}20`,
    color: GOLD,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: BG,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: MUTED,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 8,
  },
  neuCardList: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    paddingVertical: 8,
    marginBottom: 28,
    // Neumorphic shadow
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconWrapGold: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: `${GOLD}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconWrapPlain: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  listTextWrap: {
    flex: 1,
  },
  listLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '500',
    marginBottom: 2,
  },
  listValue: {
    fontSize: 15,
    color: TEXT,
    fontWeight: '600',
  },
  listActionText: {
    flex: 1,
    fontSize: 15,
    color: TEXT,
    fontWeight: '600',
  },
  listItemDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: 16,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${RED}15`,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: `${RED}40`,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: RED,
    marginLeft: 10,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: MUTED,
    letterSpacing: 1,
    fontWeight: '600',
  },
});
