import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Alert, Modal, TouchableOpacity } from 'react-native';
import { appleAuth, AppleButton } from '@invertase/react-native-apple-authentication';
import { THEME } from '../../shared/constants/theme';
import { notificationService } from '../../services/notificationService';

const API_URL = 'http://192.168.1.13:5002';

const ROLE_OPTIONS = [
  { value: 'Student',        label: 'Student',        hint: 'Join courses and classes' },
  { value: 'Course Creator', label: 'Course Creator', hint: 'Create and sell your own courses' },
  { value: 'Institute',      label: 'Institute',      hint: 'Run your institute, staff and students' },
];

interface Props {
  onLoggedIn: (user: any) => void;
}

const AppleSignInButton: React.FC<Props> = ({ onLoggedIn }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState(ROLE_OPTIONS[0].value);

  if (Platform.OS !== 'ios' || !appleAuth.isSupported) {
    return null;
  }

  const handleApiLogin = async (authData: any, role?: string) => {
    try {
      const fcmToken = await notificationService.getDeviceToken();
      
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

      onLoggedIn(json);
    } catch (err: any) {
      setError(err.message || 'An error occurred during Apple sign-in.');
    } finally {
      setBusy(false);
    }
  };

  const handlePress = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [
          appleAuth.Scope.EMAIL,
          appleAuth.Scope.FULL_NAME,
        ],
      });

      await handleApiLogin(res);
    } catch (e: any) {
      setBusy(false);
      if (e.code === appleAuth.Error.CANCELED) {
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
          <AppleButton
            buttonStyle={AppleButton.Style.BLACK}
            buttonType={AppleButton.Type.SIGN_IN}
            style={styles.appleButton}
            onPress={handlePress}
          />
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
  appleButton: {
    width: '100%',
    height: 48,
  },
  busyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
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

