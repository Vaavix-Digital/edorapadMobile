import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { instituteApi } from '../../shared/api/instituteApi';
import { notificationsApi } from '../../shared/api/notificationsApi';
import { LeaveRequest, AppNotification } from '../../shared/types';

export interface StaffDistributionItem {
  role: string;
  count: number;
  percentage: number;
}

export interface FinancialOverviewItem {
  month: string;
  income: number;
  expense: number;
}

export interface DepartmentBreakdownItem {
  course: string;
  Aug?: number;
  Jul?: number;
  Sep?: number;
  [key: string]: any;
}

interface InstituteState {
  stats: {
    totalTutors: number;
    totalDepartments: number;
    activeStudents: number;
    totalCourses: number;
  } | null;
  leaves: LeaveRequest[];
  batches: any[];
  staff: any[];
  courses: any[];
  departments: any[];
  admissionRequests: any[];
  certificates: any[];
  staffDistribution: {
    totalStaff: number;
    data: StaffDistributionItem[];
  };
  financialOverview: FinancialOverviewItem[];
  departmentBreakdown: DepartmentBreakdownItem[];
  currentAdmission: any | null;
  notifications: AppNotification[];
  unreadCount: number;
  settings: any | null;
  loading: boolean;
  error: string | null;
}

const defaultAdmissionRequests: any[] = [
  {
    id: 'adm-1',
    customAdmissionId: 'ADM-GTI-LJ3ZE13EB5',
    studentFirstName: 'Anjana',
    studentLastName: 'Rejilnad',
    studentEmail: 'anjana.rejilnad@example.com',
    studentPhone: '+91 98765 43210',
    course: { title: 'Mern Programming', price: '₹25,000' },
    status: 'Approved',
    createdAt: '2026-06-15T10:00:00.000Z',
    updatedAt: '2026-06-16T12:00:00.000Z',
    isStudentVerified: true,
    isGuardianVerified: true,
    studentIdProofType: 'Aadhaar Card',
    guardianFirstName: 'Rejilnad',
    guardianLastName: 'K',
    guardianRelation: 'Father',
    guardianEmail: 'rejilnad@example.com',
    guardianPhone: '+91 98765 00000',
  },
  {
    id: 'adm-2',
    customAdmissionId: 'ADM-GTI-000001',
    studentFirstName: 'Souparnika',
    studentLastName: 'S',
    studentEmail: 'souparnika@example.com',
    studentPhone: '+91 98450 11223',
    course: { title: 'Mern Programming', price: '₹25,000' },
    status: 'Approved',
    createdAt: '2026-06-10T09:30:00.000Z',
    updatedAt: '2026-06-11T14:20:00.000Z',
    isStudentVerified: true,
    isGuardianVerified: true,
    studentIdProofType: 'Aadhaar Card',
    guardianFirstName: 'Sasi',
    guardianLastName: 'Kumar',
    guardianRelation: 'Father',
    guardianEmail: 'sasi@example.com',
    guardianPhone: '+91 98450 00000',
  },
];

const defaultStats = {
  totalTutors: 2,
  totalDepartments: 2,
  activeStudents: 2,
  totalCourses: 4,
};

const defaultStaffDistribution = {
  totalStaff: 4,
  data: [
    { role: 'Account & Marketing', count: 2, percentage: 50 },
    { role: 'Tutor', count: 2, percentage: 50 },
  ],
};

const defaultFinancialOverview: FinancialOverviewItem[] = [
  { month: 'May', income: 0, expense: 6500 },
  { month: 'Jun', income: 24500, expense: 6500 },
  { month: 'Jul', income: 0, expense: 6500 },
  { month: 'Aug', income: 0, expense: 6500 },
  { month: 'Sep', income: 0, expense: 6500 },
];

const defaultDepartmentBreakdown: DepartmentBreakdownItem[] = [
  { course: 'Professional Java Development Course', Aug: 0, Jul: 0, Sep: 0 },
  { course: 'Mern Programming Course', Aug: 0, Jul: 0, Sep: 0 },
  { course: 'Professional Marketing Course', Aug: 0, Jul: 0, Sep: 0 },
  { course: 'Food & Beverage Service', Aug: 0, Jul: 0, Sep: 0 },
];

