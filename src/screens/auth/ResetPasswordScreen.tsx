import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ArrowLeft, Mail, KeyRound, Lock, CheckCircle2 } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { THEME } from '../../shared/constants/theme';
import { authApi } from '../../shared/api/authApi';

export const ResetPasswordScreen = ({ navigation }: any) => {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    if (!identifier) {
      setError('Please enter your email or student/staff ID');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(identifier);
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP code. Please verify identifier.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || !newPassword) {
      setError('Please fill in both OTP and new password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.resetPassword({ identifier, otp, newPassword });
      Alert.alert('Success', 'Password has been reset successfully! Please sign in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please check the OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <ArrowLeft size={22} color={THEME.colors.textPrimary} />
        <Text style={styles.backText}>Back to Sign In</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <KeyRound size={32} color={THEME.colors.primary} />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {step === 'request'
            ? 'Enter your registered email to receive a recovery OTP code'
            : `Enter the OTP sent for ${identifier}`}
        </Text>
      </View>

      <View style={styles.card}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {step === 'request' ? (
          <>
            <Input
              label="Registered Email / User ID"
              placeholder="name@example.com"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              leftIcon={<Mail size={18} color={THEME.colors.textMuted} />}
            />
            <Button
              title="Send Verification OTP"
              onPress={handleSendOtp}
              loading={loading}
              size="lg"
            />
          </>
        ) : (
          <>
            <Input
              label="OTP Code"
              placeholder="6-digit code"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              leftIcon={<KeyRound size={18} color={THEME.colors.textMuted} />}
            />
            <Input
              label="New Password"
              placeholder="••••••••"
              isPassword
              value={newPassword}
              onChangeText={setNewPassword}
              leftIcon={<Lock size={18} color={THEME.colors.textMuted} />}
            />
            <Button
              title="Reset Password"
              onPress={handleResetPassword}
              loading={loading}
              size="lg"
            />
            <TouchableOpacity onPress={() => setStep('request')} style={styles.resendButton}>
              <Text style={styles.resendText}>Change email / Resend OTP</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.spacing.md,
    gap: 8,
  },
  backText: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: THEME.spacing.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  subtitle: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.borderLight,
    elevation: 2,
  },
  errorBox: {
    backgroundColor: THEME.colors.errorLight,
    padding: 10,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: THEME.spacing.md,
  },
  resendText: {
    color: THEME.colors.primary,
    fontSize: THEME.typography.sizes.sm,
    fontWeight: '600',
  },
});
