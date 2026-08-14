import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from '@nermai/theme';
import { Eye, EyeOff } from 'lucide-react-native'; // Assuming lucide-react-native is installed

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
}

export const TextField = ({ label, error, isPassword, style, ...props }: TextFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error ? styles.inputError : null
      ]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    width: '100%',
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.body2,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: spacing.xxxl, // 56px strict height rule
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.md, // 16px strict radius rule
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.body1,
    paddingHorizontal: spacing.md,
    height: '100%',
  },
  eyeIcon: {
    paddingHorizontal: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs,
  }
});
