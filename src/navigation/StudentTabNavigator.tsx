import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Video, CreditCard, Award, User } from 'lucide-react-native';

import { StudentDashboardScreen } from '../screens/student/StudentDashboardScreen';
import { StudentClassesScreen } from '../screens/student/StudentClassesScreen';
import { StudentPaymentsScreen } from '../screens/student/StudentPaymentsScreen';
import { StudentAssessmentsScreen } from '../screens/student/StudentAssessmentsScreen';
import { StudentCoursesScreen } from '../screens/student/StudentCoursesScreen';
import { StudentCommunityScreen } from '../screens/student/StudentCommunityScreen';
import { StudentCertificatesScreen } from '../screens/student/StudentCertificatesScreen';
import { StudentReferralScreen } from '../screens/student/StudentReferralScreen';
import { StudentSettingsScreen } from '../screens/student/StudentSettingsScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';
import { NotificationsScreen } from '../screens/common/NotificationsScreen';
import { THEME } from '../shared/constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const StudentStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
    <Stack.Screen name="Classes" component={StudentClassesScreen} />
    <Stack.Screen name="Payments" component={StudentPaymentsScreen} />
    <Stack.Screen name="Assessments" component={StudentAssessmentsScreen} />
    <Stack.Screen name="Courses" component={StudentCoursesScreen} />
    <Stack.Screen name="Community" component={StudentCommunityScreen} />
    <Stack.Screen name="Certificates" component={StudentCertificatesScreen} />
    <Stack.Screen name="Referral" component={StudentReferralScreen} />
    <Stack.Screen name="StudentSettings" component={StudentSettingsScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

export const StudentTabNavigator = () => {
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
        name="HomeTab"
        component={StudentStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ClassesTab"
        component={StudentClassesScreen}
        options={{
          tabBarLabel: 'Classes',
          tabBarIcon: ({ color, size }) => <Video size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="PaymentsTab"
        component={StudentPaymentsScreen}
        options={{
          tabBarLabel: 'Fees',
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AssessmentsTab"
        component={StudentAssessmentsScreen}
        options={{
          tabBarLabel: 'Exams',
          tabBarIcon: ({ color, size }) => <Award size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
