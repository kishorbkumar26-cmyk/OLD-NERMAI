import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react-native';

interface Props {
  classId: string;
}

export const AttendanceStatusBadge: React.FC<Props> = ({ classId }) => {
  const [statusData, setStatusData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';
        const response = await fetch(`${apiUrl}/attendance/status/${classId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const resJson = await response.json();
        
        if (mounted && resJson.data) {
          setStatusData(resJson.data);
        }
      } catch (err) {
        // Silent catch for polling
      }
    };

    if (classId) {
      fetchStatus();
      interval = setInterval(fetchStatus, 30000); // poll every 30s
    }
    
    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [classId]);

  if (!statusData) return null;

  const { status, percentage } = statusData;

  const getBadgeStyle = () => {
    const finalResultStatus = statusData.finalResult?.status;
    
    if (finalResultStatus === 'Present' || status === 'COMPLETED' || status === 'Present') {
      return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.2)', icon: CheckCircle2, label: 'Attendance Met' };
    }
    
    if (finalResultStatus === 'Absent' || status === 'Absent') {
      return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.2)', icon: AlertCircle, label: 'Absent' };
    }

    if (finalResultStatus === 'Late' || status === 'Late') {
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)', icon: AlertCircle, label: 'Late' };
    }

    if (status === 'FINALIZED') {
      return { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.2)', icon: CheckCircle2, label: 'Finalized' };
    }

    if (status === 'PROCESSING') {
      return { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.2)', icon: RefreshCw, label: 'Processing...' };
    }
    
    // IN_PROGRESS or NOT_STARTED
    return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)', icon: Clock, label: `Watching (${Math.round(percentage || 0)}%)` };
  };

  const style = getBadgeStyle();
  const Icon = style.icon;

  return (
    <View style={[styles.container, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Icon size={14} color={style.text} />
      <Text style={[styles.label, { color: style.text }]}>{style.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  }
});
