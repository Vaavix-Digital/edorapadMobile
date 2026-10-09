import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Alert, Modal, TouchableOpacity } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { THEME } from '../../shared/constants/theme';
import { notificationService } from '../../services/notificationService';

// ─── Role options ───────────────────────────────────────────────────────────
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
  const [pending, setPending] = useState<{
    identityToken: string; email?: string; fullName?: string;
  } | null>(null);
  const [selectedRole, setSelectedRole] = useState(ROLE_OPTIONS[0].value);

  // If not iOS or Apple Auth is not available, we shouldn't render the button.
  // Note: We'll assume it's conditionally rendered by the parent, but we add a check here.
  const [isAvailable, setIsAvailable] = useState(false);
  React.useEffect(() => {
    async function checkAvailability() {
      const available = await AppleAuthentication.isAvailableAsync();
      setIsAvailable(available);
    }
    if (Platform.OS === 'ios') {
      checkAvailability();
    }
  }, []);

  if (!isAvailable) return null;

  const handlePress = async () => {
    setError('');
    setBusy(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      const { identityToken, email, fullName } = credential;
      
      if (!identityToken) {
        setError('Apple sign-in did not return a valid credential.');
        return;
      }

      // Here you would typically dispatch an action to your backend like:
      // const result = await dispatch(appleLogin({ identityToken })).unwrap();
      // onLoggedIn(result);

      // For now, since backend is not fully connected for Apple in authSlice,
      // we mock the success or show the role picker if new user.
      Alert.alert(
        "Apple Sign-In Success",
        "Frontend integration complete. Connect the identityToken to your backend auth API."
      );

    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // user cancelled, silently ignore
      } else {
        setError(e.message || 'Apple sign-in failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
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
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={THEME.borderRadius.lg}
            style={styles.appleButton}
            onPress={handlePress}
          />
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  }
});

export default AppleSignInButton;
