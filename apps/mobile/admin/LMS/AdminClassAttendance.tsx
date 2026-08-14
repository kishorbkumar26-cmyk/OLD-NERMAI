import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors } from '@nermai/theme';
import { CourseApi } from '@nermai/api';

export const AdminClassAttendance = ({ route, navigation }: { route: any, navigation: any }) => {
  const { classId, classTitle, breadcrumb } = route.params;
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    // In a real implementation, you would fetch from the analytics endpoint
    // e.g. CourseApi.getClassAnalytics(classId)
    setTimeout(() => {
      setAnalytics({
        expectedDurationMinutes: 120,
        actualDurationMinutes: 138,
        policyMode: 'percentage',
        policyValue: 75,
        totalStudents: 126,
        watching: 54,
        completed: 81,
        present: 109,
        absent: 17,
        avgWatchMinutes: 91,
        avgPercentage: 81,
        peakConcurrent: 73,
        status: 'Processing' // Processing, Finalized, Locked
      });
      setLoading(false);
    }, 1000);
  }, [classId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{top:10,bottom:10,left:10,right:10}}>
            <ChevronLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.breadcrumb}>{breadcrumb || 'Attendance'}</Text>
            <Text style={styles.pageTitle}>{classTitle}</Text>
          </View>
        </View>

        <ScrollView style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : analytics ? (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Class Summary</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Status</Text>
                  <Text style={[styles.value, { color: colors.warning }]}>{analytics.status}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Expected Duration</Text>
                  <Text style={styles.value}>{analytics.expectedDurationMinutes} min</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Actual Duration</Text>
                  <Text style={styles.value}>{analytics.actualDurationMinutes} min</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Attendance Policy</Text>
                  <Text style={styles.value}>{analytics.policyValue}% ({analytics.policyMode})</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Live Progress</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Currently Watching</Text>
                  <Text style={[styles.value, { color: colors.primary }]}>{analytics.watching}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Attendance Met</Text>
                  <Text style={[styles.value, { color: colors.success }]}>{analytics.completed}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Need More Time</Text>
                  <Text style={[styles.value, { color: colors.warning }]}>{analytics.watching - analytics.completed}</Text>
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Aggregated Stats</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Total Students</Text>
                  <Text style={styles.value}>{analytics.totalStudents}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Present</Text>
                  <Text style={[styles.value, { color: colors.success }]}>{analytics.present}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Absent</Text>
                  <Text style={[styles.value, { color: colors.error }]}>{analytics.absent}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Average Watch</Text>
                  <Text style={styles.value}>{analytics.avgWatchMinutes} min</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Average %</Text>
                  <Text style={styles.value}>{analytics.avgPercentage}%</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Peak Concurrent</Text>
                  <Text style={styles.value}>{analytics.peakConcurrent}</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 40 }}>No data available</Text>
          )}
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
  breadcrumb: { color: colors.textSecondary, fontSize: 10, textTransform: 'uppercase', marginBottom: 2 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  content: { padding: 20 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
  cardTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  label: { color: colors.textSecondary, fontSize: 14 },
  value: { color: colors.textPrimary, fontSize: 14, fontWeight: 'bold' }
});
