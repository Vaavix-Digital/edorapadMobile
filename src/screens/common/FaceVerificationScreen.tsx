import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  ArrowLeft,
  ArrowRight,
  Smile,
  RefreshCw,
} from 'lucide-react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useAppDispatch, useAppSelector } from '../../store';
import { setUserFaceState, logoutUser } from '../../store/slices/authSlice';
import { authApi } from '../../shared/api/authApi';

const { width: W } = Dimensions.get('window');
const PRIMARY = '#3E7B74';
const FRAME_SIZE = Math.min(W * 0.72, 280);

// ─── Phase state machine ──────────────────────────────────────────────────────
// idle       → user sees 'Start' button
// challenging → fetching challengeId from /face-challenge
// awaiting   → instruction shown, user must press button to start countdown
// counting   → 3-2-1 countdown in progress
// capturing  → camera.takePictureAsync() running
// analyzing  → frames submitted to /face-init or /face-verify
// success    → all good, auto-navigate after 3 s
// error      → something went wrong, show retry
type ScreenPhase =
  | 'idle'
  | 'challenging'
  | 'awaiting'
  | 'counting'
  | 'capturing'
  | 'analyzing'
  | 'success'
  | 'error';

type LivenessStep = 'CENTER' | 'TURN_LEFT' | 'TURN_RIGHT';

const STEP_LABEL: Record<LivenessStep, string> = {
  CENTER: 'Look straight at the camera',
  TURN_LEFT: 'Slowly turn your head to your LEFT',
  TURN_RIGHT: 'Slowly turn your head to your RIGHT',
};

// ─── Corner frame accent ───────────────────────────────────────────────────────
const CornerAccent = ({ style }: { style: any }) => (
  <View style={[frameStyles.corner, style]} />
);

const frameStyles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: PRIMARY,
    borderWidth: 3,
  },
});

