import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { StudentGlassCard } from '../../components/ui/StudentGlassCard';
import { AnimatedFadeIn, AnimatedStagger } from '../../core/animations';
import { DashboardApi } from '@nermai/api';
import { colors, typography, spacing, radius } from '@nermai/theme';
import { CourseProgressCard } from '../../components/ui/CourseProgressCard';
import { Bot, Bell, BookOpen, ChevronRight, Radio, Zap, Search } from 'lucide-react-native';

export const StudentDashboard = ({ navigation }: { navigation: any }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await DashboardApi.getStudentOverview();
      setData(res.data?.data || res.data);
    } catch (err) {
      console.warn('StudentDashboard fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  const getBadgeText = (status: string) => {
    switch (status) {
      case 'LIVE':
      case 'JOINING':
      case 'HOST_CONNECTED': return 'LIVE NOW';
      case 'SCHEDULED': return 'LIVE SOON';
      case 'RECORDED_AVAILABLE': return 'RECORDED';
      case 'ENDED': return 'FINISHED';
      default: return 'UPCOMING';
    }
  };

  const activeLiveClasses = data?.liveClasses?.filter(
    (s: any) => ['LIVE', 'JOINING', 'HOST_CONNECTED'].includes(s.liveStatus) || ['LIVE', 'JOINING', 'HOST_CONNECTED'].includes(s.status) || s.liveStatus === 'SCHEDULED' || s.status === 'SCHEDULED'
  ) || [];

  return (
    <View style={styles.container}>
      {/* Background ambient glows */}
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AnimatedFadeIn style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome, Scholar 👋</Text>
            <Text style={styles.subtext}>Ready for today's challenge?</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('GlobalSearch')}
            >
              <Search size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Bell size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </AnimatedFadeIn>

        {/* AI Assistant Card */}
        <AnimatedStagger index={0} style={styles.section}>
          <TouchableOpacity
            style={styles.aiCard}
            onPress={() => navigation.navigate('Chatbot')}
            activeOpacity={0.85}
          >
            <View style={styles.aiCardLeft}>
              <View style={styles.aiAvatar}>
                <Bot size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiCardTitle}>NERMAI AI Assistant</Text>
                <Text style={styles.aiCardSubtitle}>Ask anything about your courses</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.primary} />
          </TouchableOpacity>
        </AnimatedStagger>

        {/* Quick Stats Row */}
        {data && (
          <AnimatedStagger index={1} style={styles.section}>
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('StudentTabs', { screen: 'Courses' })}
                activeOpacity={0.7}
              >
                <BookOpen size={18} color={colors.primary} />
                <Text style={styles.statValue}>{data.myCourses?.length || data.totalCourses || 0}</Text>
                <Text style={styles.statLabel}>Courses</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('StudentTabs', { screen: 'Live' })}
                activeOpacity={0.7}
              >
                <Radio size={18} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.accent }]}>{activeLiveClasses.length}</Text>
                <Text style={styles.statLabel}>Live Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => navigation.navigate('StudentTabs', { screen: 'Resources' })}
                activeOpacity={0.7}
              >
                <Zap size={18} color={colors.primary} />
                <Text style={styles.statValue}>{data.totalResources || 0}</Text>
                <Text style={styles.statLabel}>Resources</Text>
              </TouchableOpacity>
            </View>
          </AnimatedStagger>
        )}

        {/* Continue Learning */}
        {(data?.continueWatching?.length > 0 || data?.myCourses?.length > 0) && (
          <AnimatedStagger index={2} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleIndicatorGold} />
              <Text style={styles.sectionTitle}>Continue Learning</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ overflow: 'visible' }}>
              {(data.continueWatching?.length > 0 ? data.continueWatching : data.myCourses).map((item: any, index: number) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => navigation.navigate('CourseOverview', { courseId: item.courseId || item.id })}
                >
                  <CourseProgressCard
                    title={item.courseName || item.title || `Course ${index + 1}`}
                    completionPercentage={item.completionPercentage || 0}
                    delay={index * 150}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </AnimatedStagger>
        )}

        {/* Live / Upcoming Classes */}
        {activeLiveClasses.length > 0 && (
          <AnimatedStagger index={3} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.titleIndicatorRed} />
              <Text style={styles.sectionTitle}>Upcoming Live</Text>
              <TouchableOpacity onPress={() => navigation.navigate('StudentTabs', { screen: 'Live' })} style={{ marginLeft: 'auto' }}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {activeLiveClasses.slice(0, 3).map((session: any, index: number) => (
              <TouchableOpacity
                key={session.id}
                onPress={() => navigation.navigate('PlayerAccess', { classId: session.classId || session.id, classTitle: session.title, courseId: session.courseId })}
              >
                <StudentGlassCard
                  delay={300 + index * 100}
                  style={[styles.liveCardBase, ['LIVE', 'JOINING', 'HOST_CONNECTED'].includes(session.liveStatus) || ['LIVE', 'JOINING', 'HOST_CONNECTED'].includes(session.status) ? styles.liveCardActive : styles.liveCardScheduled]}
                >
                  <View style={styles.liveHeader}>
                    <Text style={styles.liveBadge}>{getBadgeText(session.liveStatus || session.status)}</Text>
                    {(['LIVE', 'JOINING', 'HOST_CONNECTED'].includes(session.liveStatus) || ['LIVE', 'JOINING', 'HOST_CONNECTED'].includes(session.status)) && <View style={styles.livePulseDot} />}
                  </View>
                  <Text style={styles.liveTitle}>{session.title}</Text>
                  <Text style={styles.liveTime}>
                    {session.startTime ? new Date(session.startTime).toLocaleString() : ''}
                  </Text>
                </StudentGlassCard>
              </TouchableOpacity>
            ))}
          </AnimatedStagger>
        )}


        {/* Empty state fallback */}
        {loading && (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: spacing.md }}>Loading your dashboard...</Text>
          </View>
        )}

        {!loading && !data && (
          <View style={styles.loadingCenter}>
            <Text style={{ color: colors.textSecondary }}>Could not load dashboard. Pull to refresh.</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating AI Assistant Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Chatbot')}
        activeOpacity={0.85}
      >
        <Bot size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, position: 'relative', overflow: 'hidden' },
  glowTopRight: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255, 59, 48, 0.08)', transform: [{ scale: 2 }] },
  glowBottomLeft: { position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(212, 175, 55, 0.08)', transform: [{ scale: 2 }] },
  scrollArea: { flex: 1, zIndex: 10 },
  scrollContent: { paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingTop: 24, paddingBottom: spacing.md },
  greeting: { fontSize: typography.sizes.h2, fontWeight: 'bold', color: colors.textPrimary },
  subtext: { fontSize: typography.sizes.body2, color: colors.textSecondary, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: spacing.xs },
  headerBtn: { padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radius.sm },
  section: { marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  sectionTitle: { fontSize: typography.sizes.h3, fontWeight: '700', color: colors.textPrimary },
  seeAll: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  titleIndicatorGold: { width: 3, height: 16, backgroundColor: colors.primary, borderRadius: 2 },
  titleIndicatorRed: { width: 3, height: 16, backgroundColor: colors.accent, borderRadius: 2 },

  // AI Card
  aiCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: `${colors.primary}30`, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  aiCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  aiAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  aiCardTitle: { fontSize: typography.sizes.body1, fontWeight: '700', color: colors.textPrimary },
  aiCardSubtitle: { fontSize: typography.sizes.body2, color: colors.textSecondary, marginTop: 2 },

  // Stats Row
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  statLabel: { fontSize: 10, color: colors.textSecondary, textAlign: 'center' },

  // Live cards
  liveCardBase: { marginBottom: spacing.sm },
  liveCardActive: { backgroundColor: 'rgba(255, 59, 48, 0.1)', borderColor: 'rgba(255, 59, 48, 0.4)' },
  liveCardScheduled: { backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.08)' },
  liveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  liveBadge: { color: colors.accent, fontSize: typography.sizes.caption, fontWeight: 'bold', letterSpacing: 1.5 },
  livePulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  liveTitle: { color: colors.textPrimary, fontSize: typography.sizes.h3, fontWeight: '600', marginBottom: 4 },
  liveTime: { color: colors.textSecondary, fontSize: typography.sizes.body2 },

  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },

  // FAB
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8, zIndex: 100 },
});
