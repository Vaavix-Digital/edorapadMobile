import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  accountApi,
  DashboardSummaryResponse,
  FeeTrendPoint,
  ExpenseTrendData,
  RecentPaymentItem,
  PayrollSummaryItem,
} from '../../shared/api/accountApi';

export interface AccountState {
  // Dashboard state
  dashboardSummary: DashboardSummaryResponse | null;
  feeTrend: FeeTrendPoint[];
  expenseTrend: ExpenseTrendData | null;
  recentPayments: RecentPaymentItem[];
  payrollSummary: PayrollSummaryItem[];
  dashboardLoading: boolean;
  feeTrendLoading: boolean;
  expenseTrendLoading: boolean;
  paymentsLoading: boolean;
  payrollLoading: boolean;

  // Fees state
  paidFees: any[];
  dueFees: any[];
  feeFilters: { courses: any[]; batches: any[] };
  feeDetails: any | null;
  studentPaymentHistory: any | null;
  paidFeesLoading: boolean;
  dueFeesLoading: boolean;
  feeFiltersLoading: boolean;
  feeDetailsLoading: boolean;
  historyLoading: boolean;
  reminderLoading: boolean;

  // Salary state
  salaryFilters: any | null;
  pendingSalaries: any[];
  paidSalaries: any[];
  approvedSalaries: any[];
  salaryDetails: any | null;
  salaryCalculation: any | null;
  staffAttendanceStats: any | null;
  staffAttendanceCalendar: any | null;
  pendingSalariesLoading: boolean;
  paidSalariesLoading: boolean;
  approvedSalariesLoading: boolean;
  salaryDetailsLoading: boolean;
  salaryCalculationLoading: boolean;
  approveActionLoading: boolean;
  payActionLoading: boolean;

  // Staff state
  staff: any[];
  departments: any[];
  courses: any[];
  fetchStaffLoading: boolean;
  addStaffLoading: boolean;

  // Settings & Profile
  settings: any | null;
  settingsLoading: boolean;
  settingsSuccess: boolean;
  error: string | null;
}

// Fallback initial trend matching web dashboard
const DEFAULT_FEE_TREND: FeeTrendPoint[] = [
  { month: 'Jan', collected: 0, netEarnings: 0 },
  { month: 'Feb', collected: 0, netEarnings: 0 },
  { month: 'Mar', collected: 0, netEarnings: 0 },
  { month: 'Apr', collected: 0, netEarnings: 0 },
  { month: 'May', collected: 1200, netEarnings: 1000 },
  { month: 'Jun', collected: 28957, netEarnings: 24591 },
  { month: 'Jul', collected: 0, netEarnings: 0 },
  { month: 'Aug', collected: 0, netEarnings: 0 },
  { month: 'Sep', collected: 0, netEarnings: 0 },
];

const DEFAULT_DASHBOARD_SUMMARY: DashboardSummaryResponse = {
  revenue: {
    totalVolume: 30157.22,
    netEarnings: 25591.14,
  },
  pendingDues: 1100,
  activeStudents: 3,
  payroll: {
    netPayroll: 6172.55,
    totalPF: 1039.44,
  },
  currency: 'usd',
};

const DEFAULT_EXPENSE_TREND: ExpenseTrendData = {
  salaryPercentage: 100,
  incomePercentage: 0,
};

const DEFAULT_RECENT_PAYMENTS: RecentPaymentItem[] = [
  {
    studentName: 'Shrihari Nambiar p',
    courseName: 'MERN Stack Development',
    batch: 'Batch A - 2026',
    amount: 15000,
    currency: 'USD',
    date: '15 Jun 2026',
    status: 'PAID',
  },
  {
    studentName: 'Ananya Sharma',
    courseName: 'Full Stack Python',
    batch: 'Batch B - 2026',
    amount: 15157.22,
    currency: 'USD',
    date: '10 Jun 2026',
    status: 'PAID',
  },
];

const DEFAULT_PAYROLL_SUMMARY: PayrollSummaryItem[] = [
  {
    staffName: 'Prof. David Miller',
    staffId: 'STF-001',
    course: 'Computer Science',
    amount: 3200,
    currency: 'USD',
    date: '01 Jun 2026',
    status: 'PAID',
  },
  {
    staffName: 'Dr. Sarah Connor',
    staffId: 'STF-002',
    course: 'Web Development',
    amount: 2972.55,
    currency: 'USD',
    date: '01 Jun 2026',
    status: 'PAID',
  },
];