const defaultCoursesList = [
  {
    id: 'course-1',
    title: 'Food & Beverage Management',
    price: 951,
    description: 'Course Description: This course provides a practical introduction to the food and beverage...',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
    averageRating: 0.0,
    ratingCount: 0,
    liveClassesCount: 8,
    department: 'Hospitality Management',
    duration: '6 Months',
    enrolledStudents: 8,
  },
  {
    id: 'course-2',
    title: 'Professional Java Development Course',
    price: 76071,
    description: 'Learn Java programming from basics to advanced concepts with structured payments and hands-...',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    averageRating: 0.0,
    ratingCount: 0,
    liveClassesCount: 8,
    department: 'Computer Science',
    duration: '6 Months',
    enrolledStudents: 24,
  },
  {
    id: 'course-3',
    title: 'Professional Marketing Course',
    price: 57053,
    description: 'Learn marketing with fixed payment dates.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    averageRating: 4.0,
    ratingCount: 1,
    liveClassesCount: 8,
    department: 'Business & Management',
    duration: '3 Months',
    enrolledStudents: 12,
  },
  {
    id: 'course-4',
    title: 'Mern Programming',
    price: 4754,
    description: 'Master Mernfrom scratch — build logic, projects, and real-world applications.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
    averageRating: 5.0,
    ratingCount: 1,
    liveClassesCount: 8,
    department: 'Web Engineering',
    duration: '4 Months',
    enrolledStudents: 18,
  },
];

const initialState: InstituteState = {
  stats: defaultStats,
  leaves: [],
  batches: [],
  staff: [],
  courses: defaultCoursesList,
  departments: [],
  admissionRequests: defaultAdmissionRequests,
  certificates: [],
  staffDistribution: defaultStaffDistribution,
  financialOverview: defaultFinancialOverview,
  departmentBreakdown: defaultDepartmentBreakdown,
  currentAdmission: null,
  notifications: [],
  unreadCount: 0,
  settings: null,
  loading: false,
  error: null,
};

export const fetchInstituteDashboard = createAsyncThunk(
  'institute/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const [statsRes, leavesRes, batchesRes, staffDistRes, finRes, deptBreakRes] = await Promise.all([
        instituteApi.getStats().catch(() => ({ data: defaultStats })),
        instituteApi.getLeaves().catch(() => ({ data: [] })),
        instituteApi.getAllBatches().catch(() => ({ data: [] })),
        instituteApi.getStaffDistribution().catch(() => ({ data: defaultStaffDistribution.data })),
        instituteApi.getFinancialOverview().catch(() => ({ data: defaultFinancialOverview })),
        instituteApi.getDepartmentBreakdown().catch(() => ({ data: defaultDepartmentBreakdown })),
      ]);

      const rawStats = (statsRes as any)?.data || statsRes || defaultStats;
      const rawStaffDist = (staffDistRes as any)?.data || staffDistRes;
      const rawFin = (finRes as any)?.data || finRes;
      const rawDeptBreak = (deptBreakRes as any)?.data || deptBreakRes;

      return {
        stats: rawStats?.totalTutors !== undefined ? rawStats : defaultStats,
        leaves: (leavesRes as any)?.data || leavesRes || [],
        batches: (batchesRes as any)?.data || batchesRes || [],
        staffDistribution: Array.isArray(rawStaffDist) && rawStaffDist.length > 0
          ? { totalStaff: rawStaffDist.reduce((a: number, b: any) => a + (b.count || 0), 0), data: rawStaffDist }
          : defaultStaffDistribution,
        financialOverview: Array.isArray(rawFin) && rawFin.length > 0 ? rawFin : defaultFinancialOverview,
        departmentBreakdown: Array.isArray(rawDeptBreak) && rawDeptBreak.length > 0 ? rawDeptBreak : defaultDepartmentBreakdown,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load institute dashboard');
    }
  }
);

export const fetchAdmissionRequests = createAsyncThunk(
  'institute/fetchAdmissionRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await instituteApi.getAdmissionRequests();
      const rawData = (response as any)?.data || response;
      return Array.isArray(rawData) ? rawData : (response as any)?.admissionRequests || [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch admission requests'
      );
    }
  }
);

export const fetchAdmissionRequestById = createAsyncThunk(
  'institute/fetchAdmissionRequestById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await instituteApi.getAdmissionRequestById(id);
      return (response as any)?.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch admission request details'
      );
    }
  }
);

export const updateAdmissionStatus = createAsyncThunk(
  'institute/updateAdmissionStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await instituteApi.updateAdmissionStatus(id, status);
      return { id, status, data: response };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update admission status'
      );
    }
  }
);

export const fetchInstituteCourses = createAsyncThunk(
  'institute/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await instituteApi.getAllCourses();
      const rawData = (response as any)?.data || response;
      return Array.isArray(rawData) ? rawData : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch courses'
      );
    }
  }
);

