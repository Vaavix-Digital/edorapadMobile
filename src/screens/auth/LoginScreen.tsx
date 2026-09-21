import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Mail, Lock, LogIn, GraduationCap } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser, clearAuthError } from '../../store/slices/authSlice';
import { notificationService } from '../../services/notificationService';

export const LoginScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    dispatch(clearAuthError());
    const res = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(res)) {
      const user = res.payload.user;
      if (user?.id) {
        notificationService.registerForPushNotifications(user.id);
      }
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo & Welcome */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <GraduationCap size={40} color="#FFF" />
            </View>
            <Text style={styles.brandTitle}>Edorapad</Text>
            <Text style={styles.subtitle}>Educational Management Portal</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSubtitle}>Access your student, parent or admin account</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Email Address"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={18} color={THEME.colors.textMuted} />}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              isPassword
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={18} color={THEME.colors.textMuted} />}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ResetPassword')}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              icon={<LogIn size={18} color="#FFF" />}
              size="lg"
              style={styles.submitButton}
            />

            {/* Switch to Tutor Login */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Teacher / Tutor Login"
              onPress={() => navigation.navigate('TutorLogin')}
              variant="outline"
              size="md"
            />
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
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.5,
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
    fontSize: THEME.typography.sizes.xl,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  formSubtitle: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textSecondary,
    marginBottom: THEME.spacing.md,
    marginTop: 2,
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: THEME.spacing.md,
  },
  forgotPasswordText: {
    color: THEME.colors.primary,
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '600',
  },
  submitButton: {
    marginBottom: THEME.spacing.sm,
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
});
