import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { AnimatedStagger } from '../../core/animations';
import { colors } from '@nermai/theme';

interface CourseCardProps {
  title: string;
  subtitle?: string;
  metrics?: { label: string, value: string | number }[];
  onPress: () => void;
  onOptionsPress?: () => void;
  delay?: number;
}

export const CourseCard = ({ 
  title, subtitle, metrics, onPress, onOptionsPress, delay = 0 
}: CourseCardProps) => {

  return (
    <AnimatedStagger delay={delay} style={{ marginBottom: 12 }}>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.indicator} />
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          
          {metrics && metrics.length > 0 && (
            <View style={styles.metricsContainer}>
              {metrics.map((m, i) => (
                <Text key={i} style={styles.metricText}>{m.label}: {m.value}</Text>
              ))}
            </View>
          )}
        </View>
        
        {onOptionsPress && (
          <TouchableOpacity style={styles.optionsButton} onPress={onOptionsPress}>
            <MoreVertical size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </AnimatedStagger>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  indicator: {
    width: 6,
    height: '100%',
    backgroundColor: colors.primary,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  metricsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  optionsButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
