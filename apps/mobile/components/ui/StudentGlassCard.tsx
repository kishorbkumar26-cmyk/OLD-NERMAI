import React from 'react';
import { ViewStyle, StyleSheet, StyleProp } from 'react-native';
import { AnimatedStagger } from '../../core/animations';
import { colors, radius, spacing } from '@nermai/theme';

interface StudentGlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

export const StudentGlassCard: React.FC<StudentGlassCardProps> = ({ children, style, delay = 0 }) => {
  return (
    <AnimatedStagger delay={delay} style={[styles.card, style]}>
      {children}
    </AnimatedStagger>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg, // 20px
    padding: spacing.md, // 16px
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  }
});
