import { api } from './client';
import { API_ENDPOINTS } from '../constants/endpoints';
import { MonthlyAttendanceStats, StaffMonthlyReportData } from '../types';

export const attendanceApi = {
  getAllStaff: async (): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.INSTITUTE.STAFF_ALL);
    return response.data;
  },

  getDailyWorksheet: async (date: string): Promise<{
    success: boolean;
    data: any[];
    totalStaffs?: number;
    presentCount?: number;
    absentCount?: number;
    leaveCount?: number;
  }> => {
    const response = await api.get(API_ENDPOINTS.ATTENDANCE.DAILY_WORKSHEET(date));
    return response.data;
  },

  markStaffAttendance: async (attendanceData: {
    staffId: string;
    date: string;
    status: string;
    inTime?: string;
    outTime?: string;
    remarks?: string;
  }): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.ATTENDANCE.MARK_STAFF, attendanceData);
    return response.data;
  },

  bulkMarkStaffAttendance: async (payload: {
    date: string;
    records: Array<{
      staffId: string;
      status: string;
      inTime?: string;
      outTime?: string;
      remarks?: string;
    }>;
  }): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.ATTENDANCE.BULK_MARK_STAFF, payload);
    return response.data;
  },

  getAllStaffMonthlyReport: async (
    month: string | number,
    year: string | number
  ): Promise<StaffMonthlyReportData & { success: boolean }> => {
    const response = await api.get(API_ENDPOINTS.ATTENDANCE.ALL_STAFF_MONTHLY(month, year));
    return response.data;
  },

  markStudentAttendance: async (attendanceData: {
    studentId: string;
    batchId: string;
    date: string;
    status: string;
    remarks?: string;
  }): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.ATTENDANCE.MARK_STUDENT, attendanceData);
    return response.data;
  },

  bulkMarkStudentAttendance: async (payload: {
    batchId: string;
    date: string;
    attendanceList: Array<{ studentId: string; status: string; remarks?: string }>;
  }): Promise<any> => {
    const response = await api.post(API_ENDPOINTS.ATTENDANCE.BULK_MARK_STUDENT, payload);
    return response.data;
  },

  getBatchMonthlyAttendance: async (
    batchId: string,
    month: number,
    year: number
  ): Promise<{ success: boolean; data: MonthlyAttendanceStats }> => {
    const response = await api.get(API_ENDPOINTS.ATTENDANCE.BATCH_MONTHLY(batchId, month, year));
    return response.data;
  },

  getBatchDailyAttendance: async (
    batchId: string,
    date: string
  ): Promise<{ success: boolean; data: any[] }> => {
    const response = await api.get(API_ENDPOINTS.ATTENDANCE.BATCH_DAILY(batchId, date));
    return response.data;
  }
};
