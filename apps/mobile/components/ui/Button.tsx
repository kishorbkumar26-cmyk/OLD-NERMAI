import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, TouchableOpacityProps } from 'react-native';
import { colors, radius, spacing, typography } from '@nermai/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button = ({ title, loading, variant = 'primary', style, disabled, ...props }: ButtonProps) => {
  const isPrimary = variant === 'primary';
  const containerStyle = isPrimary ? styles.primaryContainer : styles.secondaryContainer;
  const textStyle = isPrimary ? styles.primaryText : styles.secondaryText;
  
  return (
    <TouchableOpacity 
      style={[
        styles.baseContainer, 
        containerStyle, 
        disabled && styles.disabled,
        style
      ]} 
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.textInverse : colors.primary} />
      ) : (
        <Text style={[styles.baseText, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    height: spacing.xxxl, // 56px strict height rule
    borderRadius: radius.md, // 16px strict radius rule
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    width: '100%',
  },
  primaryContainer: {
    backgroundColor: colors.primary,
  },
  secondaryContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  baseText: {
    fontSize: typography.sizes.body1,
    fontWeight: 'bold', // Mapping to typography weight 'bold'
  },
  primaryText: {
    color: colors.textInverse,
  },
  secondaryText: {
    color: colors.primary,
  }
});
