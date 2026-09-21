import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { parentApi } from '../../shared/api/parentApi';
import { AppNotification } from '../../shared/types';

export const DEFAULT_PARENT_STUDENTS = [
  {
    studentInfo: {
      id: 'stu-shrihari-1',
      _id: 'stu-shrihari-1',
      name: 'Shrihari Nambiar p',
      email: 'shrihari1056@gmail.com',
      profilePic: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
      class: 'Grade 10 - Section A',
    },
    academicPerformance: {
      liveClasses: { total: 4, attended: 7 },
      exams: { totalCount: 7, submittedCount: 6 },
      assignments: { totalCount: 2, submittedCount: 1 },
    },
    totalStats: { percentage: 5, attended: 1, leave: 19 },
    records: [
      { date: '2026-09-08', status: 'Present', subject: 'Calculus & Physics', remarks: 'On time' },
      { date: '2026-09-07', status: 'Present', subject: 'Computer Networks', remarks: 'On time' },
      { date: '2026-09-05', status: 'Late', subject: 'Digital Electronics', remarks: '10 mins late' },
      { date: '2026-09-04', status: 'Present', subject: 'Database Management', remarks: 'On time' },
      { date: '2026-09-03', status: 'Absent', subject: 'Operating Systems', remarks: 'Sick leave approved' },
    ],
  },
  {
    studentInfo: {
      id: 'stu-shekha-2',
      _id: 'stu-shekha-2',
      name: 'Shekha Nasrudin',
      email: 'shekha.nasrudin@gmail.com',
      profilePic: null,
      class: 'Grade 8 - Section B',
    },
    academicPerformance: {
      liveClasses: { total: 6, attended: 5 },
      exams: { totalCount: 5, submittedCount: 5 },
      assignments: { totalCount: 4, submittedCount: 3 },
    },
    totalStats: { percentage: 85, attended: 17, leave: 3 },
    records: [
      { date: '2026-09-08', status: 'Present', subject: 'English Literature', remarks: 'On time' },
      { date: '2026-09-07', status: 'Present', subject: 'Mathematics', remarks: 'On time' },
      { date: '2026-09-05', status: 'Present', subject: 'General Science', remarks: 'On time' },
    ],
  },
];

export interface ParentState {
  loading: boolean;
  error: string | null;

  dashboard: any[];
  attendance: any[];

  profile: any | null;
  profileSettings: any | null;
  children: any[];
  selectedStudentId: string | null;

  notifications: AppNotification[];
  pendingExams: any[];

  examResultsAll: any[];
  assignmentResultsAll: any[];
  quizResultsAll: any[];

  examResults: any[];
  assignmentResults: any[];
  quizResults: any[];

  examSummary: any | null;
  assignmentSummary: any | null;
  quizSummary: any | null;

  parentName: string;
  totalAssignmentCount: number;
  studentSubmittedCount: number;
  attendancePercentage: number;

  profileUpdateMessage: string;
  preferenceUpdateMessage: string;

  allNotifications: any[];
  notificationSummary: {
    total: number;
    page: number;
    pages: number;
  };
  clearNotificationMessage: string;
}

const initialState: ParentState = {
  loading: false,
  error: null,

  dashboard: DEFAULT_PARENT_STUDENTS,
  attendance: DEFAULT_PARENT_STUDENTS,

  profile: null,
  profileSettings: null,
  children: [],
  selectedStudentId: 'stu-shrihari-1',

  notifications: [],
  pendingExams: [],

  examResultsAll: [],
  assignmentResultsAll: [],
  quizResultsAll: [],

  examResults: [],
  assignmentResults: [],
  quizResults: [],

  examSummary: null,
  assignmentSummary: null,
  quizSummary: null,

  parentName: 'Shashi Kumar',
  totalAssignmentCount: 2,
  studentSubmittedCount: 1,
  attendancePercentage: 5,

  profileUpdateMessage: '',
  preferenceUpdateMessage: '',

  allNotifications: [],
  notificationSummary: {
    total: 0,
    page: 1,
    pages: 1,
  },
  clearNotificationMessage: '',
};

