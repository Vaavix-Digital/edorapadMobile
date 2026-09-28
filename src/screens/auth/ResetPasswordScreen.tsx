import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import {
  ArrowLeft,
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react-native';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { THEME } from '../../shared/constants/theme';
import { authApi } from '../../shared/api/authApi';

const RESEND_COOLDOWN = 60;
const PRIMARY = THEME.colors.primary;

// ─── Step indicator component ──────────────────────────────────────────────────

interface StepDotProps {
  num: number;
  label: string;
  active: boolean;
  done: boolean;
}

const StepDot: React.FC<StepDotProps> = ({ num, label, active, done }) => (
  <View style={stepStyles.wrapper}>
    <View
      style={[
        stepStyles.dot,
        active && stepStyles.dotActive,
        done && stepStyles.dotDone,
      ]}
    >
      {done ? (
        <CheckCircle2 size={14} color="#FFF" strokeWidth={2.5} />
      ) : (
        <Text style={[stepStyles.dotNum, (active || done) && stepStyles.dotNumActive]}>
          {num}
        </Text>
      )}
    </View>
    <Text style={[stepStyles.label, (active || done) && stepStyles.labelActive]}>
      {label}
    </Text>
  </View>
);

const stepStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 4 },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  dotDone: { backgroundColor: PRIMARY },
  dotNum: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  dotNumActive: { color: '#FFF' },
  label: { fontSize: 10, fontWeight: '600', color: '#94A3B8' },
  labelActive: { color: PRIMARY },
});

// ─── OTP digit boxes ───────────────────────────────────────────────────────────

interface OtpBoxesProps {
  value: string;
  onChange: (val: string) => void;
}

const OtpBoxes: React.FC<OtpBoxesProps> = ({ value, onChange }) => {
  const refs = useRef<(TextInput | null)[]>([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleChange = (text: string, idx: number) => {
    const char = text.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, i) => (i === idx ? char : d));
    onChange(next.join(''));
    if (char && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const next = digits.map((d, i) => (i === idx ? '' : d));
      onChange(next.join(''));
      if (idx > 0) refs.current[idx - 1]?.focus();
    }
  };

  return (
    <View style={otpStyles.row}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <TextInput
          key={idx}
          ref={(el) => { refs.current[idx] = el; }}
          style={[otpStyles.box, digits[idx] ? otpStyles.boxFilled : undefined]}
          value={digits[idx] || ''}
          onChangeText={(t) => handleChange(t, idx)}
          onKeyPress={(e) => handleKeyPress(e, idx)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          caretHidden
          accessible
          accessibilityLabel={`OTP digit ${idx + 1}`}
        />
      ))}
    </View>
  );
};

const otpStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  box: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  boxFilled: {
    borderColor: PRIMARY,
    backgroundColor: '#EBF4F3',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
});

// ─── Password strength bar ──────────────────────────────────────────────────

const StrengthBar: React.FC<{ password: string }> = ({ password }) => {
  const len = password.length;
  const strength = len === 0 ? 0 : len < 6 ? 1 : len < 10 ? 2 : 3;
  const colors = ['#E2E8F0', '#EF4444', '#F59E0B', '#10B981'];
  const labels = ['', 'Too short', 'Fair', 'Strong'];
  const widths = ['0%', '33%', '66%', '100%'];

  if (len === 0) return null;

  return (
    <View style={{ marginTop: 6 }}>
      <View style={barStyles.track}>
        <View
          style={[
            barStyles.fill,
            { width: widths[strength] as any, backgroundColor: colors[strength] },
          ]}
        />
      </View>
      <Text style={[barStyles.label, { color: colors[strength] }]}>{labels[strength]}</Text>
    </View>
  );
};

const barStyles = StyleSheet.create({
  track: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  label: { fontSize: 11, fontWeight: '700', marginTop: 3 },
});

