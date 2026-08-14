import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AdminCourses } from './AdminCourses';
import { AdminSubjects } from './AdminSubjects';
import { AdminTopics } from './AdminTopics';
import { AdminClasses } from './AdminClasses';
import { AdminClassAttendance } from './AdminClassAttendance';
import { CourseForm } from './CourseForm';
import { ClassForm } from './ClassForm';
import { colors } from '@nermai/theme';

const Stack = createNativeStackNavigator();

export const AdminLMSNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="AdminCourses" component={AdminCourses} />
      <Stack.Screen name="AdminSubjects" component={AdminSubjects} />
      <Stack.Screen name="AdminTopics" component={AdminTopics} />
      <Stack.Screen name="AdminClasses" component={AdminClasses} />
      <Stack.Screen name="AdminClassAttendance" component={AdminClassAttendance} />
      <Stack.Screen name="CourseForm" component={CourseForm} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ClassForm" component={ClassForm} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
};
