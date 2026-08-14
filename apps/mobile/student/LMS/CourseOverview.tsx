import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AnimatedFadeIn } from '../../core/animations';
import { BookOpen, Video, FileCheck, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { StudentGlassCard } from '../../components/ui/StudentGlassCard';

export const CourseOverview = ({ route, navigation }: { route: any, navigation: any }) => {
  // Assuming course data is passed via navigation params
  const { courseId, course: paramCourse } = route.params || {};
  const course = paramCourse || { id: courseId || 'demo', title: 'Course Details', description: '' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{top:10,bottom:10,left:10,right:10}}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{course.title || 'Course Details'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AnimatedFadeIn style={styles.headerCard}>
          <Text style={styles.title}>Course Overview</Text>
          <Text style={styles.description}>
            {course.description || 'Welcome to the course. Comprehensive overview details will appear here as you progress through your learning journey.'}
          </Text>

          <TouchableOpacity style={styles.continueButton} onPress={() => navigation.navigate('CourseSyllabus', { courseId: course.id })}>
            <Text style={styles.continueButtonText}>View Syllabus</Text>
            <ArrowRight size={18} color="#121212" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </AnimatedFadeIn>

        <View style={styles.grid}>
          <FeatureCard 
            title="Curriculum" 
            desc="Structured modules covering all critical topics." 
            icon={BookOpen} 
            color="#D4AF37" 
            delay={100} 
          />
          <FeatureCard 
            title="Live Sessions" 
            desc="Interactive live classes with expert faculty." 
            icon={Video} 
            color="#4CAF50" 
            delay={200} 
          />
          <FeatureCard 
            title="Assessments" 
            desc="Regular tests to track your preparation." 
            icon={FileCheck} 
            color="#FF6B6B" 
            delay={300} 
          />
        </View>
      </ScrollView>
    </View>
  );
};

const FeatureCard = ({ title, desc, icon: Icon, color, delay }: any) => (
  <StudentGlassCard delay={delay} style={styles.featureCard}>
    <View style={styles.iconContainer}>
      <Icon size={24} color={color} />
    </View>
    <Text style={styles.featureTitle}>{title}</Text>
    <Text style={styles.featureDesc}>{desc}</Text>
  </StudentGlassCard>
);

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
  scrollContent: {
    padding: 20,
    paddingTop: 20,
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8F8F8',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#A0A0A0',
    lineHeight: 24,
    marginBottom: 24,
  },
  continueButton: {
    flexDirection: 'row',
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  continueButtonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  grid: {
    gap: 16,
  },
  featureCard: {
    padding: 20,
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8F8F8',
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: '#A0A0A0',
    lineHeight: 20,
  }
});
