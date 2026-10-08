import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Alert, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { THEME } from '../../shared/constants/theme';
import { authApi } from '../../shared/api/authApi';
import { setCredentials } from '../../store/slices/authSlice';
import { notificationService } from '../../services/notificationService';
import { ArrowLeft, Key } from 'lucide-react-native';

export const PhoneVerificationScreen = ({ navigation, route }: any) => {
  const { phoneNumber, authResponse } = route.params || {};
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!phoneNumber) {
      Alert.alert('Error', 'No phone number provided');
      navigation.goBack();
    }
  }, [phoneNumber]);

  const handleVerify = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await authApi.verifyPhone({ phoneNumber, otp: otp.trim() });
      if (res.success) {
        // Log them in using the authResponse tokens from Signup if available
        const token = res.accessToken || authResponse?.accessToken;
        const user = res.data || authResponse?.data;
        if (token && user) {
          dispatch(setCredentials({ user, token }));
          if (user.id) {
            notificationService.registerForPushNotifications(user.id);
          }
        } else {
          Alert.alert('Success', 'Phone verified! Please sign in.');
          navigation.navigate('Login');
        }
      } else {
        setError(res.message || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      setError(null);
      const res = await authApi.resendOtp({ phoneNumber });
      if (res.success) {
        Alert.alert('Success', 'A new OTP has been sent to your phone');
      } else {
        setError(res.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setResending(false);
    }
  };

  const skipVerification = () => {
    if (authResponse?.accessToken && authResponse?.data) {
      dispatch(setCredentials({ user: authResponse.data, token: authResponse.accessToken }));
      if (authResponse.data.id) {
        notificationService.registerForPushNotifications(authResponse.data.id);
      }
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={THEME.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Verify Phone</Text>
            <Text style={styles.subtitle}>
              We've sent an OTP to {phoneNumber}
            </Text>
          </View>

          <View style={styles.formCard}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Enter OTP"
              placeholder="6-digit code"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              leftIcon={<Key size={18} color={THEME.colors.textMuted} />}
              maxLength={6}
            />

            <Button
              title="Verify & Continue"
              onPress={handleVerify}
              loading={loading}
              size="lg"
              style={styles.submitButton}
            />

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive code? </Text>
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Text style={[styles.resendLink, resending && { opacity: 0.5 }]}>
                  {resending ? 'Sending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity style={styles.skipButton} onPress={skipVerification}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingVertical: THEME.spacing.lg },
  backButton: { marginBottom: THEME.spacing.lg, alignSelf: 'flex-start' },
  header: { marginBottom: THEME.spacing.xl },
  title: { fontSize: THEME.typography.sizes.xxl, fontWeight: '700', color: THEME.colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: THEME.typography.sizes.sm, color: THEME.colors.textSecondary },
  formCard: {
    backgroundColor: THEME.colors.surface, borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg, borderWidth: 1, borderColor: THEME.colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  errorBox: { backgroundColor: THEME.colors.errorLight, padding: 10, borderRadius: THEME.borderRadius.md, marginBottom: THEME.spacing.md },
  errorBoxText: { color: THEME.colors.error, fontSize: THEME.typography.sizes.xs, fontWeight: '600' },
  submitButton: { marginTop: THEME.spacing.md, marginBottom: THEME.spacing.lg },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { fontSize: THEME.typography.sizes.sm, color: THEME.colors.textSecondary },
  resendLink: { fontSize: THEME.typography.sizes.sm, color: THEME.colors.primary, fontWeight: '700' },
  skipButton: { marginTop: THEME.spacing.xl, alignItems: 'center' },
  skipText: { fontSize: THEME.typography.sizes.sm, color: THEME.colors.textMuted, fontWeight: '600', textDecorationLine: 'underline' }
});
