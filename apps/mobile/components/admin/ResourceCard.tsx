import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, MoreVertical, Edit2, Trash2 } from 'lucide-react-native';
import { AnimatedStagger } from '../../core/animations';

interface ResourceCardProps {
  title: string;
  type: string;
  batchInfo: string;
  isFeatured?: boolean;
  version?: string;
  onOptionsPress?: () => void;
  delay?: number;
}

export const ResourceCard = ({
  title, type, batchInfo, isFeatured, version, onOptionsPress, delay = 0
}: ResourceCardProps) => {
  return (
    <AnimatedStagger delay={delay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <FileText size={20} color="#D4AF37" />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.tagsContainer}>
              <Text style={styles.tag}>{type}</Text>
              <Text style={styles.tag}>{batchInfo}</Text>
              {isFeatured && <Text style={[styles.tag, styles.featuredTag]}>Featured</Text>}
              {version && <Text style={styles.tag}>{version}</Text>}
            </View>
          </View>
          <TouchableOpacity onPress={onOptionsPress} style={styles.moreButton}>
            <MoreVertical size={20} color="#888" />
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedStagger>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#CCC',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredTag: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    color: '#D4AF37',
  },
  moreButton: {
    padding: 4,
  }
});
