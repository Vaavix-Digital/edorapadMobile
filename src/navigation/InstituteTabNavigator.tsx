import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, ClipboardCheck, CheckSquare, User, Bell } from 'lucide-react-native';

import { InstituteDashboardScreen } from '../screens/institute/InstituteDashboardScreen';
import { AttendanceMarkingScreen } from '../screens/institute/AttendanceMarkingScreen';
import { LeaveApprovalsScreen } from '../screens/institute/LeaveApprovalsScreen';
import { InstituteAdmissionsScreen } from '../screens/institute/InstituteAdmissionsScreen';
import { InstituteCoursesScreen } from '../screens/institute/InstituteCoursesScreen';
import { InstituteDepartmentsScreen } from '../screens/institute/InstituteDepartmentsScreen';
import { InstituteStaffScreen } from '../screens/institute/InstituteStaffScreen';
import { InstituteBatchesScreen } from '../screens/institute/InstituteBatchesScreen';
import { InstituteCertificatesScreen } from '../screens/institute/InstituteCertificatesScreen';
import { InstituteSettingsScreen } from '../screens/institute/InstituteSettingsScreen';
import { InstituteCommunityScreen } from '../screens/institute/InstituteCommunityScreen';
import { InstituteProfileScreen } from '../screens/institute/InstituteProfileScreen';
import { NotificationsScreen } from '../screens/common/NotificationsScreen';
import { THEME } from '../shared/constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const InstituteStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="InstituteDashboard" component={InstituteDashboardScreen} />
    <Stack.Screen name="Admissions" component={InstituteAdmissionsScreen} />
    <Stack.Screen name="Courses" component={InstituteCoursesScreen} />
    <Stack.Screen name="Community" component={InstituteCommunityScreen} />
    <Stack.Screen name="Departments" component={InstituteDepartmentsScreen} />
    <Stack.Screen name="StaffManagement" component={InstituteStaffScreen} />
    <Stack.Screen name="AttendanceMarking" component={AttendanceMarkingScreen} />
    <Stack.Screen name="LeaveApprovals" component={LeaveApprovalsScreen} />
    <Stack.Screen name="Batches" component={InstituteBatchesScreen} />
    <Stack.Screen name="Certificates" component={InstituteCertificatesScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="Profile" component={InstituteProfileScreen} />
    <Stack.Screen name="Settings" component={InstituteSettingsScreen} />
  </Stack.Navigator>
);

export const InstituteTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME.colors.primary,
        tabBarInactiveTintColor: THEME.colors.textMuted,
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopColor: THEME.colors.borderLight,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={InstituteStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AttendanceTab"
        component={AttendanceMarkingScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => <ClipboardCheck size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="LeavesTab"
        component={LeaveApprovalsScreen}
        options={{
          tabBarLabel: 'Leaves',
          tabBarIcon: ({ color, size }) => <CheckSquare size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={InstituteProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