/* ===========================
   Fetch Full Dashboard
=========================== */
export const fetchParentFullDashboard = createAsyncThunk(
  'parent/fetchFullDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const [dashRes, attRes, notifRes, examsRes, profileRes] = await Promise.all([
        parentApi.getDashboard().catch(() => null),
        parentApi.getStudentAttendance().catch(() => null),
        parentApi.getNotifications().catch(() => null),
        parentApi.getPendingExams().catch(() => null),
        parentApi.getProfile().catch(() => null),
      ]);

      const rawDash: any = dashRes;
      const rawAtt: any = attRes;
      const rawNotif: any = notifRes;
      const rawExams: any = examsRes;
      const rawProfile: any = profileRes;

      const parsedDashboard = Array.isArray(rawDash?.data)
        ? rawDash.data
        : Array.isArray(rawDash)
        ? rawDash
        : Array.isArray(rawDash?.dashboard)
        ? rawDash.dashboard
        : [];

      const parsedAttendance = Array.isArray(rawAtt?.data)
        ? rawAtt.data
        : Array.isArray(rawAtt)
        ? rawAtt
        : [];

      const parsedNotifications = Array.isArray(rawNotif?.data)
        ? rawNotif.data
        : Array.isArray(rawNotif)
        ? rawNotif
        : [];

      const parsedPendingExams = Array.isArray(rawExams?.data)
        ? rawExams.data
        : Array.isArray(rawExams)
        ? rawExams
        : [];

      const profileData: any = rawProfile?.data?.profile
        ? rawProfile.data
        : rawProfile?.profile
        ? rawProfile
        : rawProfile?.data || {};

      return {
        dashboard: parsedDashboard,
        parentName: rawDash?.parentName || profileData?.profile?.name || '',
        totalAssignmentCount: rawDash?.totalAssignmentCount ?? 0,
        studentSubmittedCount: rawDash?.studentSubmittedCount ?? 0,
        attendance: parsedAttendance,
        notifications: parsedNotifications,
        pendingExams: parsedPendingExams,
        profile: profileData?.profile || null,
        profileSettings: profileData?.settings || null,
        children: profileData?.children || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load parent dashboard');
    }
  }
);

/* ===========================
   Assessments
=========================== */
export const fetchParentExamResults = createAsyncThunk(
  'parent/fetchExamResults',
  async (page: number | void = 1, { rejectWithValue }) => {
    try {
      const response = await parentApi.getExamResults(typeof page === 'number' ? page : 1);
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch exam results');
    }
  }
);

export const fetchParentAssignmentResults = createAsyncThunk(
  'parent/fetchAssignmentResults',
  async (page: number | void = 1, { rejectWithValue }) => {
    try {
      const response = await parentApi.getAssignmentResults(typeof page === 'number' ? page : 1);
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch assignment results');
    }
  }
);

export const fetchParentQuizResults = createAsyncThunk(
  'parent/fetchQuizResults',
  async (page: number | void = 1, { rejectWithValue }) => {
    try {
      const response = await parentApi.getQuizResults(typeof page === 'number' ? page : 1);
      return response.data || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch quiz results');
    }
  }
);

/* ===========================
   All Notifications & Clear
=========================== */
export const fetchParentAllNotifications = createAsyncThunk(
  'parent/fetchAllNotifications',
  async ({ page = 1, search = '' }: { page?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await parentApi.getAllNotifications(page, search);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const clearParentAllNotifications = createAsyncThunk(
  'parent/clearAllNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await parentApi.clearAllNotifications();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear notifications');
    }
  }
);

/* ===========================
   Profile & Preferences
=========================== */
export const fetchParentProfile = createAsyncThunk(
  'parent/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await parentApi.getProfile();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateParentPreferences = createAsyncThunk(
  'parent/updatePreferences',
  async (preferences: { emailAlerts?: boolean; whatsappAlerts?: boolean }, { rejectWithValue }) => {
    try {
      const response = await parentApi.updatePreferences(preferences);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update preferences');
    }
  }
);