export const fetchInstituteStaff = createAsyncThunk(
  'institute/fetchStaff',
  async (search: string | undefined, { rejectWithValue }) => {
    try {
      const response = await instituteApi.getAllStaff(search);
      const rawData = (response as any)?.data || response;
      return Array.isArray(rawData) ? rawData : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch staff'
      );
    }
  }
);

export const addStaffThunk = createAsyncThunk(
  'institute/addStaff',
  async (staffData: any, { rejectWithValue }) => {
    try {
      const response = await instituteApi.addStaff(staffData);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add staff'
      );
    }
  }
);

export const updateStaffThunk = createAsyncThunk(
  'institute/updateStaff',
  async ({ id, staffData }: { id: string; staffData: any }, { rejectWithValue }) => {
    try {
      const response = await instituteApi.updateStaff(id, staffData);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update staff'
      );
    }
  }
);

export const deleteStaffThunk = createAsyncThunk(
  'institute/deleteStaff',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await instituteApi.deleteStaff(id);
      return { id, message: response?.message || 'Staff deleted successfully' };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete staff'
      );
    }
  }
);

export const fetchInstituteDepartments = createAsyncThunk(
  'institute/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await instituteApi.getDepartments();
      const rawData = (response as any)?.data || response;
      return Array.isArray(rawData) ? rawData : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch departments'
      );
    }
  }
);

export const fetchInstituteBatches = createAsyncThunk(
  'institute/fetchBatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await instituteApi.getAllBatches();
      const rawData = (response as any)?.data || response;
      return Array.isArray(rawData) ? rawData : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch batches'
      );
    }
  }
);

export const createBatchThunk = createAsyncThunk(
  'institute/createBatch',
  async (batchData: any, { rejectWithValue, dispatch }) => {
    try {
      const response = await instituteApi.createBatch(batchData);
      dispatch(fetchInstituteBatches());
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create batch'
      );
    }
  }
);

export const updateBatchThunk = createAsyncThunk(
  'institute/updateBatch',
  async ({ id, batchData }: { id: string; batchData: any }, { rejectWithValue, dispatch }) => {
    try {
      const response = await instituteApi.updateBatch(id, batchData);
      dispatch(fetchInstituteBatches());
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update batch'
      );
    }
  }
);

export const deleteBatchThunk = createAsyncThunk(
  'institute/deleteBatch',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await instituteApi.deleteBatch(id);
      dispatch(fetchInstituteBatches());
      return { id, message: response?.message || 'Batch deleted successfully' };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete batch'
      );
    }
  }
);

export const fetchBatchByIdThunk = createAsyncThunk(
  'institute/fetchBatchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await instituteApi.getBatchById(id);
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch batch details'
      );
    }
  }
);

export const fetchInstituteLeaves = createAsyncThunk(
  'institute/fetchLeaves',
  async (_, { rejectWithValue }) => {
    try {
      const response = await instituteApi.getLeaves();
      const rawData = (response as any)?.data || response;
      return Array.isArray(rawData) ? rawData : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch leave requests'
      );
    }
  }
);

export const updateLeaveStatusThunk = createAsyncThunk(
  'institute/updateLeaveStatus',
  async (
    { leaveId, status }: { leaveId: string; status: 'Approved' | 'Rejected' },
    { rejectWithValue, dispatch }
  ) => {
    try {
      await instituteApi.updateLeaveStatus(leaveId, status);
      // Re-fetch to ensure live sync with backend
      dispatch(fetchInstituteLeaves());
      return { leaveId, status };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update leave status'
      );
    }
  }
);

export const approveLeaveRequest = createAsyncThunk(
  'institute/approveLeave',
  async (leaveId: string, { rejectWithValue, dispatch }) => {
    try {
      await instituteApi.approveLeave(leaveId);
      dispatch(fetchInstituteLeaves());
      return leaveId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve leave');
    }
  }
);

export const rejectLeaveRequest = createAsyncThunk(
  'institute/rejectLeave',
  async ({ leaveId, reason }: { leaveId: string; reason?: string }, { rejectWithValue, dispatch }) => {
    try {
      await instituteApi.rejectLeave(leaveId, reason);
      dispatch(fetchInstituteLeaves());
      return leaveId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject leave');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'institute/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsApi.getInstituteNotifications();
      const list = response?.data || response?.notifications || response || [];
      return Array.isArray(list) ? list : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch notifications'
      );
    }
  }
);

