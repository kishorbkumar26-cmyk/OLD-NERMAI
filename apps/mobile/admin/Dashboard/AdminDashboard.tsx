import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedFadeIn, AnimatedStagger, AnimatedGlassCard, AnimatedSkeleton } from '../../core/animations';
import { useAuth } from '../../core/auth/AuthProvider';
import { DashboardApi, CourseApi, StudentApi, LiveSessionApi, ResourceApi, AnnouncementApi, BatchApi } from '@nermai/api';
import {
  LogOut, Users, BookOpen, Video, Bell, UploadCloud, Calendar,
  MessageCircle, Activity, ChevronRight, GraduationCap, Layers,
  FileText, Clock, RefreshCw, TrendingUp
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@nermai/theme';

interface AdminMetrics {
  totalStudents?: number;
  totalTeachers?: number;
  totalCourses?: number;
  totalSubjects?: number;
  totalTopics?: number;
  activeBatches?: number;
  ongoingLiveSessions?: number;
  upcomingLiveSessions?: number;
  pendingAccessRequests?: number;
  totalResources?: number;
  totalAnnouncements?: number;
  recentActivity?: Array<{ message: string; timestamp: string; type: string }>;
}

export const AdminDashboard = ({ navigation }: { navigation: any }) => {
  const { logout, currentUser } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await DashboardApi.getAdminMetrics();
      setMetrics(res.data?.data || res.data || {});
    } catch (err: any) {
      console.warn('AdminDashboard: Failed to fetch metrics, falling back', err?.message);
      
      try {
        const [
          coursesRes, studentsRes, liveRes, resourcesRes, announcementsRes, batchesRes
        ] = await Promise.allSettled([
          CourseApi.listCourses(),
          StudentApi.listStudents(),
          LiveSessionApi.listSessions(),
          ResourceApi.list({}),
          AnnouncementApi.listAnnouncements(),
          BatchApi.listBatches()
        ]);
        
        const m: AdminMetrics = {};
        
        if (coursesRes.status === 'fulfilled') {
            const data = coursesRes.value?.data?.data || coursesRes.value?.data || [];
            m.totalCourses = Array.isArray(data) ? data.length : 0;
        }
        if (studentsRes.status === 'fulfilled') {
            const data = studentsRes.value?.data?.data || studentsRes.value?.data || [];
            m.totalStudents = Array.isArray(data) ? data.length : 0;
        }
        if (liveRes.status === 'fulfilled') {
            const data = liveRes.value?.data?.data || liveRes.value?.data || [];
            m.ongoingLiveSessions = Array.isArray(data) ? data.filter((s: any) => s.status === 'LIVE').length : 0;
        }
        if (resourcesRes.status === 'fulfilled') {
            const data = resourcesRes.value?.data?.data || resourcesRes.value?.data || [];
            m.totalResources = Array.isArray(data) ? data.length : 0;
        }
        if (announcementsRes.status === 'fulfilled') {
            const data = announcementsRes.value?.data?.data || announcementsRes.value?.data || [];
            m.totalAnnouncements = Array.isArray(data) ? data.length : 0;
        }
        if (batchesRes.status === 'fulfilled') {
            const data = batchesRes.value?.data?.data || batchesRes.value?.data || [];
            m.activeBatches = Array.isArray(data) ? data.length : 0;
        }
        
        setMetrics(m);
        setError('Dashboard API unavailable. Showing partial live stats.');
      } catch (fallbackErr) {
        setError('Could not load live stats. Pull to refresh.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-fetch on focus
  useFocusEffect(
    useCallback(() => {
      fetchMetrics();
    }, [fetchMetrics])
  );

  const m = metrics;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Admin Portal</Text>
            <Text style={styles.subtitle}>Welcome back, {currentUser?.displayName || 'Administrator'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => fetchMetrics(true)} style={styles.refreshBtn}>
              <RefreshCw size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <LogOut size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchMetrics(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {/* Live Stats Row */}
          <AnimatedFadeIn style={{ marginBottom: spacing.lg }}>
            <Text style={styles.sectionTitle}>Live Overview</Text>
            {error && (
              <Text style={{ color: colors.error, fontSize: 12, marginBottom: spacing.sm }}>{error}</Text>
            )}
            <View style={styles.statsGrid}>
              <StatCard label="Students" value={loading ? null : m?.totalStudents} icon={GraduationCap} color={colors.primary} />
              <StatCard label="Courses" value={loading ? null : m?.totalCourses} icon={BookOpen} color="#4CAF50" />
              <StatCard label="Live Now" value={loading ? null : m?.ongoingLiveSessions} icon={Video} color={colors.accent} />
              <StatCard label="Batches" value={loading ? null : m?.activeBatches} icon={Layers} color="#9C27B0" />
              <StatCard label="Resources" value={loading ? null : m?.totalResources} icon={FileText} color="#2196F3" />
              <StatCard label="Pending" value={loading ? null : m?.pendingAccessRequests} icon={Clock} color="#FF9800" />
            </View>
          </AnimatedFadeIn>

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.widgetsGrid}>
            <ActionWidget
              title="Students"
              subtitle={loading ? '...' : `${m?.totalStudents ?? 0} enrolled`}
              icon={Users} index={1}
              onPress={() => navigation.navigate('Students')}
            />
            <ActionWidget
              title="Courses"
              subtitle={loading ? '...' : `${m?.totalCourses ?? 0} total`}
              icon={BookOpen} index={2}
              onPress={() => navigation.navigate('LMS', { screen: 'AdminCourses' })}
            />
            <ActionWidget
              title="Live Now"
              subtitle={loading ? '...' : `${m?.ongoingLiveSessions ?? 0} active`}
              icon={Video} color={colors.accent} index={3}
              onPress={() => navigation.navigate('More', { screen: 'AdminLiveSessions' })}
            />
            <ActionWidget
              title="Alerts"
              subtitle={loading ? '...' : `${m?.totalAnnouncements ?? 0} posted`}
              icon={Bell} index={4}
              onPress={() => navigation.navigate('More', { screen: 'Announcements' })}
            />
            <ActionWidget
              title="Resources"
              subtitle={loading ? '...' : `${m?.totalResources ?? 0} files`}
              icon={UploadCloud} index={5}
              onPress={() => navigation.navigate('More', { screen: 'AdminResources' })}
            />
            <ActionWidget
              title="Schedule"
              subtitle="Create Live Class"
              icon={Calendar} index={6}
              onPress={() => navigation.navigate('More', { screen: 'AdminLiveSessions' })}
            />
            <ActionWidget
              title="Assistant"
              subtitle="AI Chat"
              icon={MessageCircle} color={colors.primary} index={7}
              onPress={() => navigation.navigate('Assistant')}
            />
            <ActionWidget
              title="Access"
              subtitle={loading ? '...' : `${m?.pendingAccessRequests ?? 0} pending`}
              icon={TrendingUp} color="#9C27B0" index={8}
              onPress={() => navigation.navigate('Access')}
            />
          </View>

          {/* Recent Activity */}
          <AnimatedFadeIn delay={400} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <Activity size={20} color={colors.textSecondary} />
            </View>

            {loading ? (
              <>
                <AnimatedSkeleton style={{ height: 56, borderRadius: radius.sm, marginBottom: spacing.sm }} />
                <AnimatedSkeleton style={{ height: 56, borderRadius: radius.sm, marginBottom: spacing.sm }} />
              </>
            ) : m?.recentActivity?.length ? (
              m.recentActivity.slice(0, 5).map((item, i) => (
                <View key={i} style={styles.alertCard}>
                  <View style={[styles.alertIndicator, { backgroundColor: item.type === 'error' ? colors.error : item.type === 'success' ? '#4CAF50' : colors.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>{item.message}</Text>
                    <Text style={styles.alertTime}>{new Date(item.timestamp).toLocaleString()}</Text>
                  </View>
                </View>
              ))
            ) : (
              <>
                <View style={styles.alertCard}>
                  <View style={[styles.alertIndicator, { backgroundColor: colors.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>{m?.ongoingLiveSessions ? `${m.ongoingLiveSessions} live session(s) ongoing` : 'No live sessions active'}</Text>
                    <Text style={styles.alertTime}>Right now</Text>
                  </View>
                </View>
                <View style={styles.alertCard}>
                  <View style={[styles.alertIndicator, { backgroundColor: '#4CAF50' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertTitle}>{m?.totalStudents ? `${m.totalStudents} students enrolled` : 'Dashboard loaded successfully'}</Text>
                    <Text style={styles.alertTime}>Live data</Text>
                  </View>
                </View>
              </>
            )}
          </AnimatedFadeIn>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number | null | undefined; icon: any; color: string }) => (
  <View style={[styles.statCard, { borderColor: `${color}30` }]}>
    <Icon size={18} color={color} />
    {value == null ? (
      <AnimatedSkeleton style={{ height: 24, width: 40, borderRadius: 4, marginTop: 8 }} />
    ) : (
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    )}
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionWidget = ({ title, subtitle, icon: Icon, index, color = colors.primary, onPress }: any) => (
  <AnimatedStagger index={index} style={styles.widgetWrapper}>
    <AnimatedGlassCard style={styles.widgetCard} onPress={onPress}>
      <Icon size={24} color={color} style={{ marginBottom: 12 }} />
      <Text style={styles.widgetTitle}>{title}</Text>
      <Text style={styles.widgetSubtitle} numberOfLines={1}>{subtitle}</Text>
    </AnimatedGlassCard>
  </AnimatedStagger>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.md, paddingTop: Platform.OS === 'android' ? 40 : 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xl },
  greeting: { fontSize: typography.sizes.h1, fontWeight: 'bold', color: colors.textPrimary, letterSpacing: 0.5 },
  subtitle: { fontSize: typography.sizes.body2, color: colors.textSecondary, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  refreshBtn: { padding: spacing.sm, backgroundColor: `${colors.primary}1A`, borderRadius: radius.sm },
  logoutButton: { padding: spacing.sm, backgroundColor: `${colors.error}1A`, borderRadius: radius.sm },
  scrollArea: { flex: 1 },
  sectionTitle: { fontSize: typography.sizes.h3, fontWeight: 'bold', color: colors.textPrimary, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  statCard: {
    width: '30.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
    marginBottom: spacing.sm,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', marginTop: 6 },
  statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  widgetsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.xl },
  widgetWrapper: { width: '48%', marginBottom: spacing.md },
  widgetCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.primary}1A`,
    height: 120,
    justifyContent: 'center'
  },
  widgetTitle: { color: colors.textPrimary, fontSize: typography.sizes.body1, fontWeight: 'bold', marginBottom: 4 },
  widgetSubtitle: { color: colors.textSecondary, fontSize: typography.sizes.caption },
  section: { marginBottom: spacing.xxl },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: `rgba(255,255,255,0.05)`,
  },
  alertIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.error, marginRight: spacing.md },
  alertTitle: { color: colors.textPrimary, fontSize: typography.sizes.body1, fontWeight: '500', marginBottom: 4 },
  alertTime: { color: colors.textSecondary, fontSize: typography.sizes.caption },
});
