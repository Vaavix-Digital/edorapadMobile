import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Mail, Lock, LogIn, ArrowLeft, BookOpen } from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { THEME } from '../../shared/constants/theme';
import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser, clearAuthError } from '../../store/slices/authSlice';
import { USER_ROLES } from '../../shared/types';
import { notificationService } from '../../services/notificationService';

export const TutorLoginScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tutorType, setTutorType] = useState<'online' | 'offline'>('online');

  const handleLogin = async () => {
    if (!email || !password) return;
    dispatch(clearAuthError());
    const role = tutorType === 'online' ? USER_ROLES.ONLINETUTOR : USER_ROLES.OFFLINETUTOR;
    const res = await dispatch(loginUser({ email, password, role }));
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
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={22} color={THEME.colors.textPrimary} />
            <Text style={styles.backText}>Back to Student Sign In</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Image
              source={require('../../../assets/edorapad-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Sign in to manage classes, attendance & students</Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {/* Tutor Mode Selector */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                onPress={() => setTutorType('online')}
                style={[styles.modeTab, tutorType === 'online' && styles.modeTabActive]}
              >
                <Text style={[styles.modeTabText, tutorType === 'online' && styles.modeTabTextActive]}>
                  Online Tutor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTutorType('offline')}
                style={[styles.modeTab, tutorType === 'offline' && styles.modeTabActive]}
              >
                <Text style={[styles.modeTabText, tutorType === 'offline' && styles.modeTabTextActive]}>
                  Offline Faculty
                </Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Tutor Email"
              placeholder="faculty@edorapad.com"
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

            <Button
              title="Sign In as Teacher"
              onPress={handleLogin}
              loading={loading}
              icon={<LogIn size={18} color="#FFF" />}
              size="lg"
              style={styles.submitButton}
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
    paddingVertical: THEME.spacing.md,
  },
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
  logoImage: {
    width: 220,
    height: 48,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: THEME.typography.sizes.xs,
    color: THEME.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
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
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.borderRadius.md,
    padding: 4,
    marginBottom: THEME.spacing.md,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.sm,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  modeTabText: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  modeTabTextActive: {
    color: THEME.colors.primaryDark,
    fontWeight: '700',
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
  submitButton: {
    marginTop: THEME.spacing.sm,
  },
});