const initialState: AccountState = {
  dashboardSummary: DEFAULT_DASHBOARD_SUMMARY,
  feeTrend: DEFAULT_FEE_TREND,
  expenseTrend: DEFAULT_EXPENSE_TREND,
  recentPayments: DEFAULT_RECENT_PAYMENTS,
  payrollSummary: DEFAULT_PAYROLL_SUMMARY,
  dashboardLoading: false,
  feeTrendLoading: false,
  expenseTrendLoading: false,
  paymentsLoading: false,
  payrollLoading: false,

  paidFees: [],
  dueFees: [],
  feeFilters: { courses: [], batches: [] },
  feeDetails: null,
  studentPaymentHistory: null,
  paidFeesLoading: false,
  dueFeesLoading: false,
  feeFiltersLoading: false,
  feeDetailsLoading: false,
  historyLoading: false,
  reminderLoading: false,

  salaryFilters: null,
  pendingSalaries: [],
  paidSalaries: [],
  approvedSalaries: [],
  salaryDetails: null,
  salaryCalculation: null,
  staffAttendanceStats: null,
  staffAttendanceCalendar: null,
  pendingSalariesLoading: false,
  paidSalariesLoading: false,
  approvedSalariesLoading: false,
  salaryDetailsLoading: false,
  salaryCalculationLoading: false,
  approveActionLoading: false,
  payActionLoading: false,

  staff: [],
  departments: [],
  courses: [],
  fetchStaffLoading: false,
  addStaffLoading: false,

  settings: null,
  settingsLoading: false,
  settingsSuccess: false,
  error: null,
};

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchDashboardSummary = createAsyncThunk(
  'account/fetchDashboardSummary',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getDashboardSummary();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch summary');
    }
  }
);

export const fetchFeeTrend = createAsyncThunk(
  'account/fetchFeeTrend',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getFeeTrend();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch fee trend');
    }
  }
);

export const fetchExpenseTrend = createAsyncThunk(
  'account/fetchExpenseTrend',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getExpenseTrend();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch expense trend');
    }
  }
);

export const fetchRecentPayments = createAsyncThunk(
  'account/fetchRecentPayments',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getRecentPayments();
      return Array.isArray(res) ? res : (res as any).data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch recent payments');
    }
  }
);

export const fetchPayrollSummary = createAsyncThunk(
  'account/fetchPayrollSummary',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getPayrollSummary();
      return Array.isArray(res) ? res : (res as any).data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch payroll summary');
    }
  }
);

export const fetchFullAccountsDashboard = createAsyncThunk(
  'account/fetchFullAccountsDashboard',
  async (_, { dispatch }) => {
    await Promise.allSettled([
      dispatch(fetchDashboardSummary()),
      dispatch(fetchFeeTrend()),
      dispatch(fetchExpenseTrend()),
      dispatch(fetchRecentPayments()),
      dispatch(fetchPayrollSummary()),
    ]);
  }
);

export const fetchFeeFilters = createAsyncThunk(
  'account/fetchFeeFilters',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getFeeFilters();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch fee filters');
    }
  }
);

export const fetchPaidFees = createAsyncThunk(
  'account/fetchPaidFees',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getPaidFees();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch paid fees');
    }
  }
);

export const fetchDueFees = createAsyncThunk(
  'account/fetchDueFees',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getDueFees();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch due fees');
    }
  }
);

export const fetchFeeDetails = createAsyncThunk(
  'account/fetchFeeDetails',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await accountApi.getFeeDetails(id);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch fee details');
    }
  }
);

export const fetchStudentPaymentHistory = createAsyncThunk(
  'account/fetchStudentPaymentHistory',
  async (studentId: string, { rejectWithValue }) => {
    try {
      const res = await accountApi.getStudentPaymentHistory(studentId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch payment history');
    }
  }
);

export const sendPaymentReminder = createAsyncThunk(
  'account/sendPaymentReminder',
  async (installmentId: string, { rejectWithValue }) => {
    try {
      const res = await accountApi.sendPaymentReminder(installmentId);
      return { installmentId, ...res };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send reminder');
    }
  }
);

export const fetchSalaryFilters = createAsyncThunk(
  'account/fetchSalaryFilters',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getSalaryFilters();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch salary filters');
    }
  }
);

