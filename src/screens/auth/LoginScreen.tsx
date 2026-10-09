import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Mail, Lock, LogIn } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser, clearAuthError } from '../../store/slices/authSlice';
import { notificationService } from '../../services/notificationService';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import AppleSignInButton from '../../components/auth/AppleSignInButton';
export const LoginScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!identifier.trim() || !password) return;
    dispatch(clearAuthError());
    const res = await dispatch(
      loginUser({ email: identifier.trim(), password })
    );
    if (loginUser.fulfilled.match(res)) {
      const user = res.payload.user;
      if (user?.id) {
        notificationService.registerForPushNotifications(user.id);
      }
      // RootNavigator automatically transitions to the role dashboard or face verification based on auth state
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo & Welcome */}
          <View style={styles.header}>
            <Image
              source={require('../../../assets/edorapad-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Educational Management Portal</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Please sign in to your account</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            ) : null}

            {/* Email ID / Unique ID */}
            <Input
              label="Email ID / Unique ID"
              placeholder="STF-001 or name@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              value={identifier}
              onChangeText={setIdentifier}
              leftIcon={<Mail size={18} color={THEME.colors.textMuted} />}
            />

            {/* Password with Forgot ID & Password Link */}
            <View style={styles.passwordLabelRow}>
              <Text style={styles.passwordLabel}>Password</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('ResetPassword')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.forgotPasswordText}>
                  Forgot ID & Password?
                </Text>
              </TouchableOpacity>
            </View>
            <Input
              placeholder="••••••••••••"
              isPassword
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={18} color={THEME.colors.textMuted} />}
              containerStyle={styles.passwordInputContainer}
            />

            {/* Submit Button */}
            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              icon={<LogIn size={18} color="#FFF" />}
              size="lg"
              style={styles.submitButton}
            />

            {/* OR Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In */}
            <GoogleSignInButton
              onLoggedIn={(payload) => {
                const user = payload?.user;
                if (user?.id) {
                  notificationService.registerForPushNotifications(user.id);
                }
              }}
            />

            {/* Apple Sign-In */}
            {Platform.OS === 'ios' && (
              <AppleSignInButton
                onLoggedIn={(payload) => {
                  const user = payload?.user;
                  if (user?.id) {
                    notificationService.registerForPushNotifications(user.id);
                  }
                }}
              />
            )}

            {/* Bottom Divider */}
            <View style={styles.bottomDivider} />

            {/* Create Account link */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Signup')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.createAccountText}>Create an account</Text>
              </TouchableOpacity>
            </View>

            {/* Privacy Policy & Terms */}
            <Text style={styles.termsText}>Privacy Policy & Terms</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: THEME.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  logoImage: {
    width: 220,
    height: 48,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textSecondary,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.lg,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: THEME.colors.errorLight,
    padding: 10,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
  },
  errorBoxText: {
    color: THEME.colors.error,
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '600',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  passwordLabel: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  forgotPasswordText: {
    color: THEME.colors.primary,
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '600',
  },
  passwordInputContainer: {
    marginBottom: THEME.spacing.sm,
  },
  submitButton: {
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: THEME.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomDivider: {
    height: 1,
    backgroundColor: THEME.colors.borderLight,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerText: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textSecondary,
  },
  createAccountText: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  termsText: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
