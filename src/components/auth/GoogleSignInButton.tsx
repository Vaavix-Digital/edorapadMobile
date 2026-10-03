/**
 * GoogleSignInButton — Native Google Sign-In
 *
 * Uses @react-native-google-signin/google-signin (native library).
 * Requires an EAS / dev build — does NOT work in Expo Go.
 *
 * Flow:
 *  1. GoogleSignin.configure({ webClientId }) — once on mount
 *  2. Tap → GoogleSignin.signIn() → native Google sheet opens
 *  3. Returns idToken → POST /api/auth/google (existing backend endpoint)
 *  4a. Existing user → onLoggedIn() called
 *  4b. New user → role-picker modal → retry with chosen role
 *
 * Google Cloud Console requirements:
 *  - Web OAuth Client  → used as webClientId
 *  - Android OAuth Client → package: com.edorapad.app + SHA-1 of your keystore
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import {
  GoogleSignin,
  statusCodes,
  isErrorWithCode,
} from '@react-native-google-signin/google-signin';
import { useAppDispatch } from '../../store';
import { googleLogin } from '../../store/slices/authSlice';
import { THEME } from '../../shared/constants/theme';

// ─── Config ────────────────────────────────────────────────────────────────

const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '82156580571-hlhlp7d50i0tbnc7ci99hulprk2jio31.apps.googleusercontent.com';

const IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  '82156580571-v9clpj5gibavqtoludtse3v51hhguvpk.apps.googleusercontent.com';

// ─── Role options ───────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'Student',        label: 'Student',        hint: 'Join courses and classes' },
  { value: 'Course Creator', label: 'Course Creator', hint: 'Create and sell your own courses' },
  { value: 'Institute',      label: 'Institute',      hint: 'Run your institute, staff and students' },
];

// ─── Component ─────────────────────────────────────────────────────────────

interface Props {
  onLoggedIn: (user: any) => void;
}

const GoogleSignInButton: React.FC<Props> = ({ onLoggedIn }) => {
  const dispatch = useAppDispatch();

  const [busy,         setBusy]         = useState(false);
  const [error,        setError]        = useState('');
  const [pending,      setPending]      = useState<{
    idToken: string; email?: string; name?: string;
  } | null>(null);
  const [selectedRole, setSelectedRole] = useState(ROLE_OPTIONS[0].value);

  // Configure Google Sign-In once on mount
  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        iosClientId: IOS_CLIENT_ID,
      });
    } catch (e) {
      console.warn('[GoogleSignIn] Configure error:', e);
    }
  }, []);

  // ── Tap handler ─────────────────────────────────────────────────────────
  const handlePress = async () => {
    setError('');
    setBusy(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken  = (response as any)?.data?.idToken ?? (response as any)?.idToken;

      if (!idToken) {
        setError('Google sign-in did not return an idToken. Please try again.');
        return;
      }

      await sendToBackend(idToken);
    } catch (err: any) {
      console.error('[GoogleSignIn] Error:', err);
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          // User cancelled — no error message needed
        } else if (err.code === statusCodes.IN_PROGRESS) {
          setError('Sign-in already in progress. Please wait.');
        } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setError('Google Play Services not available. Please update and try again.');
        } else if (err.code === '10' || err.code === statusCodes.SIGN_IN_REQUIRED) {
          setError(`Developer Error (${err.code}): Check SHA-1 / Package name in Firebase Console.`);
        } else {
          setError(`Google sign-in failed (${err.code || 'unknown'}): ${err.message || 'Please try again'}`);
        }
      } else {
        setError(`Google sign-in failed: ${err?.message || 'Please try again.'}`);
      }
    } finally {
      setBusy(false);
    }
  };

  // ── Send idToken to backend ──────────────────────────────────────────────
  const sendToBackend = async (idToken: string, role?: string) => {
    setBusy(true);
    setError('');
    try {
      const result = await dispatch(googleLogin({ credential: idToken, role })).unwrap();
      setPending(null);
      onLoggedIn(result);
    } catch (err: any) {
      if (err?.code === 'GOOGLE_ROLE_REQUIRED') {
        setPending({ idToken, email: err.data?.email, name: err.data?.name });
      } else {
        setError(err?.message || 'Google sign-in failed. Please try again.');
        setPending(null);
      }
    } finally {
      setBusy(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <>
      <TouchableOpacity
        style={[styles.googleButton, busy && styles.disabled]}
        onPress={handlePress}
        disabled={busy}
        activeOpacity={0.8}
      >
        {busy ? (
          <ActivityIndicator size="small" color={THEME.colors.textSecondary} />
        ) : (
          <Image
            source={require('./google-logo.png')}
            style={styles.googleLogo}
            resizeMode="contain"
          />
        )}
        <Text style={styles.googleButtonText}>
          {busy ? 'Signing in…' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Role-picker modal for first-time Google users */}
      <Modal
        visible={!!pending}
        transparent
        animationType="fade"
        onRequestClose={() => !busy && setPending(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Finish creating your account</Text>
            <Text style={styles.cardSub}>
              {pending?.email ? `Signing up as ${pending.email}. ` : ''}
              How will you use Edorapad?
            </Text>

            {ROLE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.roleRow, selectedRole === opt.value && styles.roleRowSelected]}
                onPress={() => setSelectedRole(opt.value)}
              >
                <View style={styles.radioOuter}>
                  {selectedRole === opt.value && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roleLabel}>{opt.label}</Text>
                  <Text style={styles.roleHint}>{opt.hint}</Text>
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={() => setPending(null)}
                disabled={busy}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnConfirm, busy && styles.disabled]}
                onPress={() => pending && sendToBackend(pending.idToken, selectedRole)}
                disabled={busy}
              >
                {busy
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.btnConfirmText}>Continue</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginTop: THEME.spacing.sm,
  },
  disabled:         { opacity: 0.5 },
  googleLogo:       { width: 20, height: 20 },
  googleButtonText: { fontSize: 15, fontWeight: '600', color: THEME.colors.textPrimary },
  errorText:        { marginTop: 8, textAlign: 'center', fontSize: 13, color: THEME.colors.error },
  overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:             { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  cardTitle:        { fontSize: 18, fontWeight: '700', color: THEME.colors.textPrimary, marginBottom: 4 },
  cardSub:          { fontSize: 13, color: THEME.colors.textSecondary, marginBottom: 20 },
  roleRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1.5, borderColor: THEME.colors.border, borderRadius: THEME.borderRadius.md, padding: 12, marginBottom: 10 },
  roleRowSelected:  { borderColor: THEME.colors.primary, backgroundColor: '#f0faf9' },
  radioOuter:       { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: THEME.colors.primary, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  radioInner:       { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.primary },
  roleLabel:        { fontSize: 14, fontWeight: '600', color: THEME.colors.textPrimary },
  roleHint:         { fontSize: 12, color: THEME.colors.textSecondary, marginTop: 2 },
  actions:          { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn:              { flex: 1, paddingVertical: 13, borderRadius: THEME.borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  btnCancel:        { borderWidth: 1.5, borderColor: THEME.colors.border },
  btnCancelText:    { fontWeight: '600', color: THEME.colors.textPrimary },
  btnConfirm:       { backgroundColor: THEME.colors.primary },
  btnConfirmText:   { fontWeight: '600', color: '#fff' },
});

export default GoogleSignInButton;
