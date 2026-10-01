/**
 * GoogleSignInButton — PKCE Authorization Code Flow
 * Zero native-module dependencies. Works in Expo Go.
 *
 * Flow:
 *  1. Generate PKCE code_verifier + code_challenge (SHA-256 via SubtleCrypto)
 *  2. Linking.openURL → system browser opens Google consent
 *  3. Google redirects to edorapad://oauth?code=xxx
 *  4. Linking listener captures auth code
 *  5. Exchanges code → id_token via Google token endpoint (no client_secret needed
 *     for native/Android clients)
 *  6. Sends id_token to backend POST /api/auth/google (existing endpoint)
 *
 * Google Cloud Console setup needed:
 *  - Add  edorapad://oauth  to the ANDROID client's authorized redirect URIs
 *    (Edit the Android OAuth Client → add Custom URI Scheme: edorapad://oauth)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Linking,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAppDispatch } from '../../store';
import { googleLogin } from '../../store/slices/authSlice';
import { THEME } from '../../shared/constants/theme';

// ─── Config ────────────────────────────────────────────────────────────────
const ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  '82156580571-vfpd2k5ji28ccrdbo5mg3vq3mtcp76sm.apps.googleusercontent.com';
const WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  '82156580571-hlhlp7d50i0tbnc7ci99hulprk2jio31.apps.googleusercontent.com';
const IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  '82156580571-v9clpj5gibavqtoludtse3v51hhguvpk.apps.googleusercontent.com';
const REDIRECT_URI = 'edorapad://oauth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

// ─── Pure-JS PKCE helpers (no native modules) ──────────────────────────────

/** Generate a random code_verifier string (43-128 chars, URL-safe). */
const generateVerifier = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let v = '';
  for (let i = 0; i < 96; i++) v += chars[Math.floor(Math.random() * chars.length)];
  return v;
};

/** Base64url-encode a Uint8Array. */
const base64url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

/**
 * Compute code_challenge = BASE64URL(SHA-256(verifier)).
 * Uses SubtleCrypto (available in RN 0.73+ / Hermes).
 * Falls back to plain verifier (S256 → plain) if SubtleCrypto is missing.
 */
const buildChallenge = async (
  verifier: string
): Promise<{ challenge: string; method: string }> => {
  try {
    const enc = new TextEncoder();
    const hash = await (globalThis as any).crypto.subtle.digest(
      'SHA-256',
      enc.encode(verifier)
    );
    return { challenge: base64url(new Uint8Array(hash)), method: 'S256' };
  } catch {
    // Hermes/Expo Go without SubtleCrypto — use plain method (less secure but functional)
    return { challenge: verifier, method: 'plain' };
  }
};

