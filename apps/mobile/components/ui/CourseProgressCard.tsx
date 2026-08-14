import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedProgressBar } from '../../core/animations';
import { StudentGlassCard } from './StudentGlassCard';
import { PlayCircle } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@nermai/theme';

interface CourseProgressCardProps {
  title: string;
  completionPercentage: number;
  delay?: number;
}

export const CourseProgressCard: React.FC<CourseProgressCardProps> = ({ title, completionPercentage, delay = 0 }) => {
  return (
    <StudentGlassCard delay={delay} style={styles.container}>
      <View style={styles.thumbnailPlaceholder}>
        <PlayCircle color={colors.textSecondary} size={40} />
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <AnimatedProgressBar
            progress={completionPercentage}
            delay={delay + 500}
            style={styles.progressFill}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(completionPercentage)}%</Text>
      </View>
    </StudentGlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 240,
    marginRight: spacing.md,
    padding: spacing.md,
  },
  thumbnailPlaceholder: {
    height: 120,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body1,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 3,
    marginRight: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary, // Using primary Gold for progress
  },
  progressText: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: 'bold',
  }
});
