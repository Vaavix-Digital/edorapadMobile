import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector, useAppDispatch } from '../store';
import { setInitialized, normalizeUserRole } from '../store/slices/authSlice';
import { USER_ROLES } from '../shared/types';
import { configureApiClient } from '../shared/api/client';
import { mobileTokenProvider } from '../services/storage';

import { AuthNavigator } from './AuthNavigator';
import { InstituteTabNavigator } from './InstituteTabNavigator';
import { TutorTabNavigator } from './TutorTabNavigator';
import { StudentTabNavigator } from './StudentTabNavigator';
import { ParentTabNavigator } from './ParentTabNavigator';
import { AccountsTabNavigator } from './AccountsTabNavigator';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, role, isInitialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Configure API client with mobile SecureStore token provider
    configureApiClient({
      baseUrl: 'https://server.edorapad.com',
      tokenProvider: mobileTokenProvider,
    });
    dispatch(setInitialized());
  }, [dispatch]);

  const renderRoleNavigator = () => {
    const normalizedRole = normalizeUserRole(role);
    switch (normalizedRole) {
      case USER_ROLES.ADMIN:
      case USER_ROLES.SUPER_ADMIN:
      case USER_ROLES.INSTITUTE:
        return <Stack.Screen name="InstituteApp" component={InstituteTabNavigator} />;
      case USER_ROLES.ONLINETUTOR:
      case USER_ROLES.OFFLINETUTOR:
        return <Stack.Screen name="TutorApp" component={TutorTabNavigator} />;
      case USER_ROLES.PARENT:
        return <Stack.Screen name="ParentApp" component={ParentTabNavigator} />;
      case USER_ROLES.ACCOUNTS_MARKETING:
        return <Stack.Screen name="AccountsApp" component={AccountsTabNavigator} />;
      case USER_ROLES.STUDENT:
      default:
        return <Stack.Screen name="StudentApp" component={StudentTabNavigator} />;
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          renderRoleNavigator()
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
