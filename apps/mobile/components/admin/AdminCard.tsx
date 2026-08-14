import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AnimatedStagger } from '../../core/animations';

interface AdminCardProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  delay?: number;
}

export const AdminCard = ({ title, subtitle, onPress, icon, rightElement, delay = 0 }: AdminCardProps) => {
  return (
    <AnimatedStagger delay={delay}>
      <TouchableOpacity 
        style={styles.card} 
        onPress={onPress} 
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        {rightElement && <View style={styles.rightContent}>{rightElement}</View>}
      </TouchableOpacity>
    </AnimatedStagger>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8F8F8',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
  },
  rightContent: {
    marginLeft: 16,
  }
});
