import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Calendar, Award, User } from 'lucide-react-native';

import { ParentDashboardScreen } from '../screens/parent/ParentDashboardScreen';
import { ParentAttendanceScreen } from '../screens/parent/ParentAttendanceScreen';
import { ParentExamResultsScreen } from '../screens/parent/ParentExamResultsScreen';
import { ParentNotificationsScreen } from '../screens/parent/ParentNotificationsScreen';
import { ParentProfileScreen } from '../screens/parent/ParentProfileScreen';
import { ParentSettingsScreen } from '../screens/parent/ParentSettingsScreen';
import { THEME } from '../shared/constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const ParentStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
    <Stack.Screen name="Attendance" component={ParentAttendanceScreen} />
    <Stack.Screen name="ExamResults" component={ParentExamResultsScreen} />
    <Stack.Screen name="Notifications" component={ParentNotificationsScreen} />
    <Stack.Screen name="Profile" component={ParentProfileScreen} />
    <Stack.Screen name="Settings" component={ParentSettingsScreen} />
  </Stack.Navigator>
);

export const ParentTabNavigator = () => {
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
        component={ParentStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AttendanceTab"
        component={ParentAttendanceScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ExamResultsTab"
        component={ParentExamResultsScreen}
        options={{
          tabBarLabel: 'Exams',
          tabBarIcon: ({ color, size }) => <Award size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ParentProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
