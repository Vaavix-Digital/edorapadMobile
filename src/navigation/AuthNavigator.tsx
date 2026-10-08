import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { TutorLoginScreen } from '../screens/auth/TutorLoginScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { PhoneVerificationScreen } from '../screens/auth/PhoneVerificationScreen';
import { PricingPlansScreen } from '../screens/common/PricingPlansScreen';

const Stack = createNativeStackNavigator();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="TutorLogin" component={TutorLoginScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      <Stack.Screen name="PricingPlans" component={PricingPlansScreen} />
    </Stack.Navigator>
  );
};
