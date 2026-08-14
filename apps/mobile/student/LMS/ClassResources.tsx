import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../core/api';

interface ClassResourcesProps {
  classId: string;
  navigation?: any;
}

export const ClassResources: React.FC<ClassResourcesProps> = ({ classId, navigation }) => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await api.get('/resources', { params: { classId } });
        setResources(response.data.data || []);
      } catch (err) {
        console.warn('[ClassResources] Failed to load resources', err);
      } finally {
        setLoading(false);
      }
    };
    if (classId) fetchResources();
  }, [classId]);

  const handleOpenResource = (resource: any) => {
    if (navigation) {
      navigation.navigate('ResourceViewer', {
        resourceId: resource.id,
        title: resource.title,
      });
    } else {
      console.warn('[ClassResources] navigation prop not provided. Cannot open ResourceViewer.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  if (resources.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="document-text" size={24} color="#10b981" />
        <Text style={styles.title}>Class Resources</Text>
      </View>

      <View style={styles.grid}>
        {resources.map((res) => (
          <TouchableOpacity
            key={res.id}
            style={styles.card}
            onPress={() => handleOpenResource(res)}
          >
            <Ionicons name="document" size={32} color="#64748b" style={styles.icon} />
            <View style={styles.content}>
              <Text style={styles.resTitle} numberOfLines={1}>{res.title}</Text>
              <Text style={styles.resType}>{res.type} • {res.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 20,
    backgroundColor: 'rgba(26, 10, 10, 0.4)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  loadingContainer: {
    marginTop: 24,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  grid: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#130707',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  icon: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  resTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resType: {
    color: '#64748b',
    fontSize: 12,
    textTransform: 'uppercase',
  },
});
