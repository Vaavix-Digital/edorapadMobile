import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';
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
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import AppleSignInButton from '../../components/auth/AppleSignInButton';
import { notificationService } from '../../services/notificationService';
import { COUNTRY_CODES } from '../../shared/constants/countryCodes';

interface RoleOption {
  label: string;
  value: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  { label: 'Student', value: 'Student' },
  { label: 'Institute', value: 'Institute' },
  { label: 'Course Creator', value: 'Course Creator' },
];

export const SignupScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('Student');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
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
    if (name.trim().length < 3) {
      setError('Name must be at least 3 characters');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
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
    if (phone.trim()) {
      const rawPhone = phone.trim().replace(/[-\s]/g, '');
      if (rawPhone.length < 7 || rawPhone.length > 15 || !/^[0-9]+$/.test(rawPhone)) {
        setError('Phone number must be between 7 and 15 digits');
        return;
      }
    }

    try {
      setLoading(true);
      const payload: Record<string, any> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        role: role || 'Student',
      };
      if (phone.trim()) {
        payload.phoneNumber = `${countryCode}${phone.trim().replace(/[-\s]/g, '')}`;
      }

      const res = await authApi.register(payload);
      if (res.success || res.token || res.accessToken) {
        if (res.data?.isPhoneVerified === false && res.data?.phoneNumber) {
          navigation.navigate('PhoneVerification', { 
            phoneNumber: res.data.phoneNumber,
            authResponse: res 
          });
        } else {
          const token = res.accessToken || res.token;
          if (token && res.data) {
            dispatch(setCredentials({ user: res.data, token }));
            if (res.data.id) {
              notificationService.registerForPushNotifications(res.data.id);
            }
          } else {
            Alert.alert(
              'Account Created',
              'Your account has been created successfully. Please sign in.',
              [{ text: 'Sign In', onPress: () => navigation.navigate('Login') }]
            );
          }
        }
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

            {/* Phone Number with Country Code */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.selectBox, { flex: 0.17, marginRight: 8, height: 48, paddingHorizontal: 8 }]}
                  onPress={() => setCountryModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectBoxText}>{countryCode}</Text>
                  <ChevronDown size={16} color={THEME.colors.textMuted} />
                </TouchableOpacity>
                
                <View style={{ flex: 0.83 }}>
                  <Input
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    // leftIcon={<Phone size={18} color={THEME.colors.textMuted} />}
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
              </View>
            </View>

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

      {/* Country Code Modal */}
      <Modal
        visible={countryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCountryModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Country Code</Text>
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={true}>
              {COUNTRY_CODES.map((opt) => {
                const isSelected = opt.value === countryCode;
                return (
                  <TouchableOpacity
                    key={opt.label}
                    style={[
                      styles.modalOption,
                      isSelected && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setCountryCode(opt.value);
                      setCountryModalVisible(false);
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
            </ScrollView>
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
