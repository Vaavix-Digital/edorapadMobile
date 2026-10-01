import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../shared/api/authApi';
import { User, UserRole, USER_ROLES } from '../../shared/types';
import { storageService } from '../../services/storage';
import { getFcmToken, saveFcmToken, loadFcmToken, devicePlatform } from '../../services/push';

interface AuthState {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isInitialized: false,
  loading: false,
  error: null,
};

export const normalizeUserRole = (rawRole: any): UserRole => {
  if (!rawRole) return USER_ROLES.STUDENT;
  const str = String(rawRole).trim();

  const lower = str.toLowerCase();
  if (lower === 'onlinetutor' || lower === 'online tutor' || lower === 'online_tutor') {
    return USER_ROLES.ONLINETUTOR;
  }
  if (lower === 'offlinetutor' || lower === 'offline tutor' || lower === 'offline_tutor') {
    return USER_ROLES.OFFLINETUTOR;
  }
  // Generic tutor / teacher / faculty defaults to ONLINE_TUTOR unless specified
  if (lower === 'tutor' || lower === 'faculty' || lower === 'teacher') {
    return USER_ROLES.ONLINETUTOR;
  }
  if (
    lower === 'accountsmarketing' ||
    lower === 'accounts_marketing' ||
    lower === 'account_&_marketing' ||
    lower.includes('account') ||
    lower.includes('marketing') ||
    lower.includes('management') ||
    lower.includes('manager')
  ) {
    return USER_ROLES.ACCOUNTS_MARKETING;
  }
  if (lower === 'coursecreator' || lower === 'course creator' || lower === 'course_creator') {
    return USER_ROLES.COURSE_CREATOR;
  }
  if (lower === 'institute' || lower === 'institution' || lower === 'institute_admin') {
    return USER_ROLES.INSTITUTE;
  }
  if (lower === 'admin') {
    return USER_ROLES.ADMIN;
  }
  if (lower === 'superadmin' || lower === 'super admin' || lower === 'super_admin') {
    return USER_ROLES.SUPER_ADMIN;
  }
  if (lower === 'parent') {
    return USER_ROLES.PARENT;
  }
  if (lower === 'student') {
    return USER_ROLES.STUDENT;
  }

  return str.toUpperCase().replace(/\s+/g, '_') as UserRole;
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string; role?: string }, { rejectWithValue }) => {
    try {
      // Step 4: Obtain FCM token before login
      const fcmToken = await getFcmToken().catch(() => null);

      const response = await authApi.login({
        ...credentials,
        ...(fcmToken ? { fcmToken, platform: devicePlatform } : {}),
      });

      const user = response.data || response.user;
      const token = response.accessToken || response.token;

      if (!user || !token) {
        return rejectWithValue('Invalid login response from server');
      }

      // Step 5: Save FCM token locally
      const savedToken = (response as any).data?.fcmToken || fcmToken;
      if (savedToken) {
        await saveFcmToken(savedToken).catch(() => {});
      }

      // If credentials explicitly specified role (e.g. from TutorLoginScreen selecting online vs offline),
      // prefer credentials.role if server role is generic ('tutor', 'faculty', etc.) or missing:
      const rawServerRole = user.role ? String(user.role).trim().toLowerCase() : '';
      const isGenericServerRole = !rawServerRole || rawServerRole === 'tutor' || rawServerRole === 'faculty' || rawServerRole === 'teacher';
      const effectiveRole = (isGenericServerRole && credentials.role) ? credentials.role : (user.role || credentials.role);

      // Normalize role consistently
      const normalizedRole = normalizeUserRole(effectiveRole);
      user.role = normalizedRole;

      // Save token securely
      await storageService.setToken(token);

      return { user, token, role: normalizedRole };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Login failed. Please check your credentials.'
      );
    }
  }
);

/**
 * Sign in / sign up with a Google ID token.
 * - Existing users are signed in immediately.
 * - New users receive { code: 'GOOGLE_ROLE_REQUIRED' } — call again with `role` to create the account.
 */
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (payload: { credential: string; role?: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.googleLogin(payload);
      const user = response.data || response.user;
      const token = response.accessToken || response.token;

      if (!user || !token) {
        return rejectWithValue('Invalid Google sign-in response from server');
      }

      const normalizedRole = normalizeUserRole(user.role);
      user.role = normalizedRole;

      await storageService.setToken(token);
      return { user, token, role: normalizedRole };
    } catch (error: any) {
      const body = error.response?.data;
      return rejectWithValue({
        code: body?.code || null,
        message: body?.message || 'Google sign-in failed. Please try again.',
        data: body?.data || null,
      });
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    const fcmToken = await loadFcmToken().catch(() => null);
    await authApi.logout(fcmToken ? { fcmToken } : undefined);
    await saveFcmToken(null).catch(() => {});
  } catch {
    // Ignore server error on logout
  } finally {
    await storageService.clearAuthTokens().catch(() => {});
  }
  return true;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string; role: UserRole }>
    ) => {
      const normalizedRole = normalizeUserRole(action.payload.role || action.payload.user?.role);
      const requiresVerification = (
        normalizedRole === USER_ROLES.ONLINETUTOR ||
        normalizedRole === USER_ROLES.OFFLINETUTOR ||
        normalizedRole === USER_ROLES.ACCOUNTS_MARKETING
      );

      state.user = {
        ...action.payload.user,
        role: normalizedRole,
        isFaceEnrolled: action.payload.user?.isFaceEnrolled ?? false,
        isFaceVerified: action.payload.user?.isFaceVerified !== undefined
          ? action.payload.user.isFaceVerified
          : (requiresVerification ? false : true),
      };
      state.token = action.payload.token;
      state.role = normalizedRole;
      state.isAuthenticated = true;
      state.error = null;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    forceLogout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setUserFaceState: (
      state,
      action: PayloadAction<{ isFaceEnrolled?: boolean; isFaceVerified?: boolean }>
    ) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;

        const role = action.payload.role;
        const requiresVerification = (
          role === USER_ROLES.ONLINETUTOR ||
          role === USER_ROLES.OFFLINETUTOR ||
          role === USER_ROLES.ACCOUNTS_MARKETING
        );

        state.user = {
          ...action.payload.user,
          // Preserve enrolled status from DB, but gate face verification for this login session
          isFaceEnrolled: action.payload.user?.isFaceEnrolled ?? false,
          isFaceVerified: requiresVerification ? false : true,
        };
        state.token = action.payload.token;
        state.role = role;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.role = null;
        state.error = (action.payload as string) || 'Login failed';
      })
      // ── Google Sign-In ──────────────────────────────────────────────
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = {
          ...action.payload.user,
          isFaceEnrolled: action.payload.user?.isFaceEnrolled ?? false,
          isFaceVerified: true, // Google users bypass face-verification
        };
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.role = null;
        // GOOGLE_ROLE_REQUIRED is a normal UI step — don't surface as an error
        const payload = action.payload as any;
        state.error = payload?.code === 'GOOGLE_ROLE_REQUIRED'
          ? null
          : payload?.message || 'Google sign-in failed';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  }
});

export const { setCredentials, setInitialized, clearAuthError, forceLogout, setUserFaceState } = authSlice.actions;
export default authSlice.reducer;
