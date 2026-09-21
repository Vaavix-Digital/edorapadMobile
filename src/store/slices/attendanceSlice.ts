import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { attendanceApi } from '../../shared/api/attendanceApi';
import {
  AttendanceRecord,
  StaffDailyWorksheetItem,
  StaffMonthlyReportData,
  StaffAttendanceStats,
  MonthlyAttendanceStats,
} from '../../shared/types';
import { getISODateString } from '../../shared/utils/dateHelpers';

interface AttendanceState {
  attendanceRecords: AttendanceRecord[];
  dailyRecords: AttendanceRecord[]; // backward compatibility
  staffList: any[];
  selectedStaffIds: string[];
  dailyWorksheet: StaffDailyWorksheetItem[];
  stats: StaffAttendanceStats;
  monthlyReportData: StaffMonthlyReportData | null;
  monthlyStats: MonthlyAttendanceStats | null; // backward compatibility
  selectedDate: string;
  activeTab: 'mark' | 'worksheet' | 'monthly';
  loading: boolean;
  saving: boolean;
  savingStaffId: string | null;
  error: string | null;
}

const initialState: AttendanceState = {
  attendanceRecords: [],
  dailyRecords: [],
  staffList: [],
  selectedStaffIds: [],
  dailyWorksheet: [],
  stats: { total: 0, present: 0, absent: 0, leave: 0 },
  monthlyReportData: null,
  monthlyStats: null,
  selectedDate: getISODateString(),
  activeTab: 'mark',
  loading: false,
  saving: false,
  savingStaffId: null,
  error: null,
};

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchStaffAttendanceInitial = createAsyncThunk(
  'attendance/fetchStaffAttendanceInitial',
  async (date: string, { rejectWithValue }) => {
    try {
      const [staffRes, worksheetRes] = await Promise.all([
        attendanceApi.getAllStaff(),
        attendanceApi.getDailyWorksheet(date),
      ]);

      const staffData = staffRes.success ? staffRes.data : [];
      const dailyRecords = worksheetRes.success ? worksheetRes.data : [];

      const combinedRecords: AttendanceRecord[] = staffData.map((staff: any) => {
        const record = dailyRecords.find((r: any) => r.id === staff.id || r._id === staff.id);
        const att = record?.attendance;

        return {
          id: staff.id || staff._id,
          staffId: staff.id || staff._id,
          name: staff.name || `${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'Staff Member',
          customId: staff.staffCustomId || staff.customStaffId || staff.customId || 'STF001',
          role: staff.role || staff.staffRole || 'Staff',
          status: att?.status || 'Present',
          inTime: att?.inTime || null,
          outTime: att?.outTime || null,
          remarks: att?.remarks || 'On time',
          isSaved: Boolean(att),
        };
      });

      return {
        combinedRecords,
        staffData,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync staff attendance');
    }
  }
);

export const fetchDailyWorksheet = createAsyncThunk(
  'attendance/fetchDailyWorksheet',
  async (date: string, { rejectWithValue }) => {
    try {
      const res = await attendanceApi.getDailyWorksheet(date);
      if (res.success) {
        const data = res.data || [];
        const { presentCount, absentCount, leaveCount, totalStaffs } = res;
        return {
          worksheet: data,
          stats: {
            total: totalStaffs || data.length,
            present: presentCount || 0,
            absent: absentCount || 0,
            leave: leaveCount || 0,
          },
        };
      }
      return {
        worksheet: [],
        stats: { total: 0, present: 0, absent: 0, leave: 0 },
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance worksheet');
    }
  }
);

export const fetchStaffMonthlyReport = createAsyncThunk(
  'attendance/fetchStaffMonthlyReport',
  async ({ month, year }: { month: string | number; year: string | number }, { rejectWithValue }) => {
    try {
      const res = await attendanceApi.getAllStaffMonthlyReport(month, year);
      return res;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to load monthly report');
    }
  }
);

export const markSingleStaffAttendance = createAsyncThunk(
  'attendance/markSingleStaffAttendance',
  async (
    payload: {
      staffId: string;
      date: string;
      status: string;
      inTime?: string;
      outTime?: string;
      remarks?: string;
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const res = await attendanceApi.markStaffAttendance({
        staffId: payload.staffId,
        date: payload.date,
        status: payload.status,
        inTime: payload.inTime || '09:00 AM',
        outTime: payload.outTime || '05:00 PM',
        remarks: payload.remarks || 'Updated via mobile',
      });
      // Refresh to keep server data perfectly in sync
      dispatch(fetchStaffAttendanceInitial(payload.date));
      return { staffId: payload.staffId, response: res };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save staff attendance');
    }
  }
);

export const bulkMarkStaffAttendance = createAsyncThunk(
  'attendance/bulkMarkStaffAttendance',
  async (
    payload: {
      date: string;
      records: Array<{
        staffId: string;
        status: string;
        inTime?: string;
        outTime?: string;
        remarks?: string;
      }>;
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const res = await attendanceApi.bulkMarkStaffAttendance(payload);
      // Refresh to sync
      dispatch(fetchStaffAttendanceInitial(payload.date));
      return res;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk mark attendance');
    }
  }
);

// Backward compatible student bulk mark
export const submitBulkAttendance = createAsyncThunk(
  'attendance/submitBulkAttendance',
  async (
    payload: { batchId: string; date: string; attendanceList: Array<{ studentId: string; status: string; remarks?: string }> },
    { rejectWithValue }
  ) => {
    try {
      const response = await attendanceApi.bulkMarkStudentAttendance(payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save attendance');
    }
  }
);

export const fetchMonthlyAttendance = createAsyncThunk(
  'attendance/fetchMonthlyAttendance',
  async ({ batchId, month, year }: { batchId: string; month: number; year: number }, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.getBatchMonthlyAttendance(batchId, month, year);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch monthly attendance');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<'mark' | 'worksheet' | 'monthly'>) => {
      state.activeTab = action.payload;
    },
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    updateAttendanceRecordField: (
      state,
      action: PayloadAction<{ staffId: string; field: keyof AttendanceRecord; value: any }>
    ) => {
      const { staffId, field, value } = action.payload;
      const index = state.attendanceRecords.findIndex(r => r.staffId === staffId || r.id === staffId);
      if (index !== -1) {
        state.attendanceRecords[index] = {
          ...state.attendanceRecords[index],
          [field]: value,
        };
        state.dailyRecords = state.attendanceRecords;
      }
    },
    toggleStaffSelection: (state, action: PayloadAction<string>) => {
      const staffId = action.payload;
      if (state.selectedStaffIds.includes(staffId)) {
        state.selectedStaffIds = state.selectedStaffIds.filter(id => id !== staffId);
      } else {
        state.selectedStaffIds.push(staffId);
      }
    },
    selectAllStaff: (state) => {
      state.selectedStaffIds = state.attendanceRecords.map(r => r.staffId || r.id || '');
    },
    clearStaffSelection: (state) => {
      state.selectedStaffIds = [];
    },
    updateLocalRecordStatus: (state, action: PayloadAction<{ id: string; status: string }>) => {
      const { id, status } = action.payload;
      const index = state.attendanceRecords.findIndex(r => (r.id || r.studentId || r.staffId) === id);
      if (index !== -1) {
        state.attendanceRecords[index].status = status;
        state.dailyRecords = state.attendanceRecords;
      }
    },
    markAllLocalRecordsPresent: (state) => {
      state.attendanceRecords.forEach(r => {
        r.status = 'Present';
      });
      state.dailyRecords = state.attendanceRecords;
    },
    clearAttendanceError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Initial fetch (Staff list + Daily worksheet)
    builder
      .addCase(fetchStaffAttendanceInitial.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffAttendanceInitial.fulfilled, (state, action) => {
        state.loading = false;
        state.attendanceRecords = action.payload.combinedRecords;
        state.dailyRecords = action.payload.combinedRecords;
        state.staffList = action.payload.staffData;
      })
      .addCase(fetchStaffAttendanceInitial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Daily worksheet
    builder
      .addCase(fetchDailyWorksheet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyWorksheet.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyWorksheet = action.payload.worksheet;
        state.stats = action.payload.stats;
      })
      .addCase(fetchDailyWorksheet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Monthly Report
    builder
      .addCase(fetchStaffMonthlyReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffMonthlyReport.fulfilled, (state, action) => {
        state.loading = false;
        state.monthlyReportData = action.payload;
      })
      .addCase(fetchStaffMonthlyReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Single Staff Mark
    builder
      .addCase(markSingleStaffAttendance.pending, (state, action) => {
        state.savingStaffId = action.meta.arg.staffId;
        state.error = null;
      })
      .addCase(markSingleStaffAttendance.fulfilled, (state, action) => {
        state.savingStaffId = null;
        const staffId = action.payload.staffId;
        const index = state.attendanceRecords.findIndex(r => r.staffId === staffId || r.id === staffId);
        if (index !== -1) {
          state.attendanceRecords[index].isSaved = true;
        }
      })
      .addCase(markSingleStaffAttendance.rejected, (state, action) => {
        state.savingStaffId = null;
        state.error = action.payload as string;
      });

    // Bulk Staff Mark
    builder
      .addCase(bulkMarkStaffAttendance.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(bulkMarkStaffAttendance.fulfilled, (state) => {
        state.saving = false;
        state.selectedStaffIds = [];
      })
      .addCase(bulkMarkStaffAttendance.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      });

    // Student bulk mark (backward compatibility)
    builder
      .addCase(submitBulkAttendance.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(submitBulkAttendance.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(submitBulkAttendance.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMonthlyAttendance.fulfilled, (state, action) => {
        state.monthlyStats = action.payload;
      });
  },
});

export const {
  setActiveTab,
  setSelectedDate,
  updateAttendanceRecordField,
  toggleStaffSelection,
  selectAllStaff,
  clearStaffSelection,
  updateLocalRecordStatus,
  markAllLocalRecordsPresent,
  clearAttendanceError,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;

