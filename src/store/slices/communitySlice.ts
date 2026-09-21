import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { instituteApi } from '../../shared/api/instituteApi';

export interface CommunityMember {
  id: string;
  user?: { id: string; name?: string; firstName?: string; lastName?: string; profilePicture?: string };
  userId?: string;
  role?: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  coverImage?: string;
  members?: CommunityMember[];
  memberCount?: number;
  messageCount?: number;
  admins?: any[];
  creatorId?: string;
}

export interface CommunityMessage {
  id: string;
  communityId?: string;
  content?: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  createdAt?: string;
  sender?: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
  user?: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
  };
}

interface CommunityState {
  communities: Community[];
  messages: Record<string, CommunityMessage[]>;
  loading: boolean;
  messagesLoading: boolean;
  sending: boolean;
  creating: boolean;
  deleting: boolean;
  error: string | null;
}

const initialState: CommunityState = {
  communities: [],
  messages: {},
  loading: false,
  messagesLoading: false,
  sending: false,
  creating: false,
  deleting: false,
  error: null,
};

// ─── Thunks ──────────────────────────────────────────────────────────────────

export const fetchCommunities = createAsyncThunk(
  'community/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await instituteApi.getCommunities();
      const raw = (res as any)?.data || res;
      return Array.isArray(raw) ? raw : [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch communities');
    }
  }
);

export const createCommunity = createAsyncThunk(
  'community/create',
  async (formData: any, { rejectWithValue, dispatch }) => {
    try {
      const res = await instituteApi.createCommunity(formData);
      const data = res?.data || res;
      // Refresh communities list
      dispatch(fetchCommunities());
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create community');
    }
  }
);

export const addMembers = createAsyncThunk(
  'community/addMembers',
  async ({ communityId, userIds }: { communityId: string; userIds: string[] }, { rejectWithValue, dispatch }) => {
    try {
      const res = await instituteApi.addCommunityMembers(communityId, userIds);
      dispatch(fetchCommunities());
      return { communityId, data: res?.data || res };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add members');
    }
  }
);

export const deleteCommunity = createAsyncThunk(
  'community/delete',
  async (communityId: string, { rejectWithValue, dispatch }) => {
    try {
      await instituteApi.deleteCommunity(communityId);
      dispatch(fetchCommunities());
      return communityId;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete community');
    }
  }
);

export const removeMember = createAsyncThunk(
  'community/removeMember',
  async ({ communityId, userId }: { communityId: string; userId: string }, { rejectWithValue, dispatch }) => {
    try {
      await instituteApi.removeCommunityMember(communityId, userId);
      dispatch(fetchCommunities());
      return { communityId, userId };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove member');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'community/fetchMessages',
  async (communityId: string, { rejectWithValue }) => {
    try {
      const res = await instituteApi.getCommunityMessages(communityId);
      const raw = (res as any)?.data || res;
      return { communityId, messages: Array.isArray(raw) ? raw : [] };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'community/sendMessage',
  async (
    { communityId, content, formData }: { communityId: string; content?: string; formData?: any },
    { rejectWithValue }
  ) => {
    try {
      const payload = formData || { content: content || '' };
      const res = await instituteApi.sendCommunityMessage(communityId, payload);
      const raw = (res as any)?.data || res;
      return { communityId, message: raw };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send message');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    clearCommunityError: (state) => { state.error = null; },
    receiveMessage: (state, action: PayloadAction<{ communityId: string; message: CommunityMessage }>) => {
      const { communityId, message } = action.payload;
      if (!state.messages[communityId]) state.messages[communityId] = [];
      const exists = state.messages[communityId].some((m) => m.id === message.id);
      if (!exists) state.messages[communityId].push(message);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Communities
      .addCase(fetchCommunities.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCommunities.fulfilled, (state, action) => {
        state.loading = false;
        state.communities = action.payload;
      })
      .addCase(fetchCommunities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create Community
      .addCase(createCommunity.pending, (state) => { state.creating = true; state.error = null; })
      .addCase(createCommunity.fulfilled, (state, action) => {
        state.creating = false;
        if (action.payload?.id) {
          const exists = state.communities.some((c) => c.id === action.payload.id);
          if (!exists) {
            state.communities.unshift(action.payload);
          }
        }
      })
      .addCase(createCommunity.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload as string;
      })

      // Delete Community
      .addCase(deleteCommunity.pending, (state) => { state.deleting = true; })
      .addCase(deleteCommunity.fulfilled, (state, action) => {
        state.deleting = false;
        state.communities = state.communities.filter((c) => c.id !== action.payload);
        delete state.messages[action.payload];
      })
      .addCase(deleteCommunity.rejected, (state) => { state.deleting = false; })

      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => { state.messagesLoading = true; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesLoading = false;
        state.messages[action.payload.communityId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state) => { state.messagesLoading = false; })

      // Send Message
      .addCase(sendMessage.pending, (state) => { state.sending = true; })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sending = false;
        const { communityId, message } = action.payload;
        if (!state.messages[communityId]) state.messages[communityId] = [];
        const exists = state.messages[communityId].some((m) => m.id === message?.id);
        if (!exists && message?.id) state.messages[communityId].push(message);
      })
      .addCase(sendMessage.rejected, (state) => { state.sending = false; })

      // Auth reset
      .addMatcher(
        (action) =>
          action.type === 'auth/logout/fulfilled' ||
          action.type === 'auth/logout/rejected' ||
          action.type === 'auth/forceLogout',
        () => initialState
      );
  },
});

export const { clearCommunityError, receiveMessage } = communitySlice.actions;
export default communitySlice.reducer;
