import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Alert, Modal, TouchableOpacity } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { THEME } from '../../shared/constants/theme';
import { notificationService } from '../../services/notificationService';
import { storageService } from '../../services/storage';
import { STORAGE_KEYS } from '../../shared/constants';
import { useAppDispatch } from '../../store';
import { setCredentials, normalizeUserRole } from '../../store/slices/authSlice';
import Svg, { Path } from 'react-native-svg';

const API_URL = 'https://server.edorapad.com';

const ROLE_OPTIONS = [
  { value: 'Student', label: 'Student', hint: 'Join courses and classes' },
  { value: 'Course Creator', label: 'Course Creator', hint: 'Create and sell your own courses' },
  { value: 'Institute', label: 'Institute', hint: 'Run your institute, staff and students' },
];

interface Props {
  onLoggedIn: (user: any) => void;
}

const AppleSignInButton: React.FC<Props> = ({ onLoggedIn }) => {
  const dispatch = useAppDispatch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [showRolePicker, setShowRolePicker] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState(ROLE_OPTIONS[0].value);
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setIsAppleAuthAvailable);
    }
  }, []);

  if (Platform.OS !== 'ios' || !isAppleAuthAvailable) {
    return null;
  }

  const handleApiLogin = async (authData: any, role?: string) => {
    try {
      const fcmToken = await storageService.getItem(STORAGE_KEYS.PUSH_TOKEN) || null;

      const body = {
        identityToken: authData.identityToken,
        authorizationCode: authData.authorizationCode,
        nonce: authData.nonce,
        fullName: authData.fullName,
        fcmToken,
        platform: 'ios',
        ...(role ? { role } : {}),
      };

      const response = await fetch(`${API_URL}/api/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await response.json();

      if (!response.ok) {
        if (json.code === 'APPLE_ROLE_REQUIRED') {
          setPendingAuth(authData);
          setShowRolePicker(true);
          return;
        }
        throw new Error(json.message || 'Apple login failed');
      }

      const user = json.user || json.data;
      const token = json.accessToken || json.token;

      if (user && token) {
        await storageService.setToken(token);
        const normalizedRole = normalizeUserRole(user.role);
        dispatch(setCredentials({ user: { ...user, role: normalizedRole }, token, role: normalizedRole }));
      }

      onLoggedIn(json);
    } catch (err: any) {
      console.log('Apple Sign-In API Error:', err);
      setError(err.message || 'An error occurred during Apple sign-in.');
    } finally {
      setBusy(false);
    }
  };

  const handlePress = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      await handleApiLogin(res);
    } catch (e: any) {
      console.log('Apple Sign-In Auth Error:', e);
      setBusy(false);
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // User canceled, silently ignore
      } else {
        setError(e.message || 'Apple sign-in failed. Please try again.');
      }
    }
  };

  const handleRoleSubmit = async () => {
    if (!pendingAuth) return;
    setShowRolePicker(false);
    setBusy(true);
    setError('');
    await handleApiLogin(pendingAuth, selectedRole);
  };

  return (
    <>
      <View style={styles.container}>
        {busy ? (
          <View style={styles.busyContainer}>
            <ActivityIndicator size="small" color={THEME.colors.textSecondary} />
            <Text style={styles.busyText}>Signing in...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.customAppleButton}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Svg width="20" height="20" viewBox="0 0 384 512" fill={THEME.colors.textPrimary}>
              <Path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
            </Svg>
            <Text style={styles.customAppleButtonText}>
              Continue with Apple
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={showRolePicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose your role</Text>
            <Text style={styles.modalSubtitle}>How will you use Edorapad?</Text>

            {ROLE_OPTIONS.map(role => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.roleOption,
                  selectedRole === role.value && styles.roleOptionSelected
                ]}
                onPress={() => setSelectedRole(role.value)}
              >
                <Text style={[
                  styles.roleLabel,
                  selectedRole === role.value && styles.roleLabelSelected
                ]}>{role.label}</Text>
                <Text style={styles.roleHint}>{role.hint}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleRoleSubmit}
            >
              <Text style={styles.submitButtonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowRolePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: THEME.spacing.sm,
  },
  customAppleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 51,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: '#fff',
  },
  customAppleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  busyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 51,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: '#fff',
    gap: 8,
  },
  busyText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
    color: THEME.colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    color: THEME.colors.textSecondary,
    marginBottom: 20,
  },
  roleOption: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  roleOptionSelected: {
    borderColor: THEME.colors.primary,
    backgroundColor: `${THEME.colors.primary}10`,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  roleLabelSelected: {
    color: THEME.colors.primary,
  },
  roleHint: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  submitButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: THEME.colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AppleSignInButton;

