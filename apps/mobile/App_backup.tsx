import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { ErrorBoundary } from 'react-error-boundary';

// Auth Provider
import { AuthProvider, useAuth } from './core/auth/AuthProvider';

// Auth Screens
import { LoginPage } from './auth/LoginPage';
import { RegisterPage } from './auth/RegisterPage';
import { AdminLoginPage } from './auth/AdminLoginPage';

// LMS Screens
import { StudentDashboard } from './student/Student_Dashboard/StudentDashboard';
import { CoursesPage } from './student/LMS/CoursesPage';
import { CourseOverview } from './student/LMS/CourseOverview';
import { CourseSyllabus } from './student/LMS/CourseSyllabus';
import { PlayerAccess } from './student/LMS/PlayerAccess';
import { MyRequests } from './student/LMS/MyRequests';
// import { ResourceViewer } from './student/LMS/ResourceViewer';
import { View as ResourceViewer } from 'react-native';
import { StudentNavigator } from './student/StudentNavigator';

// Admin Screens
import { AdminNavigator } from './admin/AdminNavigator';

const Stack = createNativeStackNavigator();

// Sub-navigator for authenticated students
const AppNavigator = () => {
  const { currentUser, role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#121212' } }}>
      {currentUser ? (
        // Authenticated Routes
        role === 'admin' || role === 'super_admin' ? (
          <>
            <Stack.Screen name="AdminRoot" component={AdminNavigator} />
          </>
        ) : (
          <>
            <Stack.Screen name="StudentRoot" component={StudentNavigator} />
            <Stack.Screen name="CourseOverview" component={CourseOverview} />
            <Stack.Screen name="CourseSyllabus" component={CourseSyllabus} />
            <Stack.Screen name="PlayerAccess" component={PlayerAccess} />
            <Stack.Screen name="MyRequests" component={MyRequests} />
            <Stack.Screen name="ResourceViewer" component={ResourceViewer} />
          </>
        )
      ) : (
        // Unauthenticated Routes
        <>
          <Stack.Screen name="Login" component={LoginPage} />
          <Stack.Screen name="Register" component={RegisterPage} />
          <Stack.Screen name="AdminLogin" component={AdminLoginPage} />
        </>
      )}
    </Stack.Navigator>
  );
};

const linking = {
  prefixes: ['nermai://', 'https://academy.nermai.com'],
  config: {
    screens: {
      StudentDashboard: 'dashboard',
      AdminDashboard: 'admin/dashboard',
      Courses: 'courses',
      CourseSyllabus: 'course/:courseId',
      PlayerAccess: 'course/:courseId/class/:classId/video',
      ResourceViewer: 'course/:courseId/class/:classId/resource/:resourceId',
    },
  },
};

import { GestureHandlerRootView } from 'react-native-gesture-handler';

const ErrorFallback = ({ error }: { error: Error }) => (
  <View style={{ flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <Text style={{ color: '#fff', fontSize: 18, marginBottom: 10 }}>Something went wrong!</Text>
    <Text style={{ color: '#ff6b6b', fontSize: 14, textAlign: 'center' }}>{error.message}</Text>
  </View>
);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <AuthProvider>
          <NavigationContainer linking={linking}>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
