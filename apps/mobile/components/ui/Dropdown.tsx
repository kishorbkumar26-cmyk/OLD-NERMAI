import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@nermai/theme';
import { ActionSheet } from '../admin/ActionSheet';

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  label?: string;
  value?: string;
  placeholder?: string;
  options: DropdownOption[];
  onSelect: (val: string) => void;
  error?: string;
}

export const Dropdown = ({ label, value, placeholder = 'Select...', options, onSelect, error }: DropdownProps) => {
  const [sheetVisible, setSheetVisible] = useState(false);
  
  const selectedOption = options.find(o => o.value === value);

  const sheetItems = options.map(opt => ({
    label: opt.label,
    onPress: () => onSelect(opt.value)
  }));

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={[styles.inputContainer, error ? styles.inputError : null]} 
        onPress={() => setSheetVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.text, !selectedOption && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={20} color={colors.textSecondary} style={styles.icon} />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <ActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title={label || placeholder}
        items={sheetItems}
      />
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
    justifyContent: 'space-between',
    height: spacing.xxxl, 
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.md, 
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  inputError: {
    borderColor: colors.error,
  },
  text: {
    color: colors.textPrimary,
    fontSize: typography.sizes.body1,
    flex: 1,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  icon: {
    marginLeft: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.caption,
    marginTop: spacing.xs,
  }
});
