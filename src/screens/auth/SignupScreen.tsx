import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Alert,
  Image,
} from 'react-native';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  ChevronDown,
  Check,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { THEME } from '../../shared/constants/theme';
import { authApi } from '../../shared/api/authApi';
import { USER_ROLES } from '../../shared/types';

interface RoleOption {
  label: string;
  value: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { label: 'Student', value: USER_ROLES.STUDENT },
  { label: 'Institute', value: USER_ROLES.INSTITUTE },
  { label: 'Course Creator', value: USER_ROLES.COURSE_CREATOR },
  { label: 'Online Tutor', value: USER_ROLES.ONLINETUTOR },
  { label: 'Offline Faculty', value: USER_ROLES.OFFLINETUTOR },
  { label: 'Parent', value: USER_ROLES.PARENT },
];

export const SignupScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>(USER_ROLES.STUDENT);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRoleLabel =
    ROLE_OPTIONS.find((r) => r.value === role)?.label || 'Student';

  const handleSignup = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter a password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const payload: Record<string, any> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      };
      if (phone.trim()) {
        payload.phone = phone.trim();
      }

      const res = await authApi.register(payload);
      if (res.success || res.token || res.accessToken) {
        Alert.alert(
          'Account Created',
          'Your account has been created successfully. Please sign in.',
          [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        setError(res.message || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Registration failed.';
      setError(serverMessage);
    } finally {
      setLoading(false);
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
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('../../../assets/edorapad-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.subtitle}>Create Your Account</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{error}</Text>
              </View>
            ) : null}

            {/* Full Name */}
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              leftIcon={<UserIcon size={18} color={THEME.colors.textMuted} />}
            />

            {/* Choose Role */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Choose Role</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setRoleModalVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectBoxText}>{selectedRoleLabel}</Text>
                <ChevronDown size={18} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Email */}
            <Input
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={18} color={THEME.colors.textMuted} />}
            />

            {/* Phone Number */}
            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              leftIcon={<Phone size={18} color={THEME.colors.textMuted} />}
            />

            {/* Create Password */}
            <Input
              label="Create Password"
              placeholder="Password"
              isPassword
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={18} color={THEME.colors.textMuted} />}
            />

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              placeholder="Confirm Password"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leftIcon={<Lock size={18} color={THEME.colors.textMuted} />}
            />

            {/* Submit Button */}
            <Button
              title="Signup"
              onPress={handleSignup}
              loading={loading}
              size="lg"
              style={styles.submitButton}
            />

            {/* Footer link to Login */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Role Selection Modal */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRoleModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Role</Text>
            {ROLE_OPTIONS.map((opt) => {
              const isSelected = opt.value === role;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.modalOption,
                    isSelected && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setRole(opt.value);
                    setRoleModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      isSelected && styles.modalOptionTextSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && <Check size={18} color={THEME.colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
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
  fieldContainer: {
    marginBottom: THEME.spacing.md,
  },
  fieldLabel: {
    fontSize: THEME.typography.sizes.xs,
    fontWeight: '600',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 12,
  },
  selectBoxText: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textPrimary,
    fontWeight: '500',
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
    marginBottom: THEME.spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
  },
  footerText: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.textSecondary,
  },
  footerLink: {
    fontSize: THEME.typography.sizes.sm,
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: THEME.typography.sizes.lg,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
    marginBottom: THEME.spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: THEME.borderRadius.sm,
  },
  modalOptionSelected: {
    backgroundColor: THEME.colors.background,
  },
  modalOptionText: {
    fontSize: THEME.typography.sizes.base,
    color: THEME.colors.textPrimary,
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: THEME.colors.primary,
  },
});