export const readNotification = createAsyncThunk(
  'institute/readNotification',
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await notificationsApi.markRead(id);
      return { id, data: response?.data || response };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark notification as read'
      );
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'institute/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsApi.markAllRead();
      return response?.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to mark all notifications as read'
      );
    }
  }
);

export const fetchInstituteSettings = createAsyncThunk(
  'institute/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await instituteApi.getSettings();
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch institute settings'
      );
    }
  }
);

export const updateInstituteSettings = createAsyncThunk(
  'institute/updateSettings',
  async (settingsData: any, { rejectWithValue, dispatch }) => {
    try {
      const response = await instituteApi.updateSettings(settingsData);
      dispatch(fetchInstituteSettings());
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update institute settings'
      );
    }
  }
);

const instituteSlice = createSlice({
  name: 'institute',
  initialState,
  reducers: {
    resetInstituteState: () => initialState,
    setCurrentAdmission: (state, action) => {
      state.currentAdmission = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstituteDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstituteDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.leaves = action.payload.leaves;
        state.batches = action.payload.batches;
        state.staffDistribution = action.payload.staffDistribution;
        state.financialOverview = action.payload.financialOverview;
        state.departmentBreakdown = action.payload.departmentBreakdown;
      })
      .addCase(fetchInstituteDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdmissionRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdmissionRequests.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.admissionRequests = action.payload;
        }
      })
      .addCase(fetchAdmissionRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAdmissionRequestById.fulfilled, (state, action) => {
        state.currentAdmission = action.payload;
      })
      .addCase(updateAdmissionStatus.fulfilled, (state, action) => {
        const item = state.admissionRequests.find(
          (a) => (a.id || a._id) === action.payload.id
        );
        if (item) {
          item.status = action.payload.status;
        }
        if (state.currentAdmission && (state.currentAdmission.id || state.currentAdmission._id) === action.payload.id) {
          state.currentAdmission.status = action.payload.status;
        }
      })
      .addCase(fetchInstituteCourses.fulfilled, (state, action) => {
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.courses = action.payload;
        }
      })
      .addCase(fetchInstituteStaff.fulfilled, (state, action) => {
        state.staff = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(deleteStaffThunk.fulfilled, (state, action) => {
        state.staff = state.staff.filter((s: any) => (s.id || s._id) !== action.payload.id);
      })
      .addCase(addStaffThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.staff = [action.payload, ...state.staff];
        }
      })
      .addCase(updateStaffThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        if (updated) {
          const idx = state.staff.findIndex((s: any) => (s.id || s._id) === (updated.id || updated._id));
          if (idx !== -1) {
            state.staff[idx] = { ...state.staff[idx], ...updated };
          }
        }
      })
      .addCase(fetchInstituteDepartments.fulfilled, (state, action) => {
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.departments = action.payload;
        }
      })
      .addCase(fetchInstituteBatches.fulfilled, (state, action) => {
        if (Array.isArray(action.payload) && action.payload.length > 0) {
          state.batches = action.payload;
        }
      })
      .addCase(fetchInstituteLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstituteLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.leaves = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchInstituteLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateLeaveStatusThunk.fulfilled, (state, action) => {
        const leave = state.leaves.find((l) => (l.id || l._id) === action.payload.leaveId);
        if (leave) {
          leave.status = action.payload.status;
        }
      })
      .addCase(approveLeaveRequest.fulfilled, (state, action) => {
        const leave = state.leaves.find((l) => (l.id || l._id) === action.payload);
        if (leave) leave.status = 'Approved';
      })
      .addCase(rejectLeaveRequest.fulfilled, (state, action) => {
        const leave = state.leaves.find((l) => (l.id || l._id) === action.payload);
        if (leave) leave.status = 'Rejected';
      })
      // Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter((n: AppNotification) => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(readNotification.fulfilled, (state, action) => {
        const item = state.notifications.find(
          (n) => (n.id || n._id) === action.payload.id
        );
        if (item && !item.isRead) {
          item.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({
          ...n,
          isRead: true,
        }));
        state.unreadCount = 0;
      })
      // Settings
      .addCase(fetchInstituteSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInstituteSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchInstituteSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateInstituteSettings.fulfilled, (state, action) => {
        if (action.payload) {
          state.settings = action.payload;
        }
      })
      .addMatcher(
        (action) =>
          action.type === 'auth/logout/fulfilled' ||
          action.type === 'auth/logout/rejected' ||
          action.type === 'auth/forceLogout',
        () => initialState
      );
  },
});

export const { resetInstituteState, setCurrentAdmission } = instituteSlice.actions;
export default instituteSlice.reducer;
