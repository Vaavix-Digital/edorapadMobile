import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { tutorApi } from '../../shared/api/tutorApi';
import { Batch, LiveClass } from '../../shared/types';

export interface TutorStats {
  totalBatches: number;
  activeStudents: number;
  upcomingLiveClasses: number;
  certificatesIssued: number;
}

export interface TutorTask {
  id: string;
  content: string;
  isCompleted: boolean;
  batch?: { id?: string; name: string } | null;
  date?: string;
  createdAt?: string;
}

export interface TutorAttendanceSummary {
  attendedDays: number;
  leaveTaken: number;
  remaining: number;
}

export interface BatchAttendanceItem {
  batchName: string;
  attendanceValue: number;
}

export interface UpcomingActivityItem {
  id: string;
  activity: string;
  course: string;
  status: string;
  date: string;
  batch: string;
}

export interface MonthlyAttendanceRecord {
  date: string;
  status: 'Present' | 'Absent' | 'Leave' | string;
  inTime?: string;
  outTime?: string;
  remarks?: string;
}

export interface MonthlyAttendanceState {
  attendance: MonthlyAttendanceRecord[];
  leaves: any[];
  summary: {
    totalDays?: number;
    presentDays?: number;
    absentDays?: number;
    leaveDays?: number;
  };
}

export interface TutorProfileData {
  id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  staffId?: string;
  role?: string;
  profilePicUrl?: string;
  courseCreatorSettings?: {
    gender?: string;
    nationality?: string;
    dob?: string;
    bankName?: string;
    branchName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    emailAlerts?: boolean;
    smsAlerts?: boolean;
    whatsappAlerts?: boolean;
    profilePicUrl?: string;
  };
}

interface TutorState {
  stats: TutorStats;
  tasks: TutorTask[];
  allTasks: TutorTask[];
  attendance: TutorAttendanceSummary;
  batchAttendance: BatchAttendanceItem[];
  upcomingActivities: UpcomingActivityItem[];
  monthlyAttendance: MonthlyAttendanceState;
  batches: Batch[];
  liveClasses: LiveClass[];
  leaveHistory: any[];
  profile: TutorProfileData | null;
  profileLoading: boolean;
  loading: boolean;
  tasksLoading: boolean;
  monthlyLoading: boolean;
  error: string | null;
}

const initialState: TutorState = {
  stats: {
    totalBatches: 0,
    activeStudents: 0,
    upcomingLiveClasses: 0,
    certificatesIssued: 0,
  },
  tasks: [],
  allTasks: [],
  attendance: {
    attendedDays: 0,
    leaveTaken: 0,
    remaining: 0,
  },
  batchAttendance: [],
  upcomingActivities: [],
  monthlyAttendance: {
    attendance: [],
    leaves: [],
    summary: {},
  },
  batches: [],
  liveClasses: [],
  leaveHistory: [],
  profile: null,
  profileLoading: false,
  loading: false,
  tasksLoading: false,
  monthlyLoading: false,
  error: null,
};

// Fetch full tutor dashboard data matching web
export const fetchTutorDashboardData = createAsyncThunk(
  'tutor/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const [
        statsRes,
        tasksRes,
        attendanceRes,
        batchAttRes,
        activitiesRes,
        batchesRes,
        liveRes
      ] = await Promise.all([
        tutorApi.getDashboardStats().catch(() => ({ data: null })),
        tutorApi.getDashboardTasks().catch(() => ({ data: [] })),
        tutorApi.getDashboardAttendance().catch(() => ({ data: null })),
        tutorApi.getDashboardBatchAttendance().catch(() => ({ data: [] })),
        tutorApi.getUpcomingActivities().catch(() => ({ data: [] })),
        tutorApi.getBatches().catch(() => ({ data: [] })),
        tutorApi.getLiveClasses().catch(() => ({ data: [] })),
      ]);

      const batchesList = batchesRes?.data || [];
      const statsData = statsRes?.data || {
        totalBatches: batchesList.length || 0,
        activeStudents: 0,
        upcomingLiveClasses: (liveRes?.data || []).length || 0,
        certificatesIssued: 0,
      };

      return {
        stats: {
          totalBatches: statsData.totalBatches ?? batchesList.length ?? 0,
          activeStudents: statsData.activeStudents ?? 0,
          upcomingLiveClasses: statsData.upcomingLiveClasses ?? (liveRes?.data || []).length ?? 0,
          certificatesIssued: statsData.certificatesIssued ?? 0,
        },
        tasks: Array.isArray(tasksRes?.data) ? tasksRes.data : [],
        attendance: attendanceRes?.data || {
          attendedDays: 0,
          leaveTaken: 0,
          remaining: 0,
        },
        batchAttendance: Array.isArray(batchAttRes?.data) ? batchAttRes.data : [],
        upcomingActivities: Array.isArray(activitiesRes?.data) ? activitiesRes.data : [],
        batches: batchesList,
        liveClasses: liveRes?.data || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load tutor dashboard');
    }
  }
);

// Fetch monthly attendance report (used in calendar modal)
export const fetchMonthlyAttendance = createAsyncThunk(
  'tutor/fetchMonthlyAttendance',
  async ({ month, year }: { month: string | number; year: string | number }, { rejectWithValue }) => {
    try {
      const res = await tutorApi.getMonthlyAttendance(month, year);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch monthly attendance');
    }
  }
);

