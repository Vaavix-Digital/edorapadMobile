import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ScanFace,
  LogOut,
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../store';
import { setUserFaceState, logoutUser } from '../../store/slices/authSlice';
import { authApi } from '../../shared/api/authApi';
import { THEME } from '../../shared/constants/theme';

const { width: W, height: H } = Dimensions.get('window');
const PRIMARY = '#3E7B74';
const FRAME_SIZE = Math.min(W * 0.58, 240);

type Status = 'idle' | 'loading' | 'success' | 'error';

// ─── Corner frame accent ───────────────────────────────────────────────────────
const CornerAccent = ({ style }: { style: any }) => (
  <View style={[frameStyles.corner, style]} />
);

const frameStyles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: PRIMARY,
    borderWidth: 2.5,
  },
});

// ─── Pulsing scan line ─────────────────────────────────────────────────────────
const ScanLine = ({ scanning }: { scanning: boolean }) => {
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (!scanning) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanning, anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, FRAME_SIZE - 4] });

  if (!scanning) return null;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: PRIMARY,
        opacity: 0.7,
        transform: [{ translateY }],
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 4,
      }}
    />
  );
};

// ─── Main screen ───────────────────────────────────────────────────────────────

export const FaceVerificationScreen = ({ onVerified }: { onVerified: () => void }) => {
  const dispatch = useAppDispatch();
  const { user, token, role } = useAppSelector((state) => state.auth);
  const isEnrolled = !!user?.isFaceEnrolled;

  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(3);
  const cameraRef = useRef<CameraView>(null);
  const successAnim = useRef(new Animated.Value(0)).current;

  const startCountdown = useCallback(() => {
    let count = 3;
    const t = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(t);
        onVerified();
      }
    }, 1000);
  }, [onVerified]);

  const showSuccess = useCallback(() => {
    setStatus('success');
    Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }).start();
    startCountdown();
  }, [successAnim, startCountdown]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || status === 'loading') return;
    setStatus('loading');
    setErrorMsg('');

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
        skipProcessing: true,
      });

      if (!photo?.base64) throw new Error('Failed to capture image.');
      const base64Image = `data:image/jpeg;base64,${photo.base64}`;

      if (!isEnrolled) {
        // ── First time: enrol face ──────────────────────────────────────────
        const res = await authApi.faceInit({ uri: photo.uri, base64: base64Image });
        if (res.success) {
          dispatch(setUserFaceState({ isFaceEnrolled: true }));
          showSuccess();
        } else {
          setErrorMsg(res.message || 'Face enrolment failed. Ensure your face is clearly visible.');
          setStatus('error');
        }
      } else {
        // ── Subsequent: verify face ─────────────────────────────────────────
        const res = await authApi.faceVerify(base64Image);
        if (res.success) {
          showSuccess();
        } else {
          setErrorMsg(res.message || 'Biometric mismatch. Please try again.');
          setStatus('error');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Verification failed. Please retry.');
      setStatus('error');
    }
  }, [cameraRef, status, isEnrolled, dispatch, showSuccess]);

  const handleRetry = () => { setStatus('idle'); setErrorMsg(''); };

  const handleLogout = () => dispatch(logoutUser());

  // ── Permission not yet decided ──────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.permCont}>
        <ActivityIndicator color={PRIMARY} size="large" />
        <Text style={styles.permText}>Checking camera permission…</Text>
      </View>
    );
  }

  // ── Permission denied ───────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={styles.permCont}>
        <View style={styles.permIconBox}>
          <Camera size={36} color={PRIMARY} />
        </View>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSub}>
          Face authentication requires camera access to verify your identity securely.
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.82}>
          <Text style={styles.permBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={14} color="#94A3B8" style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Success view ────────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <View style={styles.successScreen}>
        <Animated.View
          style={[
            styles.successCard,
            { transform: [{ scale: successAnim }], opacity: successAnim },
          ]}
        >
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={52} color={PRIMARY} strokeWidth={1.8} />
          </View>
          <Text style={styles.successTitle}>Verified!</Text>
          <Text style={styles.successSub}>
            Face authentication successful. Entering your dashboard in{' '}
            <Text style={{ color: PRIMARY, fontWeight: '800' }}>{countdown}</Text>…
          </Text>
        </Animated.View>
      </View>
    );
  }

  // ── Camera view ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* Full-screen camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
      />

      {/* Dark vignette overlay */}
      <View style={styles.overlay} pointerEvents="none" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <ShieldCheck size={14} color={PRIMARY} style={{ marginRight: 5 }} />
          <Text style={styles.headerBadgeText}>Secure Face Authentication</Text>
        </View>
        <Text style={styles.headerTitle}>
          {isEnrolled ? 'Verify Your Identity' : 'Set Up Face ID'}
        </Text>
        <Text style={styles.headerSub}>
          {isEnrolled
            ? 'Look directly at the camera to unlock your dashboard.'
            : 'Align your face in the frame to register your biometrics securely.'}
        </Text>
      </View>

      {/* Face frame */}
      <View style={styles.frameWrapper}>
        <View style={[styles.frame, { width: FRAME_SIZE, height: FRAME_SIZE * 1.22 }]}>
          {/* Corners */}
          <CornerAccent style={{ top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 10 }} />
          <CornerAccent style={{ top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 10 }} />
          <CornerAccent style={{ bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 10 }} />
          <CornerAccent style={{ bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 10 }} />
          {/* Scan line */}
          <ScanLine scanning={status === 'idle'} />
        </View>

        {/* Face icon hint */}
        {status === 'idle' && (
          <View style={styles.faceHint}>
            <ScanFace size={18} color="rgba(255,255,255,0.6)" style={{ marginRight: 6 }} />
            <Text style={styles.faceHintText}>Position your face within the frame</Text>
          </View>
        )}
      </View>

      {/* Error banner */}
      {status === 'error' && (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color="#FCA5A5" style={{ marginRight: 8 }} />
          <Text style={styles.errorBannerText} numberOfLines={2}>{errorMsg}</Text>
        </View>
      )}

      {/* Loading overlay label */}
      {status === 'loading' && (
        <View style={styles.loadingBanner}>
          <ActivityIndicator color={PRIMARY} size="small" style={{ marginRight: 10 }} />
          <Text style={styles.loadingText}>Analysing biometrics…</Text>
        </View>
      )}

      {/* Bottom actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.captureBtn, status === 'loading' && styles.captureBtnDisabled]}
          onPress={status === 'error' ? handleRetry : handleCapture}
          disabled={status === 'loading'}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={isEnrolled ? 'Scan face and login' : 'Enrol face ID'}
        >
          {status === 'loading' ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Camera size={20} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.captureBtnText}>
                {status === 'error'
                  ? 'Try Again'
                  : isEnrolled
                    ? 'Scan Face & Login'
                    : 'Enrol Face ID'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut size={14} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
          <Text style={[styles.logoutText, { color: 'rgba(255,255,255,0.5)' }]}>
            Sign Out Instead
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Permission screen ───────────────────────────────────────────────────────
  permCont: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  permIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(62,123,116,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(62,123,116,0.3)',
  },
  permTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  permSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  permBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 16,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  permBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  permText: { marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)' },

  // ── Success screen ──────────────────────────────────────────────────────────
  successScreen: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  successIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Camera screen ───────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(62,123,116,0.18)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(62,123,116,0.35)',
    marginBottom: 14,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Face frame ──────────────────────────────────────────────────────────────
  frameWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  faceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  faceHintText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },

  // ── Error banner ────────────────────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#FCA5A5',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },

  // ── Loading banner ──────────────────────────────────────────────────────────
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: 'rgba(62,123,116,0.15)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(62,123,116,0.3)',
  },
  loadingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 14,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  captureBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  captureBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