export const FaceVerificationScreen = ({
  onVerified,
}: {
  onVerified: () => void;
}) => {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const isEnrolled = !!user?.isFaceEnrolled;

  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScreenPhase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const [pictureSize, setPictureSize] = useState<string | undefined>(undefined);

  // Challenge / step state
  const [steps, setSteps] = useState<LivenessStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepCountdown, setStepCountdown] = useState(3);

  // Success screen countdown
  const [successCountdown, setSuccessCountdown] = useState(3);

  // Refs — kept in sync to avoid stale closure bugs in async callbacks
  const cameraRef = useRef<CameraView>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const challengeIdRef = useRef('');
  const stepsRef = useRef<LivenessStep[]>([]);
  const currentStepIndexRef = useRef(0);
  const collectedFramesRef = useRef<string[]>([]);

  const successAnim = useRef(new Animated.Value(0)).current;

  // Set camera picture size on ready to keep frames ~640px wide without extra native libraries
  const handleCameraReady = useCallback(async () => {
    try {
      if (cameraRef.current && (cameraRef.current as any).getAvailablePictureSizesAsync) {
        const sizes: string[] = await (cameraRef.current as any).getAvailablePictureSizesAsync();
        console.log('[FaceVerificationScreen] Available picture sizes:', sizes);
        if (sizes && sizes.length > 0) {
          const preferred =
            sizes.find((s) => s.startsWith('640x') || s.endsWith('x640')) ||
            sizes.find((s) => s.startsWith('720x') || s.endsWith('x720') || s.startsWith('800x') || s.endsWith('x800')) ||
            sizes.find((s) => s.startsWith('1280x') || s.endsWith('x720')) ||
            sizes[sizes.length - 1];
          if (preferred) {
            console.log('[FaceVerificationScreen] Selected pictureSize:', preferred);
            setPictureSize(preferred);
          }
        }
      }
    } catch (err) {
      console.warn('[FaceVerificationScreen] getAvailablePictureSizesAsync error:', err);
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (successTimerRef.current) clearInterval(successTimerRef.current);
    };
  }, []);

  // ── Success animation + auto-navigate ─────────────────────────────────────
  const triggerSuccess = useCallback(() => {
    setPhase('success');
    setSuccessCountdown(3);
    Animated.spring(successAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 7,
    }).start();

    let count = 3;
    successTimerRef.current = setInterval(() => {
      count -= 1;
      setSuccessCountdown(count);
      if (count <= 0) {
        if (successTimerRef.current) clearInterval(successTimerRef.current);
        onVerified();
      }
    }, 1000);
  }, [successAnim, onVerified]);

  // ── Submit frames to /face-init or /face-verify ────────────────────────────
  const submitVerification = useCallback(
    async (finalChallengeId: string, frames: string[]) => {
      setPhase('analyzing');
      setErrorMsg('');

      try {
        const payload = { challengeId: finalChallengeId, frames };
        const extra = {
          userId: user?.id || (user as any)?._id,
          token: token || undefined,
        };

        // ── Diagnostic: confirm payload size before sending ──────────────────
        console.log(
          '[FaceVerificationScreen] payload size:',
          JSON.stringify(payload).length,
          'characters'
        );
        console.log(
          '[FaceVerificationScreen] frame sizes:',
          frames.map((f) => f.length)
        );
        // ────────────────────────────────────────────────────────────────────

        console.log('[FaceVerificationScreen] isEnrolled:', isEnrolled, '-> calling:', isEnrolled ? 'faceVerify' : 'faceInit');

        if (!isEnrolled) {
          // First-time → enrol face
          const res = await authApi.faceInit(payload, extra);
          if (res.success) {
            setFailedAttempts(0);
            // Mark both enrolled AND verified so the navigation gate lifts
            dispatch(setUserFaceState({ isFaceEnrolled: true, isFaceVerified: true }));
            triggerSuccess();
          } else {
            setFailedAttempts((prev) => prev + 1);
            setErrorMsg(res.message || 'Face enrolment failed. Please try again.');
            setPhase('error');
          }
        } else {
          // Already enrolled → verify face
          const res = await authApi.faceVerify(payload, extra);
          if (res.success) {
            setFailedAttempts(0);
            dispatch(setUserFaceState({ isFaceVerified: true }));
            triggerSuccess();
          } else {
            setFailedAttempts((prev) => prev + 1);
            setErrorMsg(res.message || 'Biometric mismatch. Please try again.');
            setPhase('error');
          }
        }
      } catch (err: any) {
        console.error('[FaceVerificationScreen] submit error:', err);
        console.log('[FaceVerificationScreen] backend error response:', JSON.stringify(err?.response?.data, null, 2));
        setFailedAttempts((prev) => prev + 1);

        // Guide page 13: 403 FEATURE_NOT_IN_PLAN -> Skip face screen and open dashboard
        if (err?.response?.status === 403) {
          onVerified();
          return;
        }

        const serverMessage =
          err?.response?.data?.message || err?.response?.data?.error;
        const statusText = err?.response?.status
          ? ` (HTTP ${err.response.status})`
          : '';
        setErrorMsg(
          serverMessage ||
            (err?.message
              ? `${err.message}${statusText}`
              : 'Verification failed. Please retry.')
        );
        setPhase('error');
      }
    },
    [isEnrolled, user, token, dispatch, triggerSuccess, onVerified]
  );

  // ── Capture photo for current step, then advance or submit ────────────────
  const captureCurrentStep = useCallback(async () => {
    setPhase('capturing');
    try {
      if (!cameraRef.current) throw new Error('Camera not ready.');

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false, // EXIF rotation applied so image is upright
      });

      if (!photo?.uri) throw new Error('Camera did not return an image.');

      // Resize frame to 640px wide, JPEG 0.75 as strictly required by server guide (Pages 5-7, 13)
      // This produces crystal-clear ~60-80KB frames for 150-250KB total payload
      const manipulated = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 640 } }],
        {
          compress: 0.75,
          format: SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!manipulated.base64) throw new Error('Failed to process image frame.');

      const frame = `data:image/jpeg;base64,${manipulated.base64}`;

      const updatedFrames = [...collectedFramesRef.current, frame];
      collectedFramesRef.current = updatedFrames;

      const nextIdx = currentStepIndexRef.current + 1;

      if (nextIdx < stepsRef.current.length) {
        // More steps → advance, show next instruction, wait for user tap
        currentStepIndexRef.current = nextIdx;
        setCurrentStepIndex(nextIdx);
        setStepCountdown(3);
        setPhase('awaiting');
      } else {
        // All frames captured → send to server
        await submitVerification(challengeIdRef.current, updatedFrames);
      }
    } catch (err: any) {
      console.error('[FaceVerificationScreen] capture error:', err);
      setErrorMsg(err?.message || 'Failed to capture frame. Please retry.');
      setPhase('error');
    }
  }, [submitVerification]);

  // ── 3-2-1 countdown then capture ──────────────────────────────────────────
  const startStepCountdown = useCallback(() => {
    if (
      phase === 'counting' ||
      phase === 'capturing' ||
      phase === 'analyzing'
    )
      return;

    setPhase('counting');
    setStepCountdown(3);
    let count = 3;

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      setStepCountdown(count);
      if (count <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        captureCurrentStep();
      }
    }, 1000);
  }, [phase, captureCurrentStep]);

  // ── Fetch challenge → enter awaiting phase ────────────────────────────────
  const startLivenessChallenge = useCallback(async () => {
    if (
      phase === 'challenging' ||
      phase === 'counting' ||
      phase === 'capturing' ||
      phase === 'analyzing'
    )
      return;

    // Reset all state
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    collectedFramesRef.current = [];
    currentStepIndexRef.current = 0;
    challengeIdRef.current = '';
    stepsRef.current = [];

    setCurrentStepIndex(0);
    setStepCountdown(3);
    setErrorMsg('');
    setPhase('challenging');

    try {
      console.log('[FaceVerificationScreen] Requesting face challenge...');
      const challengeRes = await authApi.faceChallenge({
        token: token || undefined,
        userId: user?.id || (user as any)?._id,
      });

      console.log('[FaceVerificationScreen] Challenge response parsed:', challengeRes);

      const newChallengeId = challengeRes.challengeId;
      if (!newChallengeId) {
        console.error(
          '[FaceVerificationScreen] Missing challengeId. Full response:',
          challengeRes?.raw || challengeRes
        );
        throw new Error('Server did not return a valid challenge ID.');
      }

      const activeSteps: LivenessStep[] =
        challengeRes.steps && challengeRes.steps.length > 0
          ? (challengeRes.steps as LivenessStep[])
          : ['CENTER', 'TURN_LEFT', 'TURN_RIGHT'];

      challengeIdRef.current = newChallengeId;
      stepsRef.current = activeSteps;
      setSteps(activeSteps);

      // Show first instruction — user must press button to start countdown
      setPhase('awaiting');
    } catch (err: any) {
      console.error('[FaceVerificationScreen] challenge error:', err);
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;
      setErrorMsg(
        serverMessage || 'Could not initiate liveness check. Please retry.'
      );
      setPhase('error');
    }
  }, [phase, token, user]);

  // ── Retry — always fetch a brand new challenge ─────────────────────────────
  const handleRetry = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setPhase('idle');
    setErrorMsg('');
    setTimeout(() => startLivenessChallenge(), 0);
  }, [startLivenessChallenge]);

  const handleLogout = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    dispatch(logoutUser());
  }, [dispatch]);

  // ── Step icon helper ───────────────────────────────────────────────────────
  const getStepIcon = (stepKey: string) => {
    const key = (stepKey || '').toUpperCase();
    if (key.includes('LEFT'))
      return <ArrowLeft size={20} color="#FFF" style={{ marginRight: 8 }} />;
    if (key.includes('RIGHT'))
      return <ArrowRight size={20} color="#FFF" style={{ marginRight: 8 }} />;
    return <Smile size={20} color="#FFF" style={{ marginRight: 8 }} />;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ── Render: permission loading ─────────────────────────────────────────────
  if (!permission) {
    return (
      <View style={styles.permCont}>
        <ActivityIndicator color={PRIMARY} size="large" />
        <Text style={styles.permText}>Checking camera permission…</Text>
      </View>
    );
  }

  // ── Render: permission denied ──────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <View style={styles.permCont}>
        <View style={styles.permIconBox}>
          <Camera size={36} color={PRIMARY} />
        </View>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSub}>
          Face authentication requires camera access to verify your identity
          securely.
        </Text>
        <TouchableOpacity
          style={styles.permBtn}
          onPress={requestPermission}
          activeOpacity={0.82}
        >
          <Text style={styles.permBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={14} color="#94A3B8" style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render: success ────────────────────────────────────────────────────────
  if (phase === 'success') {
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
            <Text style={{ color: PRIMARY, fontWeight: '800' }}>
              {successCountdown}
            </Text>
            …
          </Text>
        </Animated.View>
      </View>
    );
  }

  // ── Render: main camera view ───────────────────────────────────────────────
  const currentStepKey: LivenessStep = steps[currentStepIndex] || 'CENTER';
  const stepLabel = STEP_LABEL[currentStepKey];
  const isActiveStep =
    phase === 'awaiting' || phase === 'counting' || phase === 'capturing';

  return (
    <View style={styles.screen}>
      {/*
       * Full-screen front camera.
       * NO transform: scaleX applied — the captured base64 is the raw unmirrored
       * sensor output, which is what the backend expects.
       */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        {...(pictureSize ? ({ pictureSize } as any) : {})}
        onCameraReady={handleCameraReady}
      />

      {/* Dark overlay */}
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
          Follow the on-screen head movements to unlock your dashboard.
        </Text>
      </View>

      {/* Face frame */}
      <View style={styles.frameWrapper}>
        <View
          style={[styles.frame, { width: FRAME_SIZE, height: FRAME_SIZE * 1.25 }]}
        >
          {/* Green corner accents */}
          <CornerAccent
            style={{
              top: -2,
              left: -2,
              borderRightWidth: 0,
              borderBottomWidth: 0,
              borderTopLeftRadius: 14,
            }}
          />
          <CornerAccent
            style={{
              top: -2,
              right: -2,
              borderLeftWidth: 0,
              borderBottomWidth: 0,
              borderTopRightRadius: 14,
            }}
          />
          <CornerAccent
            style={{
              bottom: -2,
              left: -2,
              borderRightWidth: 0,
              borderTopWidth: 0,
              borderBottomLeftRadius: 14,
            }}
          />
          <CornerAccent
            style={{
              bottom: -2,
              right: -2,
              borderLeftWidth: 0,
              borderTopWidth: 0,
              borderBottomRightRadius: 14,
            }}
          />

          {/* Step instruction card — shown while awaiting / counting / capturing */}
          {isActiveStep && steps.length > 0 && (
            <View style={styles.stepCardOverlay}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>
                  STEP {currentStepIndex + 1} OF {steps.length}
                </Text>
              </View>
              <View style={styles.stepPromptRow}>
                {getStepIcon(currentStepKey)}
                <Text style={styles.stepPromptText}>{stepLabel}</Text>
              </View>
              {/* 3-2-1 countdown number */}
              {phase === 'counting' && (
                <Text style={styles.countdownBig}>{stepCountdown}</Text>
              )}
              {/* Capture spinner */}
              {phase === 'capturing' && (
                <ActivityIndicator
                  color="#4ADE80"
                  size="small"
                  style={{ marginTop: 6 }}
                />
              )}
            </View>
          )}

          {/* Challenge-fetch / server-analysis overlay */}
          {(phase === 'challenging' || phase === 'analyzing') && (
            <View style={styles.loadingBoxInside}>
              <ActivityIndicator color={PRIMARY} size="large" />
              <Text style={styles.loadingBoxText}>
                {phase === 'challenging'
                  ? 'Preparing liveness challenge…'
                  : 'Analyzing biometrics…'}
              </Text>
            </View>
          )}
        </View>

        {/* Idle hint */}
        {phase === 'idle' && (
          <View style={styles.faceHint}>
            <ScanFace
              size={18}
              color="rgba(255,255,255,0.7)"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.faceHintText}>
              Position your face in the frame
            </Text>
          </View>
        )}

        {/* Progress dots — one per step */}
        {isActiveStep && steps.length > 0 && (
          <View style={styles.dotsRow}>
            {steps.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  idx < currentStepIndex && styles.dotDone,
                  idx === currentStepIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Error banner */}
      {phase === 'error' && (
        <View style={styles.errorBanner}>
          <AlertCircle size={18} color="#FCA5A5" style={{ marginRight: 8, alignSelf: 'flex-start', marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.errorBannerText} numberOfLines={3}>
              {errorMsg}
            </Text>
            {failedAttempts >= 3 && (
              <Text style={styles.errorHintText}>
                Face the camera in good light, remove glasses or a mask, and turn your head clearly when asked.
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Footer actions */}
      <View style={styles.footer}>
        {/* Idle: start button */}
        {phase === 'idle' && (
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={startLivenessChallenge}
            activeOpacity={0.82}
          >
            <Camera size={20} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.captureBtnText}>
              {isEnrolled ? 'Start Verification' : 'Start Enrollment'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Error: retry button */}
        {phase === 'error' && (
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={handleRetry}
            activeOpacity={0.82}
          >
            <RefreshCw size={20} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.captureBtnText}>Try Again</Text>
          </TouchableOpacity>
        )}

        {/*
         * Awaiting phase: the user MANUALLY triggers each step's countdown.
         * This satisfies the API's >= 2-second minimum delay requirement
         * between challenge creation and first frame submission.
         */}
        {phase === 'awaiting' && (
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={startStepCountdown}
            activeOpacity={0.82}
          >
            <Camera size={20} color="#FFF" style={{ marginRight: 10 }} />
            <Text style={styles.captureBtnText}>
              {currentStepIndex === 0 ? 'Start — Look Straight' : 'Continue'}
            </Text>
          </TouchableOpacity>
        )}

        {/* In-progress spinner states */}
        {(phase === 'counting' ||
          phase === 'capturing' ||
          phase === 'challenging' ||
          phase === 'analyzing') && (
          <View style={styles.progressFooter}>
            <ActivityIndicator
              color={PRIMARY}
              size="small"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.progressFooterText}>
              {phase === 'challenging' && 'Fetching challenge…'}
              {phase === 'counting' &&
                `Step ${currentStepIndex + 1} of ${
                  steps.length
                } — hold still`}
              {phase === 'capturing' && 'Capturing frame…'}
              {phase === 'analyzing' && 'Verifying with server…'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut
            size={14}
            color="rgba(255,255,255,0.5)"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.logoutText}>Sign Out Instead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  header: {
    paddingTop: 56,
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
    marginBottom: 10,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 0.5,
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
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  frameWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    borderRadius: 20,
    position: 'relative',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  stepCardOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  stepBadge: {
    backgroundColor: 'rgba(62,123,116,0.3)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(62,123,116,0.5)',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#80E5D7',
    letterSpacing: 0.8,
  },
  stepPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  stepPromptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    flexShrink: 1,
  },
  countdownBig: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4ADE80',
    marginTop: 4,
  },
  loadingBoxInside: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingBoxText: {
    marginTop: 12,
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
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
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    backgroundColor: PRIMARY,
    width: 20,
  },
  dotDone: {
    backgroundColor: '#4ADE80',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.35)',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#FCA5A5',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  errorHintText: {
    fontSize: 12,
    color: '#FDE68A',
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 36,
    width: '100%',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  captureBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  progressFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  progressFooterText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
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
  },
  permBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  permText: { marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
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
});
