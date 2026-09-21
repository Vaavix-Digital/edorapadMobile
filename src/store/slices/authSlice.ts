import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../shared/api/authApi';
import { User, UserRole, USER_ROLES } from '../../shared/types';
import { storageService } from '../../services/storage';

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
  if (lower === 'accountsmarketing' || lower.includes('account') || lower.includes('marketing')) {
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
      const response = await authApi.login(credentials);
      const user = response.data || response.user;
      const token = response.accessToken || response.token;

      if (!user || !token) {
        return rejectWithValue('Invalid login response from server');
      }

      // Normalize role consistently
      const normalizedRole = normalizeUserRole(user.role || credentials.role);
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

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
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
      state.user = { ...action.payload.user, role: normalizedRole };
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
    }
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
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.role;
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

export const { setCredentials, setInitialized, clearAuthError, forceLogout } = authSlice.actions;
export default authSlice.reducer;
