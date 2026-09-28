import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Video, ClipboardCheck, User, Users } from 'lucide-react-native';

import { TutorDashboardScreen } from '../screens/tutor/TutorDashboardScreen';
import { LiveClassesScreen } from '../screens/tutor/LiveClassesScreen';
import { ScheduleClassScreen } from '../screens/tutor/ScheduleClassScreen';
import { TutorBatchesScreen } from '../screens/tutor/TutorBatchesScreen';
import { TutorTasksScreen } from '../screens/tutor/TutorTasksScreen';
import { AttendanceMarkingScreen } from '../screens/institute/AttendanceMarkingScreen';
import { LeaveRequestScreen } from '../screens/tutor/LeaveRequestScreen';
import { NotificationsScreen } from '../screens/common/NotificationsScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';
import { InstituteCommunityScreen } from '../screens/institute/InstituteCommunityScreen';
import { TutorSettingsScreen } from '../screens/tutor/TutorSettingsScreen';
import { PricingPlansScreen } from '../screens/common/PricingPlansScreen';
import { THEME } from '../shared/constants/theme';
import { useAppSelector } from '../store';
import { normalizeUserRole } from '../store/slices/authSlice';
import { USER_ROLES } from '../shared/types';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TutorStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TutorDashboard" component={TutorDashboardScreen} />
    <Stack.Screen name="LiveClasses" component={LiveClassesScreen} />
    <Stack.Screen name="ScheduleClass" component={ScheduleClassScreen} />
    <Stack.Screen name="TutorBatches" component={TutorBatchesScreen} />
    <Stack.Screen name="TutorTasks" component={TutorTasksScreen} />
    <Stack.Screen name="AttendanceMarking" component={AttendanceMarkingScreen} />
    <Stack.Screen name="LeaveRequest" component={LeaveRequestScreen} />
    <Stack.Screen name="Community" component={InstituteCommunityScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Settings" component={TutorSettingsScreen} />
    <Stack.Screen name="PricingPlans" component={PricingPlansScreen} />
  </Stack.Navigator>
);

export const TutorTabNavigator = () => {
  const { user, role } = useAppSelector((state) => state.auth);
  const normalizedRole = normalizeUserRole(role || user?.role || '');
  const isOnlineTutor = normalizedRole === USER_ROLES.ONLINETUTOR;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3E7B74',
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
        component={TutorStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      {isOnlineTutor ? (
        <Tab.Screen
          name="ClassesTab"
          component={LiveClassesScreen}
          options={{
            tabBarLabel: 'Classes',
            tabBarIcon: ({ color, size }) => <Video size={size} color={color} />,
          }}
        />
      ) : (
        <Tab.Screen
          name="BatchesTab"
          component={TutorBatchesScreen}
          options={{
            tabBarLabel: 'Batches',
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
      )}
      <Tab.Screen
        name="AttendanceTab"
        component={AttendanceMarkingScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color, size }) => <ClipboardCheck size={size} color={color} />,
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
