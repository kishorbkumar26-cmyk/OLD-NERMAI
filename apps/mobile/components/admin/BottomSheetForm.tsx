import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { AnimatedBottomSheet } from '../../core/animations';
import { colors, typography, spacing, radius } from '@nermai/theme';
import { X } from 'lucide-react-native';

interface BottomSheetFormProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export const BottomSheetForm = ({ visible, onClose, title, children, onSubmit, submitLabel = 'Save', isSubmitting = false }: BottomSheetFormProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
        
        <AnimatedBottomSheet
          visible={visible}
          style={styles.sheet}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {children}
            
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
              onPress={onSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitText}>{isSubmitting ? 'Saving...' : submitLabel}</Text>
            </TouchableOpacity>
          </ScrollView>
        </AnimatedBottomSheet>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
  },
  scrollArea: {
    maxHeight: 600,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40, // extra padding for keyboard
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.background, // Dark text on gold button
    fontSize: typography.sizes.body1,
    fontWeight: 'bold',
  }
});
