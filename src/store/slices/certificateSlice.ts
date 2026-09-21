import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { certificateApi } from '../../shared/api/certificateApi';
import {
  CertificateStats,
  CertificateRequest,
  CertificateTemplate,
  IssuedCertificate,
} from '../../shared/types';

interface CertificateState {
  stats: CertificateStats;
  requests: CertificateRequest[];
  templates: CertificateTemplate[];
  certificates: IssuedCertificate[];
  selectedTemplate: CertificateTemplate | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialStats: CertificateStats = {
  pendingRequests: 0,
  approvedRequests: 0,
  templatesCount: 0,
  generatedCertificates: 0,
};

const initialState: CertificateState = {
  stats: initialStats,
  requests: [],
  templates: [],
  certificates: [],
  selectedTemplate: null,
  loading: false,
  error: null,
  success: false,
};

export const fetchCertificateStats = createAsyncThunk(
  'certificate/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await certificateApi.getStats();
      const raw = (response as any)?.data || response;
      return raw || initialStats;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch certificate statistics'
      );
    }
  }
);

export const fetchCertificateRequests = createAsyncThunk(
  'certificate/fetchRequests',
  async (status: string | null | undefined, { rejectWithValue }) => {
    try {
      const response = await certificateApi.getRequests(status);
      const raw = (response as any)?.data || response;
      return Array.isArray(raw) ? raw : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch certificate requests'
      );
    }
  }
);

export const approveCertificateRequestThunk = createAsyncThunk(
  'certificate/approveRequest',
  async (
    {
      requestId,
      data,
    }: {
      requestId: string;
      data: { status: 'approved' | 'rejected' | string; statusReason?: string };
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await certificateApi.approveRequest(requestId, data);
      dispatch(fetchCertificateRequests(null));
      dispatch(fetchCertificateStats());
      return response.data || { requestId, ...data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to review request'
      );
    }
  }
);

export const bulkApproveCertificateRequestsThunk = createAsyncThunk(
  'certificate/bulkApproveRequests',
  async (
    data: {
      requestIds: string[];
      status: 'approved' | 'rejected' | string;
      statusReason?: string;
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await certificateApi.bulkApproveRequests(data);
      dispatch(fetchCertificateRequests(null));
      dispatch(fetchCertificateStats());
      return response.data || data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to perform bulk action'
      );
    }
  }
);

export const fetchCertificateTemplates = createAsyncThunk(
  'certificate/fetchTemplates',
  async (status: string | null | undefined, { rejectWithValue }) => {
    try {
      const response = await certificateApi.getTemplates(status);
      const raw = (response as any)?.data || response;
      return Array.isArray(raw) ? raw : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch certificate templates'
      );
    }
  }
);

export const createCertificateTemplateThunk = createAsyncThunk(
  'certificate/createTemplate',
  async (templateData: any, { rejectWithValue, dispatch }) => {
    try {
      const response = await certificateApi.createTemplate(templateData);
      dispatch(fetchCertificateTemplates(null));
      dispatch(fetchCertificateStats());
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create certificate template'
      );
    }
  }
);

export const deleteCertificateTemplateThunk = createAsyncThunk(
  'certificate/deleteTemplate',
  async (templateId: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await certificateApi.deleteTemplate(templateId);
      dispatch(fetchCertificateTemplates(null));
      dispatch(fetchCertificateStats());
      return { templateId, message: response?.message || 'Template deleted' };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete template'
      );
    }
  }
);

export const fetchIssuedCertificates = createAsyncThunk(
  'certificate/fetchCertificates',
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      const response = await certificateApi.getCertificates(params);
      const raw = (response as any)?.data || response;
      return Array.isArray(raw) ? raw : [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch issued certificates'
      );
    }
  }
);

export const generateCertificateThunk = createAsyncThunk(
  'certificate/generateCertificate',
  async (
    data: {
      studentId: string;
      courseId: string;
      batchId: string;
      templateId: string;
      certificateType?: string;
      issueDate?: string;
      issuedBy: string;
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const response = await certificateApi.generateCertificate(data);
      dispatch(fetchIssuedCertificates(undefined));
      dispatch(fetchCertificateStats());
      return response.data || response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to generate certificate'
      );
    }
  }
);

export const deleteIssuedCertificateThunk = createAsyncThunk(
  'certificate/deleteCertificate',
  async (certificateId: string, { rejectWithValue, dispatch }) => {
    try {
      const response = await certificateApi.deleteCertificate(certificateId);
      dispatch(fetchIssuedCertificates(undefined));
      dispatch(fetchCertificateStats());
      return { certificateId, message: response?.message || 'Certificate deleted' };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete certificate'
      );
    }
  }
);

const certificateSlice = createSlice({
  name: 'certificate',
  initialState,
  reducers: {
    clearCertificateError: (state) => {
      state.error = null;
    },
    resetCertificateState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Stats
      .addCase(fetchCertificateStats.fulfilled, (state, action) => {
        state.stats = action.payload || initialStats;
      })
      // Requests
      .addCase(fetchCertificateRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCertificateRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCertificateRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Templates
      .addCase(fetchCertificateTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCertificateTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCertificateTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Certificates
      .addCase(fetchIssuedCertificates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIssuedCertificates.fulfilled, (state, action) => {
        state.loading = false;
        state.certificates = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchIssuedCertificates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Logout handler
      .addMatcher(
        (action) =>
          action.type === 'auth/logout/fulfilled' ||
          action.type === 'auth/logout/rejected' ||
          action.type === 'auth/forceLogout',
        () => initialState
      );
  },
});

export const { clearCertificateError, resetCertificateState } = certificateSlice.actions;
export default certificateSlice.reducer;
