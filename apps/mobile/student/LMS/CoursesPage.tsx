import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DashboardApi } from '@nermai/api';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedStagger } from '../../core/animations';
import { colors, typography, spacing, radius } from '@nermai/theme';
import { Card } from '../../components/ui';

export const CoursesPage = ({ navigation }: { navigation: any }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await DashboardApi.getStudentOverview();
        // Extract myCourses from dashboard overview
        setCourses(response.data?.data?.myCourses || []);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const renderCourseCard = ({ item, index }: { item: any, index: number }) => (
    <AnimatedStagger index={index}>
      <TouchableOpacity 
        onPress={() => navigation.navigate('CourseSyllabus', { courseId: item.id, courseTitle: item.title })}
      >
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.courseTitle}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </View>
          <Text style={styles.courseDescription} numberOfLines={2}>
            {item.description || 'No description available for this course.'}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="book-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>General Studies</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </AnimatedStagger>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>My Courses</Text>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>You are not enrolled in any courses yet.</Text>
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourseCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.screenPaddingMobile,
  },
  headerTitle: {
    fontSize: typography.sizes.h1,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    marginTop: spacing.xl,
  },
  listContent: {
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontSize: typography.sizes.body1,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  courseTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  courseDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body2,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.caption,
    marginLeft: 6,
  }
});
