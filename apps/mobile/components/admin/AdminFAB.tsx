import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { AnimatedScaleIn } from '../../core/animations';
import { Plus } from 'lucide-react-native';
import { colors, typography } from '@nermai/theme';

interface AdminFABProps {
  onPress: () => void;
  icon?: React.ReactNode;
  color?: string;
  label?: string;
}

export const AdminFAB = ({ onPress, icon, color = colors.primary, label }: AdminFABProps) => {
  const displayText = label?.replace(/^\+\s*/, '');
  
  return (
    <AnimatedScaleIn delay={300} style={styles.container}>
      <TouchableOpacity 
        style={[styles.fab, label ? styles.fabExtended : null, { backgroundColor: color }]} 
        onPress={onPress}
        activeOpacity={0.8}
      >
        {icon || <Plus size={label ? 20 : 24} color={colors.background} />}
        {displayText && <Text style={styles.label}>{displayText}</Text>}
      </TouchableOpacity>
    </AnimatedScaleIn>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 999,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fabExtended: {
    width: 'auto',
    paddingHorizontal: 20,
  },
  label: {
    color: colors.background,
    fontWeight: 'bold',
    fontSize: typography.sizes.body1,
    marginLeft: 8,
  }
});