export const fetchPendingSalaries = createAsyncThunk(
  'account/fetchPendingSalaries',
  async (params: { month?: number; year?: number } | undefined, { rejectWithValue }) => {
    try {
      const res = await accountApi.getPendingSalaries(params);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch pending salaries');
    }
  }
);

export const fetchPaidSalaries = createAsyncThunk(
  'account/fetchPaidSalaries',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getPaidSalaries();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch paid salaries');
    }
  }
);

export const fetchApprovedSalaries = createAsyncThunk(
  'account/fetchApprovedSalaries',
  async (params: { month?: number; year?: number } | undefined, { rejectWithValue }) => {
    try {
      const res = await accountApi.getApprovedSalaries(params);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch approved salaries');
    }
  }
);

export const fetchSalaryDetails = createAsyncThunk(
  'account/fetchSalaryDetails',
  async (staffId: string, { rejectWithValue }) => {
    try {
      const res = await accountApi.getSalaryDetails(staffId);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch salary details');
    }
  }
);

export const fetchSalaryCalculation = createAsyncThunk(
  'account/fetchSalaryCalculation',
  async ({ staffId, month, year, recordId }: { staffId: string; month?: number; year?: number; recordId?: string }, { rejectWithValue }) => {
    try {
      const res = await accountApi.getSalaryCalculation(staffId, { month, year, recordId });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch salary calculation');
    }
  }
);

export const approveSalaries = createAsyncThunk(
  'account/approveSalaries',
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await accountApi.approveSalaries(payload);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to approve salaries');
    }
  }
);

export const paySalary = createAsyncThunk(
  'account/paySalary',
  async (payload: { recordId: string; paymentMethod: string; transactionRef?: string }, { rejectWithValue }) => {
    try {
      const res = await accountApi.paySalary(payload);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to pay salary');
    }
  }
);

export const fetchAllStaff = createAsyncThunk(
  'account/fetchAllStaff',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getAllStaff();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch staff');
    }
  }
);

export const addStaff = createAsyncThunk(
  'account/addStaff',
  async (staffData: any, { rejectWithValue }) => {
    try {
      const res = await accountApi.addStaff(staffData);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add staff');
    }
  }
);

export const fetchDepartments = createAsyncThunk(
  'account/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getDepartments();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch departments');
    }
  }
);

export const fetchCourses = createAsyncThunk(
  'account/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getCourses();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch courses');
    }
  }
);

export const fetchAccountSettings = createAsyncThunk(
  'account/fetchAccountSettings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountApi.getAccountSettings();
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch settings');
    }
  }
);

