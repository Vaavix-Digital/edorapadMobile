import { api } from './client';
import { API_ENDPOINTS } from '../constants/endpoints';

export interface DashboardSummaryResponse {
  revenue?: {
    totalVolume?: number;
    netEarnings?: number;
  };
  pendingDues?: number;
  activeStudents?: number;
  payroll?: {
    netPayroll?: number;
    totalPF?: number;
  };
  currency?: string;
}

export interface FeeTrendPoint {
  month: string;
  collected: number;
  netEarnings: number;
}

export interface ExpenseTrendData {
  salaryPercentage: number;
  incomePercentage: number;
}

export interface RecentPaymentItem {
  id?: string;
  studentName: string;
  courseName: string;
  batch: string;
  amount: number;
  currency?: string;
  date: string;
  status: string;
}

export interface PayrollSummaryItem {
  id?: string;
  staffName: string;
  staffId: string;
  course: string;
  amount: number;
  currency?: string;
  date: string;
  status: string;
}

export const accountApi = {
  // ─── Dashboard ─────────────────────────────────────────────────────────────
  getDashboardSummary: async (): Promise<{ success: boolean; data: DashboardSummaryResponse }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.DASHBOARD);
    return response.data;
  },

  getFeeTrend: async (): Promise<{ success: boolean; data: FeeTrendPoint[] }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.FEE_TREND);
    return response.data;
  },

  getExpenseTrend: async (): Promise<{ success: boolean; data: ExpenseTrendData }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.EXPENSE_TREND);
    return response.data;
  },

  getRecentPayments: async (): Promise<RecentPaymentItem[] | { data: RecentPaymentItem[] }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.RECENT_PAYMENTS);
    return response.data;
  },

  getPayrollSummary: async (): Promise<PayrollSummaryItem[] | { data: PayrollSummaryItem[] }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.PAYROLL_SUMMARY);
    return response.data;
  },

  // ─── Fees ───────────────────────────────────────────────────────────────────
  getFeeFilters: async (): Promise<{ success: boolean; data: { courses: any[]; batches: any[] } }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.FEES_FILTERS);
    return response.data;
  },

  getPaidFees: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.FEES_PAID);
    return response.data;
  },

  getDueFees: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.FEES_DUE);
    return response.data;
  },

  getFeeDetails: async (id: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.FEE_DETAILS(id));
    return response.data;
  },

  getStudentPaymentHistory: async (studentId: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.STUDENT_PAYMENT_HISTORY(studentId));
    return response.data;
  },

  sendPaymentReminder: async (installmentId: string): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.ACCOUNTS_MARKETING.REMIND_FEE(installmentId));
    return response.data;
  },

  // ─── Salary Management ─────────────────────────────────────────────────────
  getSalaryFilters: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.SALARY_FILTERS);
    return response.data;
  },

  getPendingSalaries: async (params?: { month?: number; year?: number }): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.SALARY_PENDING, { params });
    return response.data;
  },

  getPaidSalaries: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.SALARY_PAID);
    return response.data;
  },

  getApprovedSalaries: async (params?: { month?: number; year?: number }): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.SALARY_APPROVED, { params });
    return response.data;
  },

  getSalaryDetails: async (staffId: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.SALARY_DETAILS(staffId));
    return response.data;
  },

  getSalaryCalculation: async (staffId: string, params?: { month?: number; year?: number; recordId?: string }): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.SALARY_CALCULATE(staffId), { params });
    return response.data;
  },

  approveSalaries: async (payload: any): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.ACCOUNTS_MARKETING.SALARY_APPROVE, payload);
    return response.data;
  },

  paySalary: async (payload: { recordId: string; paymentMethod: string; transactionRef?: string }): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.ACCOUNTS_MARKETING.SALARY_PAY, payload);
    return response.data;
  },

  getStaffAttendanceStats: async (staffId: string): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.STAFF_ATTENDANCE_STATS(staffId));
    return response.data;
  },

  getStaffAttendanceCalendar: async (staffId: string, params?: { month?: number; year?: number }): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.STAFF_ATTENDANCE_CALENDAR(staffId), { params });
    return response.data;
  },

  // ─── Staff & Courses ───────────────────────────────────────────────────────
  getAllStaff: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.STAFF_ALL);
    return response.data;
  },

  addStaff: async (staffData: any): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.ACCOUNTS_MARKETING.STAFF_ADD, staffData);
    return response.data;
  },

  getDepartments: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.DEPARTMENTS);
    return response.data;
  },

  getCourses: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.COURSES);
    return response.data;
  },

  // ─── Settings & Profile ────────────────────────────────────────────────────
  getAccountSettings: async (): Promise<{ success: boolean; data: any }> => {
    const response = await api.get(API_ENDPOINTS.ACCOUNTS_MARKETING.SETTINGS);
    return response.data;
  },

  updateBankDetails: async (bankData: any): Promise<any> => {
    const response = await api.patch(API_ENDPOINTS.ACCOUNTS_MARKETING.SETTINGS_BANK, bankData);
    return response.data;
  },

  updateProfile: async (profileData: FormData | any): Promise<any> => {
    const headers = profileData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
    const response = await api.patch(API_ENDPOINTS.ACCOUNTS_MARKETING.SETTINGS_PROFILE, profileData, { headers });
    return response.data;
  },

  updateAlertPreferences: async (alertData: any): Promise<any> => {
    const response = await api.patch(API_ENDPOINTS.ACCOUNTS_MARKETING.SETTINGS_ALERTS, alertData);
    return response.data;
  },

  // ─── Marketing Broadcast ───────────────────────────────────────────────────
  createMarketingBroadcast: async (broadcastData: FormData | any): Promise<any> => {
    const headers = broadcastData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
    const response = await api.post(API_ENDPOINTS.ACCOUNTS_MARKETING.MARKETING_BROADCAST, broadcastData, { headers });
    return response.data;
  },
};
