import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { AnimatedBottomSheet } from '../../core/animations';
import { colors } from '@nermai/theme';

interface ActionItem {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  destructive?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  items: ActionItem[];
}

export const ActionSheet = ({ visible, onClose, title, items }: ActionSheetProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <AnimatedBottomSheet
            visible={visible}
            style={styles.sheet}
          >
            {title && <Text style={styles.title}>{title}</Text>}
            
            {items.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.item, index === items.length - 1 && styles.lastItem]} 
                onPress={() => {
                  item.onPress();
                  onClose();
                }}
              >
                {item.icon && <View style={styles.icon}>{item.icon}</View>}
                <Text style={[styles.itemText, item.destructive && styles.destructiveText]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </AnimatedBottomSheet>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600'
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  lastItem: {
    borderBottomWidth: 0,
    marginBottom: 10,
  },
  icon: {
    marginRight: 16,
    width: 24,
    alignItems: 'center'
  },
  itemText: {
    color: colors.textPrimary,
    fontSize: 18,
  },
  destructiveText: {
    color: colors.accent,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  }
});
