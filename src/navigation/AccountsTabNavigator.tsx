import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LayoutDashboard, Receipt, Banknote, User } from 'lucide-react-native';

import { AccountsDashboardScreen } from '../screens/accounts/AccountsDashboardScreen';
import { AccountsFeesScreen } from '../screens/accounts/AccountsFeesScreen';
import { AccountsSalaryScreen } from '../screens/accounts/AccountsSalaryScreen';
import { AccountsStaffScreen } from '../screens/accounts/AccountsStaffScreen';
import { AccountsMarketingScreen } from '../screens/accounts/AccountsMarketingScreen';
import { AccountsProfileScreen } from '../screens/accounts/AccountsProfileScreen';
import { AccountsSettingsScreen } from '../screens/accounts/AccountsSettingsScreen';
import { InstituteCommunityScreen } from '../screens/institute/InstituteCommunityScreen';
import { NotificationsScreen } from '../screens/common/NotificationsScreen';
import { THEME } from '../shared/constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const AccountsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AccountsDashboard" component={AccountsDashboardScreen} />
    <Stack.Screen name="AccountsFees" component={AccountsFeesScreen} />
    <Stack.Screen name="AccountsSalary" component={AccountsSalaryScreen} />
    <Stack.Screen name="AccountsStaff" component={AccountsStaffScreen} />
    <Stack.Screen name="AccountsMarketing" component={AccountsMarketingScreen} />
    <Stack.Screen name="AccountsCommunity" component={InstituteCommunityScreen} />
    <Stack.Screen name="AccountsProfile" component={AccountsProfileScreen} />
    <Stack.Screen name="AccountsSettings" component={AccountsSettingsScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

export const AccountsTabNavigator = () => {
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
        component={AccountsStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="FeesTab"
        component={AccountsFeesScreen}
        options={{
          tabBarLabel: 'Fees',
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SalaryTab"
        component={AccountsSalaryScreen}
        options={{
          tabBarLabel: 'Salary',
          tabBarIcon: ({ color, size }) => <Banknote size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={AccountsProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