// Fetch tutor batches
export const fetchTutorBatches = createAsyncThunk(
  'tutor/fetchBatches',
  async (_, { rejectWithValue }) => {
    try {
      const res = await tutorApi.getBatches();
      return res.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch batches');
    }
  }
);

// Fetch tasks for Task Manager
export const fetchTasks = createAsyncThunk(
  'tutor/fetchTasks',
  async (filters: any = {}, { rejectWithValue }) => {
    try {
      const res = await tutorApi.getTasks(filters);
      return res.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

// Create a new task
export const createTask = createAsyncThunk(
  'tutor/createTask',
  async (taskData: any, { rejectWithValue, dispatch }) => {
    try {
      const res = await tutorApi.createTask(taskData);
      dispatch(fetchTasks({}));
      dispatch(fetchTutorDashboardData());
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

// Toggle task status
export const updateTaskStatus = createAsyncThunk(
  'tutor/updateTaskStatus',
  async ({ taskId, isCompleted }: { taskId: string; isCompleted: boolean }, { rejectWithValue }) => {
    try {
      const res = await tutorApi.updateTaskStatus(taskId, isCompleted);
      return { taskId, isCompleted, data: res.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

// Delete task
export const deleteTask = createAsyncThunk(
  'tutor/deleteTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      await tutorApi.deleteTask(taskId);
      return taskId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

// Apply for leave
export const submitTutorLeave = createAsyncThunk(
  'tutor/submitLeave',
  async (leaveData: { startDate: string; endDate: string; reason: string; type?: string }, { rejectWithValue, dispatch }) => {
    try {
      const response = await tutorApi.applyLeave(leaveData);
      dispatch(fetchTutorLeaveHistory());
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit leave request');
    }
  }
);

// Leave history
export const fetchTutorLeaveHistory = createAsyncThunk(
  'tutor/fetchLeaveHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tutorApi.getLeaveHistory();
      const raw = response.data || response;
      return Array.isArray(raw) ? raw : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave history');
    }
  }
);

// Profile
export const fetchTutorProfile = createAsyncThunk(
  'tutor/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await tutorApi.getProfile();
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateTutorProfile = createAsyncThunk(
  'tutor/updateProfile',
  async (payload: any, { rejectWithValue, dispatch }) => {
    try {
      const response = await tutorApi.updateProfile(payload);
      dispatch(fetchTutorProfile());
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateTutorBank = createAsyncThunk(
  'tutor/updateBank',
  async (bankData: any, { rejectWithValue, dispatch }) => {
    try {
      const response = await tutorApi.updateBank(bankData);
      dispatch(fetchTutorProfile());
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update bank details');
    }
  }
);

export const updateTutorNotifications = createAsyncThunk(
  'tutor/updateNotifications',
  async (notifData: any, { rejectWithValue, dispatch }) => {
    try {
      const response = await tutorApi.updateNotifications(notifData);
      dispatch(fetchTutorProfile());
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update notification settings');
    }
  }
);

const tutorSlice = createSlice({
  name: 'tutor',
  initialState,
  reducers: {
    clearTutorError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard full fetch
      .addCase(fetchTutorDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTutorDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.tasks = action.payload.tasks;
        state.attendance = action.payload.attendance;
        state.batchAttendance = action.payload.batchAttendance;
        state.upcomingActivities = action.payload.upcomingActivities;
        state.batches = action.payload.batches;
        state.liveClasses = action.payload.liveClasses;
      })
      .addCase(fetchTutorDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Monthly attendance
      .addCase(fetchMonthlyAttendance.pending, (state) => {
        state.monthlyLoading = true;
      })
      .addCase(fetchMonthlyAttendance.fulfilled, (state, action) => {
        state.monthlyLoading = false;
        state.monthlyAttendance = {
          attendance: action.payload?.attendance || [],
          leaves: action.payload?.leaves || [],
          summary: action.payload?.summary || {},
        };
      })
      .addCase(fetchMonthlyAttendance.rejected, (state) => {
        state.monthlyLoading = false;
      })

      // Batches
      .addCase(fetchTutorBatches.fulfilled, (state, action) => {
        state.batches = action.payload;
      })

      // Tasks
      .addCase(fetchTasks.pending, (state) => {
        state.tasksLoading = true;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.tasksLoading = false;
        state.allTasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state) => {
        state.tasksLoading = false;
      })

      // Update Task Status (optimistic)
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const { taskId, isCompleted } = action.payload;
        // update in dashboard tasks
        const dIdx = state.tasks.findIndex((t) => t.id === taskId);
        if (dIdx !== -1) {
          state.tasks[dIdx].isCompleted = isCompleted;
        }
        // update in allTasks
        const aIdx = state.allTasks.findIndex((t) => t.id === taskId);
        if (aIdx !== -1) {
          state.allTasks[aIdx].isCompleted = isCompleted;
        }
      })

      // Delete Task
      .addCase(deleteTask.fulfilled, (state, action) => {
        const taskId = action.payload;
        state.tasks = state.tasks.filter((t) => t.id !== taskId);
        state.allTasks = state.allTasks.filter((t) => t.id !== taskId);
      })

      // Leave history
      .addCase(fetchTutorLeaveHistory.fulfilled, (state, action) => {
        state.leaveHistory = action.payload;
      })

      // Profile
      .addCase(fetchTutorProfile.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(fetchTutorProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchTutorProfile.rejected, (state) => {
        state.profileLoading = false;
      });
  },
});

export const { clearTutorError } = tutorSlice.actions;
export default tutorSlice.reducer;
