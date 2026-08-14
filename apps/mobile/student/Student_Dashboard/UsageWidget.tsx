import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UsageWidgetProps {
  used: number;
  limit: number | null; // null means unlimited
  resetDate: string;
}

export const UsageWidget: React.FC<UsageWidgetProps> = ({ used, limit, resetDate }) => {
  
  if (limit === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Monthly Recorded Request Limit</Text>
        <Text style={styles.unlimitedText}>Unlimited Access</Text>
      </View>
    );
  }

  const remaining = Math.max(0, limit - used);
  const percentage = Math.min(100, Math.round((used / limit) * 100));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Recorded Request Limit</Text>
      
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${percentage}%` }]} />
      </View>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>{used} / {limit} Used</Text>
        <Text style={styles.statsTextRemaining}>Remaining: {remaining}</Text>
      </View>
      
      <Text style={styles.resetText}>Resets {resetDate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginVertical: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  unlimitedText: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
  },
  barContainer: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statsText: {
    color: '#CCC',
    fontSize: 14,
  },
  statsTextRemaining: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resetText: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'right',
  }
});
