import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminMoreMenu } from './AdminMoreMenu';
import { AdminResources } from '../Resources/AdminResources';
import { AdminLiveSessions } from '../LiveSessions/AdminLiveSessions';
import { LiveAttendanceControlScreen } from '../LiveSessions/LiveAttendanceControlScreen';

import { ResourceForm } from '../Resources/ResourceForm';
import { AdminBatches } from './AdminBatches';
import { BatchForm } from './BatchForm';
import { ClassForm } from '../LMS/ClassForm';
import { colors } from '@nermai/theme';

const Stack = createNativeStackNavigator();

export const AdminMoreNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="AdminMoreMenu" component={AdminMoreMenu} />
      <Stack.Screen name="AdminResources" component={AdminResources} />
      <Stack.Screen name="AdminLiveSessions" component={AdminLiveSessions} />
      <Stack.Screen name="LiveAttendanceControl" component={LiveAttendanceControlScreen} />

      <Stack.Screen name="ResourceForm" component={ResourceForm} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AdminBatches" component={AdminBatches} />
      <Stack.Screen name="BatchForm" component={BatchForm} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ClassForm" component={ClassForm} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
};