// ─── Inline input field ────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  isPassword?: boolean;
  icon: React.ReactNode;
  error?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label, value, onChangeText, placeholder, keyboardType, isPassword, icon, error,
}) => {
  const [secure, setSecure] = useState(isPassword ?? false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View
        style={[
          fieldStyles.row,
          focused && fieldStyles.rowFocused,
          error && fieldStyles.rowError,
        ]}
      >
        <View style={fieldStyles.iconWrap}>{icon}</View>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          keyboardType={keyboardType || 'default'}
          secureTextEntry={secure}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setSecure(!secure)} style={fieldStyles.eyeBtn}>
            {secure ? (
              <EyeOff size={18} color="#94A3B8" />
            ) : (
              <Eye size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  rowFocused: {
    borderColor: PRIMARY,
    backgroundColor: '#FFF',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 2,
  },
  rowError: { borderColor: '#EF4444' },
  iconWrap: { paddingLeft: 13, paddingRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#0F172A' },
  eyeBtn: { paddingHorizontal: 13 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

export const ResetPasswordScreen = ({ navigation }: any) => {
  const [step, setStep] = useState<Step>(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);

  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const notify = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
  };

  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const animateToStep = (nextStep: Step) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      notify('');
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  // ── Step 1: Request OTP ─────────────────────────────────────────────────────
  const handleRequestOtp = async () => {
    if (!identifier.trim()) return notify('Please enter your email or user ID.', true);
    setLoading(true);
    notify('');
    try {
      const res = await authApi.forgotPassword(identifier.trim());
      notify(res.message || 'OTP sent! Check your email.');
      startCooldown();
      animateToStep(2);
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Failed to send OTP. Please check your identifier.', true);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setOtp('');
    setLoading(true);
    notify('');
    try {
      const res = await authApi.forgotPassword(identifier.trim());
      notify(res.message || 'OTP resent successfully!');
      startCooldown();
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Failed to resend OTP.', true);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 → 3: Verify OTP length then advance ─────────────────────────────
  const handleVerifyOtp = () => {
    if (otp.replace(/\D/g, '').length < 6) return notify('Please enter all 6 digits.', true);
    animateToStep(3);
  };

  // ── Step 3: Reset Password ──────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (newPassword.length < 6) return notify('Password must be at least 6 characters.', true);
    if (newPassword !== confirmPassword) return notify('Passwords do not match.', true);
    setLoading(true);
    notify('');
    try {
      const res = await authApi.resetPassword({
        identifier: identifier.trim(),
        otp: otp.trim(),
        newPassword,
      });
      notify(res.message || 'Password reset successfully!');
      setSuccess(true);
      setTimeout(() => navigation.navigate('Login'), 2500);
    } catch (err: any) {
      notify(err?.response?.data?.message || 'Incorrect OTP or request expired. Please try again.', true);
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ['Forgot Password', 'Verify OTP', 'New Password'];
  const stepSubtitles = [
    'Enter your registered email or user ID to receive a 6-digit reset code.',
    `A 6-digit OTP was sent to ${identifier || 'your email'}. Enter it below.`,
    'Set a strong new password for your account.',
  ];

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => (step > 1 && !success ? animateToStep((step - 1) as Step) : navigation.goBack())}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={THEME.colors.textSecondary} />
            <Text style={styles.backText}>
              {step > 1 && !success ? 'Back' : 'Back to Sign In'}
            </Text>
          </TouchableOpacity>

          {/* ── Step indicators ── */}
          <View style={styles.stepsRow}>
            <StepDot num={1} label="Email" active={step === 1} done={step > 1} />
            <View style={[styles.stepLine, step > 1 && styles.stepLineDone]} />
            <StepDot num={2} label="OTP" active={step === 2} done={step > 2} />
            <View style={[styles.stepLine, step > 2 && styles.stepLineDone]} />
            <StepDot num={3} label="Password" active={step === 3} done={success} />
          </View>

          {/* ── Card ── */}
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            {/* Title */}
            {success ? (
              <View style={styles.successContainer}>
                <View style={styles.successCircle}>
                  <CheckCircle2 size={36} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>All Done!</Text>
                <Text style={styles.successSub}>
                  Your password has been reset. Redirecting to sign in…
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.cardTitle}>{stepTitles[step - 1]}</Text>
                <Text style={styles.cardSubtitle}>{stepSubtitles[step - 1]}</Text>

                {/* ── Message banner ── */}
                {message ? (
                  <View style={[styles.msgBox, isError ? styles.msgBoxError : styles.msgBoxSuccess]}>
                    {isError ? (
                      <Text style={[styles.msgText, styles.msgTextError]}>{message}</Text>
                    ) : (
                      <View style={styles.msgRow}>
                        <ShieldCheck size={14} color="#065F46" style={{ marginRight: 6 }} />
                        <Text style={[styles.msgText, styles.msgTextSuccess]}>{message}</Text>
                      </View>
                    )}
                  </View>
                ) : null}

                {/* ── STEP 1: Email / ID ── */}
                {step === 1 && (
                  <>
                    <Field
                      label="Email Address / User ID"
                      value={identifier}
                      onChangeText={setIdentifier}
                      placeholder="e.g. teamvaavix@gmail.com"
                      icon={<Mail size={16} color="#94A3B8" />}
                    />
                    <TouchableOpacity
                      style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                      onPress={handleRequestOtp}
                      disabled={loading}
                      activeOpacity={0.82}
                      accessibilityRole="button"
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Send OTP</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* ── STEP 2: OTP boxes ── */}
                {step === 2 && (
                  <>
                    <View style={{ marginBottom: 20 }}>
                      <Text style={[fieldStyles.label, { textAlign: 'center', marginBottom: 14 }]}>
                        Enter 6-Digit OTP
                      </Text>
                      <OtpBoxes value={otp} onChange={setOtp} />
                    </View>

                    {/* Resend row */}
                    <View style={styles.resendRow}>
                      <Text style={styles.resendLabel}>Didn't receive it? </Text>
                      <TouchableOpacity
                        onPress={handleResend}
                        disabled={resendCooldown > 0 || loading}
                        accessibilityRole="button"
                      >
                        <Text
                          style={[
                            styles.resendLink,
                            resendCooldown > 0 && styles.resendLinkDisabled,
                          ]}
                        >
                          {resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : 'Resend OTP'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                      onPress={handleVerifyOtp}
                      disabled={loading}
                      activeOpacity={0.82}
                      accessibilityRole="button"
                    >
                      <Text style={styles.primaryBtnText}>Verify OTP</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* ── STEP 3: New Password ── */}
                {step === 3 && (
                  <>
                    <Field
                      label="New Password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Minimum 6 characters"
                      isPassword
                      icon={<Lock size={16} color="#94A3B8" />}
                    />
                    <StrengthBar password={newPassword} />

                    <View style={{ marginTop: 14 }}>
                      <Field
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Re-enter your password"
                        isPassword
                        icon={<Lock size={16} color="#94A3B8" />}
                        error={confirmPassword.length > 0 && confirmPassword !== newPassword}
                      />
                      {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                        <Text style={styles.mismatchText}>Passwords do not match</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.primaryBtn, loading && styles.primaryBtnDisabled, { marginTop: 6 }]}
                      onPress={handleResetPassword}
                      disabled={loading}
                      activeOpacity={0.82}
                      accessibilityRole="button"
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Reset Password</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}
          </Animated.View>

          {/* ── Footer link ── */}
          {!success && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.footerLink}
              accessibilityRole="button"
            >
              <Text style={styles.footerLinkText}>Remember your password? Sign In</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },

  // ── Step indicators ──
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
    borderRadius: 2,
  },
  stepLineDone: { backgroundColor: PRIMARY },

  // ── Card ──
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    marginBottom: 20,
  },

  // ── Message banner ──
  msgBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  msgBoxError: { backgroundColor: '#FEF2F2' },
  msgBoxSuccess: { backgroundColor: '#ECFDF5' },
  msgRow: { flexDirection: 'row', alignItems: 'center' },
  msgText: { fontSize: 13, fontWeight: '500', flex: 1 },
  msgTextError: { color: '#B91C1C' },
  msgTextSuccess: { color: '#065F46' },

  // ── Primary button ──
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Resend row ──
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  resendLabel: { fontSize: 13, color: '#64748B' },
  resendLink: { fontSize: 13, fontWeight: '700', color: PRIMARY },
  resendLinkDisabled: { color: '#94A3B8' },

  // ── Password mismatch ──
  mismatchText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: -8,
    marginBottom: 4,
  },

  // ── Success state ──
  successContainer: { alignItems: 'center', paddingVertical: 16 },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Footer ──
  footerLink: { alignItems: 'center', marginTop: 22 },
  footerLinkText: { fontSize: 13, fontWeight: '600', color: PRIMARY },
});
