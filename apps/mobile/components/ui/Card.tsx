import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, radius, spacing } from '@nermai/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export const Card = ({ children, style, ...props }: CardProps) => {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.lg, // 20px padding
    borderRadius: radius.lg, // 20px radius
    borderWidth: 1,
    borderColor: colors.border,
  }
});