/** Parse key=value pairs from a URL query string or fragment. */
const parseParams = (url: string): Record<string, string> => {
  const part = url.includes('?') ? url.split('?')[1] : url.split('#')[1] ?? '';
  const result: Record<string, string> = {};
  (part ?? '').split('&').forEach((p) => {
    const i = p.indexOf('=');
    if (i === -1) return;
    result[decodeURIComponent(p.slice(0, i))] = decodeURIComponent(p.slice(i + 1));
  });
  return result;
};

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

  const verifierRef = useRef('');

  // ── Deep-link listener (captures ?code= redirect from Google) ──────────
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      if (!url.startsWith('edorapad://oauth')) return;
      const params = parseParams(url);

      if (params.error) {
        setError(`Google sign-in cancelled or failed (${params.error}).`);
        setBusy(false);
        return;
      }

      if (params.code) {
        exchangeCode(params.code, verifierRef.current);
      }
    };

    // Handle cold-start (app re-opened via deep link)
    Linking.getInitialURL().then((url) => { if (url) handleUrl({ url }); });

    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  // ── Exchange auth code → id_token via Google token endpoint ────────────
  const exchangeCode = async (code: string, verifier: string) => {
    setBusy(true);
    setError('');
    try {
      // Android client IDs allow PKCE token exchange without a client_secret
      const body: Record<string, string> = {
        grant_type:    'authorization_code',
        code,
        client_id:     ANDROID_CLIENT_ID || WEB_CLIENT_ID,
        redirect_uri:  REDIRECT_URI,
        code_verifier: verifier,
      };

      const res  = await fetch(TOKEN_ENDPOINT, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    Object.entries(body)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&'),
      });

      const data = await res.json();

      if (!res.ok || !data.id_token) {
        throw new Error(data.error_description || 'Token exchange failed');
      }

      await sendToBackend(data.id_token);
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please try again.');
      setBusy(false);
    }
  };

  // ── Send id_token to our backend ────────────────────────────────────────
  const sendToBackend = async (idToken: string, role?: string) => {
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

  // ── Tap → open browser ─────────────────────────────────────────────────
  const handlePress = async () => {
    if (!ANDROID_CLIENT_ID && !WEB_CLIENT_ID) {
      setError('Google client ID not configured. Check your .env file.');
      return;
    }
    setError('');
    setBusy(true);

    const verifier = generateVerifier();
    verifierRef.current = verifier;

    const { challenge, method } = await buildChallenge(verifier);

    const params: Record<string, string> = {
      client_id:             ANDROID_CLIENT_ID || WEB_CLIENT_ID,
      redirect_uri:          REDIRECT_URI,
      response_type:         'code',
      scope:                 'openid profile email',
      code_challenge:        challenge,
      code_challenge_method: method,
      access_type:           'offline',
    };

    const qs  = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    const url = `https://accounts.google.com/o/oauth2/v2/auth?${qs}`;

    try {
      await Linking.openURL(url);
    } catch {
      setError('Could not open Google sign-in. Please try again.');
      setBusy(false);
    }
  };

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Path
      d="M117.6,61.36 C117.6,57.11 117.22,53.02 116.51,49.09 L60,49.09 L60,72.3 L92.29,72.3 C90.9,79.8 86.67,86.15 80.32,90.41 L80.32,105.46 L99.71,105.46 C111.05,95.02 117.6,79.64 117.6,61.36 Z"
      fill="#4285F4"
    />
    <Path
      d="M60,120 C76.2,120 89.78,114.63 99.71,105.46 L80.32,90.41 C74.95,94.01 68.07,96.14 60,96.14 C44.37,96.14 31.15,85.58 26.43,71.4 L6.38,71.4 L6.38,86.95 C16.25,106.55 36.55,120 60,120 Z"
      fill="#34A853"
    />
    <Path
      d="M26.43,71.4 C25.23,67.8 24.55,63.95 24.55,60 C24.55,56.05 25.23,52.2 26.43,48.6 L26.43,33.05 L6.38,33.05 C2.32,41.15 0,50.32 0,60 C0,69.68 2.32,78.85 6.38,86.95 L26.43,71.4 Z"
      fill="#FBBC05"
    />
    <Path
      d="M60,23.86 C68.81,23.86 76.72,26.89 82.94,32.84 L100.15,15.63 C89.75,5.95 76.17,0 60,0 C36.55,0 16.25,13.45 6.38,33.05 L26.43,48.6 C31.15,34.42 44.37,23.86 60,23.86 Z"
      fill="#EA4335"
    />
  </Svg>
);

  // ── Render ─────────────────────────────────────────────────────────────
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
          <GoogleIcon size={20} />
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
  disabled:          { opacity: 0.5 },
  googleButtonText:  { fontSize: 15, fontWeight: '600', color: THEME.colors.textPrimary },
  errorText:         { marginTop: 8, textAlign: 'center', fontSize: 13, color: THEME.colors.error },
  overlay:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:              { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  cardTitle:         { fontSize: 18, fontWeight: '700', color: THEME.colors.textPrimary, marginBottom: 4 },
  cardSub:           { fontSize: 13, color: THEME.colors.textSecondary, marginBottom: 20 },
  roleRow:           { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1.5, borderColor: THEME.colors.border, borderRadius: THEME.borderRadius.md, padding: 12, marginBottom: 10 },
  roleRowSelected:   { borderColor: THEME.colors.primary, backgroundColor: '#f0faf9' },
  radioOuter:        { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: THEME.colors.primary, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  radioInner:        { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.colors.primary },
  roleLabel:         { fontSize: 14, fontWeight: '600', color: THEME.colors.textPrimary },
  roleHint:          { fontSize: 12, color: THEME.colors.textSecondary, marginTop: 2 },
  actions:           { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn:               { flex: 1, paddingVertical: 13, borderRadius: THEME.borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  btnCancel:         { borderWidth: 1.5, borderColor: THEME.colors.border },
  btnCancelText:     { fontWeight: '600', color: THEME.colors.textPrimary },
  btnConfirm:        { backgroundColor: THEME.colors.primary },
  btnConfirmText:    { fontWeight: '600', color: '#fff' },
});

export default GoogleSignInButton;
