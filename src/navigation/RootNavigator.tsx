import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector, useAppDispatch } from '../store';
import { setInitialized, normalizeUserRole, setUserFaceState } from '../store/slices/authSlice';
import { USER_ROLES } from '../shared/types';
import { configureApiClient } from '../shared/api/client';
import { mobileTokenProvider } from '../services/storage';

import { AuthNavigator } from './AuthNavigator';
import { InstituteTabNavigator } from './InstituteTabNavigator';
import { TutorTabNavigator } from './TutorTabNavigator';
import { StudentTabNavigator } from './StudentTabNavigator';
import { ParentTabNavigator } from './ParentTabNavigator';
import { AccountsTabNavigator } from './AccountsTabNavigator';
import { FaceVerificationScreen } from '../screens/common/FaceVerificationScreen';
import { initPushTokenListeners, syncPushTokenWithBackend } from '../services/push';

const Stack = createNativeStackNavigator();

/**
 * Roles that require face verification before reaching their dashboard.
 * Matches the web implementation: Online Tutor, Offline Tutor, Accounts & Marketing.
 */
const FACE_VERIFY_ROLES = [
  USER_ROLES.ONLINETUTOR,
  USER_ROLES.OFFLINETUTOR,
  USER_ROLES.ACCOUNTS_MARKETING,
];

export const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, role, isInitialized, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Configure API client with mobile SecureStore token provider
    configureApiClient({
      baseUrl: 'https://server.edorapad.com',
      tokenProvider: mobileTokenProvider,
    });
    dispatch(setInitialized());

    // Step 6: Listen for Firebase token rotation / refresh
    const unsubscribeTokenRefresh = initPushTokenListeners();

    // Step 7: Sync device token with backend on app start for existing authenticated sessions
    if (isAuthenticated) {
      syncPushTokenWithBackend();
    }

    return () => {
      unsubscribeTokenRefresh();
    };
  }, [dispatch, isAuthenticated]);

  const normalizedRole = normalizeUserRole(role || user?.role);

  /** Whether the current user must pass face verification before the dashboard */
  const needsFaceVerification =
    isAuthenticated &&
    FACE_VERIFY_ROLES.includes(normalizedRole as any) &&
    !user?.isFaceVerified;

  const getRoleNavigator = () => {
    switch (normalizedRole) {
      case USER_ROLES.ADMIN:
      case USER_ROLES.SUPER_ADMIN:
      case USER_ROLES.INSTITUTE:
        return <Stack.Screen name="InstituteApp" component={InstituteTabNavigator} />;
      case USER_ROLES.ONLINETUTOR:
      case USER_ROLES.OFFLINETUTOR:
      case USER_ROLES.COURSE_CREATOR:
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
          /* ── Not logged in: show auth flows ── */
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : needsFaceVerification ? (
          /* ── Logged in but face not verified: gate with face auth ── */
          <Stack.Screen name="FaceVerification">
            {() => (
              <FaceVerificationScreen
                onVerified={() => {
                  dispatch(setUserFaceState({ isFaceVerified: true }));
                }}
              />
            )}
          </Stack.Screen>
        ) : (
          /* ── Verified: show role dashboard ── */
          getRoleNavigator()
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