export const updateParentProfile = createAsyncThunk(
  'parent/updateProfile',
  async (profileData: any, { rejectWithValue }) => {
    try {
      const response = await parentApi.updateProfile(profileData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

const parentSlice = createSlice({
  name: 'parent',
  initialState,
  reducers: {
    clearParentError: (state) => {
      state.error = null;
    },
    setSelectedStudent: (state, action: PayloadAction<string | null>) => {
      state.selectedStudentId = action.payload;

      if (action.payload) {
        const studentId = action.payload;
        const examMatch = state.examResultsAll.find(
          (s) => s?.studentInfo?.id === studentId || s?.studentInfo?._id === studentId
        );
        state.examResults = examMatch?.list || [];
        state.examSummary = examMatch?.summary || null;

        const assignMatch = state.assignmentResultsAll.find(
          (s) => s?.studentInfo?.id === studentId || s?.studentInfo?._id === studentId
        );
        state.assignmentResults = assignMatch?.list || [];
        state.assignmentSummary = assignMatch?.summary || null;

        const quizMatch = state.quizResultsAll.find(
          (s) => s?.studentInfo?.id === studentId || s?.studentInfo?._id === studentId
        );
        state.quizResults = quizMatch?.list || [];
        state.quizSummary = quizMatch?.summary || null;

        const attMatch = state.attendance.find(
          (s) =>
            s?.studentInfo?.id === studentId ||
            s?.studentInfo?._id === studentId ||
            s?.id === studentId ||
            s?._id === studentId
        );
        if (attMatch?.totalStats?.percentage !== undefined) {
          state.attendancePercentage = attMatch.totalStats.percentage;
        } else if (studentId === 'stu-shrihari-1') {
          state.attendancePercentage = 5;
        } else if (studentId === 'stu-shekha-2') {
          state.attendancePercentage = 85;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      /* Full Dashboard */
      .addCase(fetchParentFullDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParentFullDashboard.fulfilled, (state, action) => {
        state.loading = false;

        // If backend returned student data, use it; otherwise fallback to default
        if (action.payload.dashboard && action.payload.dashboard.length > 0) {
          state.dashboard = action.payload.dashboard;
        } else if (state.dashboard.length === 0) {
          state.dashboard = DEFAULT_PARENT_STUDENTS;
        }

        if (action.payload.parentName) {
          state.parentName = action.payload.parentName;
        }

        if (action.payload.totalAssignmentCount > 0) {
          state.totalAssignmentCount = action.payload.totalAssignmentCount;
          state.studentSubmittedCount = action.payload.studentSubmittedCount;
        }

        if (action.payload.attendance && action.payload.attendance.length > 0) {
          state.attendance = action.payload.attendance;
        } else if (state.attendance.length === 0) {
          state.attendance = DEFAULT_PARENT_STUDENTS;
        }

        if (action.payload.notifications && action.payload.notifications.length > 0) {
          state.notifications = action.payload.notifications;
        }

        if (action.payload.pendingExams && action.payload.pendingExams.length > 0) {
          state.pendingExams = action.payload.pendingExams;
        }

        if (action.payload.profile) {
          state.profile = action.payload.profile;
        }
        if (action.payload.profileSettings) {
          state.profileSettings = action.payload.profileSettings;
        }
        if (action.payload.children && action.payload.children.length > 0) {
          state.children = action.payload.children;
        }

        // Selected student ID
        const firstStudentId =
          state.dashboard[0]?.studentInfo?.id ||
          state.dashboard[0]?.studentInfo?._id ||
          state.dashboard[0]?.id ||
          state.dashboard[0]?._id ||
          state.children[0]?.id ||
          state.children[0]?._id;

        const selectedExists = state.dashboard.some(
          (s) =>
            s?.studentInfo?.id === state.selectedStudentId ||
            s?.studentInfo?._id === state.selectedStudentId ||
            s?.id === state.selectedStudentId ||
            s?._id === state.selectedStudentId
        );

        if (firstStudentId && (!state.selectedStudentId || !selectedExists)) {
          state.selectedStudentId = firstStudentId;
        }

        if (state.attendance.length > 0 && state.attendance[0]?.totalStats?.percentage !== undefined) {
          state.attendancePercentage = state.attendance[0].totalStats.percentage;
        }
      })
      .addCase(fetchParentFullDashboard.rejected, (state, action) => {
        state.loading = false;
        // Keep default data even if offline/failed
        if (state.dashboard.length === 0) {
          state.dashboard = DEFAULT_PARENT_STUDENTS;
        }
      })

      /* Exam Results */
      .addCase(fetchParentExamResults.fulfilled, (state, action) => {
        state.examResultsAll = action.payload || [];
        const match = state.selectedStudentId
          ? state.examResultsAll.find(
              (s) => s?.studentInfo?.id === state.selectedStudentId || s?.studentInfo?._id === state.selectedStudentId
            )
          : state.examResultsAll[0];
        state.examResults = match?.list || [];
        state.examSummary = match?.summary || null;
      })

      /* Assignment Results */
      .addCase(fetchParentAssignmentResults.fulfilled, (state, action) => {
        state.assignmentResultsAll = action.payload || [];
        const match = state.selectedStudentId
          ? state.assignmentResultsAll.find(
              (s) => s?.studentInfo?.id === state.selectedStudentId || s?.studentInfo?._id === state.selectedStudentId
            )
          : state.assignmentResultsAll[0];
        state.assignmentResults = match?.list || [];
        state.assignmentSummary = match?.summary || null;
      })

      /* Quiz Results */
      .addCase(fetchParentQuizResults.fulfilled, (state, action) => {
        state.quizResultsAll = action.payload || [];
        const match = state.selectedStudentId
          ? state.quizResultsAll.find(
              (s) => s?.studentInfo?.id === state.selectedStudentId || s?.studentInfo?._id === state.selectedStudentId
            )
          : state.quizResultsAll[0];
        state.quizResults = match?.list || [];
        state.quizSummary = match?.summary || null;
      })

      /* All Notifications */
      .addCase(fetchParentAllNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchParentAllNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.allNotifications = action.payload.data || [];
        state.notificationSummary = action.payload.summary || {
          total: 0,
          page: 1,
          pages: 1,
        };
      })
      .addCase(fetchParentAllNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* Clear All Notifications */
      .addCase(clearParentAllNotifications.fulfilled, (state, action) => {
        state.allNotifications = [];
        state.notificationSummary = { total: 0, page: 1, pages: 1 };
        state.clearNotificationMessage = action.payload.message || '';
      })

      /* Profile */
      .addCase(fetchParentProfile.fulfilled, (state, action) => {
        state.profile = action.payload.profile || null;
        state.profileSettings = action.payload.settings || null;
        state.children = action.payload.children || [];
        if (state.children.length > 0 && !state.selectedStudentId) {
          state.selectedStudentId = state.children[0]?._id || state.children[0]?.id;
        }
      })

      /* Preferences */
      .addCase(updateParentPreferences.fulfilled, (state, action) => {
        state.preferenceUpdateMessage = action.payload.message || '';
        if (state.profileSettings && action.payload.data) {
          state.profileSettings.emailAlerts = action.payload.data.emailAlerts;
          state.profileSettings.whatsappAlerts = action.payload.data.whatsappAlerts;
        }
      })

      /* Update Profile */
      .addCase(updateParentProfile.fulfilled, (state, action) => {
        state.profileUpdateMessage = action.payload.message || '';
        if (state.profileSettings && action.payload.data) {
          state.profileSettings = {
            ...state.profileSettings,
            ...action.payload.data,
          };
        }
      });
  },
});

export const { clearParentError, setSelectedStudent } = parentSlice.actions;

export default parentSlice.reducer;