export const updateBankDetails = createAsyncThunk(
  'account/updateBankDetails',
  async (bankData: any, { rejectWithValue }) => {
    try {
      const res = await accountApi.updateBankDetails(bankData);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update bank details');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'account/updateProfile',
  async (profileData: FormData | any, { rejectWithValue }) => {
    try {
      const res = await accountApi.updateProfile(profileData);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateAlertPreferences = createAsyncThunk(
  'account/updateAlertPreferences',
  async (alertData: any, { rejectWithValue }) => {
    try {
      const res = await accountApi.updateAlertPreferences(alertData);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update alerts');
    }
  }
);

export const createMarketingBroadcast = createAsyncThunk(
  'account/createMarketingBroadcast',
  async (broadcastData: FormData | any, { rejectWithValue }) => {
    try {
      const res = await accountApi.createMarketingBroadcast(broadcastData);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create broadcast');
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────────

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    clearAccountError: (state) => {
      state.error = null;
    },
    resetSettingsSuccess: (state) => {
      state.settingsSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // Dashboard Summary
    builder.addCase(fetchDashboardSummary.pending, (state) => {
      state.dashboardLoading = true;
    });
    builder.addCase(fetchDashboardSummary.fulfilled, (state, action) => {
      state.dashboardLoading = false;
      if (action.payload) {
        state.dashboardSummary = { ...state.dashboardSummary, ...action.payload };
      }
    });
    builder.addCase(fetchDashboardSummary.rejected, (state) => {
      state.dashboardLoading = false;
    });

    // Fee Trend
    builder.addCase(fetchFeeTrend.pending, (state) => {
      state.feeTrendLoading = true;
    });
    builder.addCase(fetchFeeTrend.fulfilled, (state, action) => {
      state.feeTrendLoading = false;
      if (action.payload && action.payload.length > 0) {
        state.feeTrend = action.payload;
      }
    });
    builder.addCase(fetchFeeTrend.rejected, (state) => {
      state.feeTrendLoading = false;
    });

    // Expense Trend
    builder.addCase(fetchExpenseTrend.pending, (state) => {
      state.expenseTrendLoading = true;
    });
    builder.addCase(fetchExpenseTrend.fulfilled, (state, action) => {
      state.expenseTrendLoading = false;
      if (action.payload) {
        state.expenseTrend = action.payload;
      }
    });
    builder.addCase(fetchExpenseTrend.rejected, (state) => {
      state.expenseTrendLoading = false;
    });

    // Recent Payments
    builder.addCase(fetchRecentPayments.pending, (state) => {
      state.paymentsLoading = true;
    });
    builder.addCase(fetchRecentPayments.fulfilled, (state, action) => {
      state.paymentsLoading = false;
      if (action.payload && action.payload.length > 0) {
        state.recentPayments = action.payload;
      }
    });
    builder.addCase(fetchRecentPayments.rejected, (state) => {
      state.paymentsLoading = false;
    });

    // Payroll Summary
    builder.addCase(fetchPayrollSummary.pending, (state) => {
      state.payrollLoading = true;
    });
    builder.addCase(fetchPayrollSummary.fulfilled, (state, action) => {
      state.payrollLoading = false;
      if (action.payload && action.payload.length > 0) {
        state.payrollSummary = action.payload;
      }
    });
    builder.addCase(fetchPayrollSummary.rejected, (state) => {
      state.payrollLoading = false;
    });

    // Fees
    builder.addCase(fetchPaidFees.fulfilled, (state, action) => {
      state.paidFees = action.payload || [];
      state.paidFeesLoading = false;
    });
    builder.addCase(fetchDueFees.fulfilled, (state, action) => {
      state.dueFees = action.payload || [];
      state.dueFeesLoading = false;
    });
    builder.addCase(fetchFeeFilters.fulfilled, (state, action) => {
      state.feeFilters = action.payload || { courses: [], batches: [] };
    });
    builder.addCase(fetchFeeDetails.fulfilled, (state, action) => {
      state.feeDetails = action.payload;
    });
    builder.addCase(fetchStudentPaymentHistory.fulfilled, (state, action) => {
      state.studentPaymentHistory = action.payload;
    });

    // Salary
    builder.addCase(fetchPendingSalaries.fulfilled, (state, action) => {
      state.pendingSalaries = action.payload || [];
      state.pendingSalariesLoading = false;
    });
    builder.addCase(fetchPaidSalaries.fulfilled, (state, action) => {
      state.paidSalaries = action.payload || [];
      state.paidSalariesLoading = false;
    });
    builder.addCase(fetchApprovedSalaries.fulfilled, (state, action) => {
      state.approvedSalaries = action.payload || [];
      state.approvedSalariesLoading = false;
    });
    builder.addCase(fetchSalaryFilters.fulfilled, (state, action) => {
      state.salaryFilters = action.payload;
    });
    builder.addCase(fetchSalaryDetails.fulfilled, (state, action) => {
      state.salaryDetails = action.payload;
    });
    builder.addCase(fetchSalaryCalculation.fulfilled, (state, action) => {
      state.salaryCalculation = action.payload;
    });

    // Staff
    builder.addCase(fetchAllStaff.fulfilled, (state, action) => {
      state.staff = action.payload || [];
      state.fetchStaffLoading = false;
    });
    builder.addCase(fetchDepartments.fulfilled, (state, action) => {
      state.departments = action.payload || [];
    });
    builder.addCase(fetchCourses.fulfilled, (state, action) => {
      state.courses = action.payload || [];
    });

    // Settings
    builder.addCase(fetchAccountSettings.fulfilled, (state, action) => {
      state.settings = action.payload;
      state.settingsLoading = false;
    });
    builder.addCase(updateBankDetails.fulfilled, (state) => {
      state.settingsSuccess = true;
    });
    builder.addCase(updateProfile.fulfilled, (state) => {
      state.settingsSuccess = true;
    });
    builder.addCase(updateAlertPreferences.fulfilled, (state) => {
      state.settingsSuccess = true;
    });
  },
});

export const { clearAccountError, resetSettingsSuccess } = accountSlice.actions;
export default accountSlice.reducer;
