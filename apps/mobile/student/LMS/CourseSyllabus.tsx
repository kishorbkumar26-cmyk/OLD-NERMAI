import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CourseApi } from '@nermai/api';
import { Ionicons } from '@expo/vector-icons';
import { configureLayoutAnimation } from '../../core/animations';

interface SyllabusNode {
  id: string;
  title: string;
  type: 'subject' | 'topic' | 'class';
  children?: SyllabusNode[];
  isLocked?: boolean;
}

export const CourseSyllabus = ({ route, navigation }: { route: any, navigation: any }) => {
  const { courseId, courseTitle, batchId } = route.params;
  const [syllabus, setSyllabus] = useState<SyllabusNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        // Build hierarchy: Course -> Subjects -> Topics -> Classes
        const subjRes = await CourseApi.listSubjectsByCourse(courseId);
        const subjects = subjRes.data?.data || [];
        
        const fullSyllabus = await Promise.all(
          subjects.map(async (subject: any) => {
            const topicsRes = await CourseApi.listTopicsBySubject(subject.id);
            const topics = topicsRes.data?.data || [];
            
            const topicsWithClasses = await Promise.all(
              topics.map(async (topic: any) => {
                const classesRes = await CourseApi.listClassesByTopic(topic.id);
                const classes = classesRes.data?.data || [];
                
                return {
                  ...topic,
                  title: topic.name,
                  type: 'topic',
                  children: classes.map((c: any) => ({ ...c, type: 'class' }))
                };
              })
            );
            
            return {
              ...subject,
              title: subject.name,
              type: 'subject',
              children: topicsWithClasses
            };
          })
        );
        
        setSyllabus(fullSyllabus);
      } catch (error) {
        console.error('Failed to fetch syllabus:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSyllabus();
  }, [courseId]);

  const toggleNode = (id: string) => {
    configureLayoutAnimation();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClassPress = (classItem: any) => {
    navigation.navigate('PlayerAccess', { 
      classId: classItem.id, 
      classTitle: classItem.title || classItem.name,
      courseId,
      batchId: batchId || null
    });
  };

  const renderNode = (node: SyllabusNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    
    if (node.type === 'class') {
      return (
        <TouchableOpacity 
          key={node.id} 
          style={[styles.classItem, { marginLeft: level * 20 }]}
          onPress={() => handleClassPress(node)}
        >
          <Ionicons name="play-circle-outline" size={24} color="#D4AF37" />
          <Text style={styles.classTitle}>{node.title}</Text>
          {node.isLocked && <Ionicons name="lock-closed" size={16} color="#888" />}
        </TouchableOpacity>
      );
    }

    return (
      <View key={node.id} style={{ marginLeft: level > 0 ? 20 : 0, marginTop: level === 0 ? 16 : 8 }}>
        <TouchableOpacity 
          style={[styles.folderItem, level === 0 && styles.subjectItem]}
          onPress={() => toggleNode(node.id)}
        >
          <Ionicons 
            name={isExpanded ? 'folder-open' : 'folder'} 
            size={level === 0 ? 24 : 20} 
            color={level === 0 ? '#F8F8F8' : '#D4AF37'} 
          />
          <Text style={[styles.folderTitle, level === 0 && styles.subjectTitle]}>
            {node.title}
          </Text>
          {hasChildren && (
            <Ionicons 
              name={isExpanded ? 'chevron-down' : 'chevron-forward'} 
              size={20} 
              color="#888" 
            />
          )}
        </TouchableOpacity>
        
        {isExpanded && hasChildren && (
          <View>
            {node.children!.map(child => renderNode(child, level + 1))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('StudentRoot')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{courseTitle}</Text>
      </View>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {syllabus.length > 0 ? (
             syllabus.map(subject => renderNode(subject))
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No syllabus content available.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subjectItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  subjectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  folderTitle: {
    fontSize: 16,
    color: '#E5E5E5',
    flex: 1,
    marginLeft: 12,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderRadius: 8,
    marginTop: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#D4AF37',
  },
  classTitle: {
    fontSize: 15,
    color: '#FFF',
    flex: 1,
    marginLeft: 12,
  }
});
