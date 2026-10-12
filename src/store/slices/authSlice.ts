import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiPost, apiGet, setAccessToken } from '@/lib/api-client';

interface User {
  id: number; name: string; email: string; role: string;
  createdAt: string; updatedAt: string;
}

interface AuthState {
  user: User | null; status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null; isInitialized: boolean;
}

const initialState: AuthState = { user: null, status: 'idle', error: null, isInitialized: false };

export const signup = createAsyncThunk('auth/signup', async (data: { name: string; email: string; password: string }, { rejectWithValue }) => {
  try {
    const result = await apiPost<{ user: User; accessToken: string }>('/api/auth/register', data);
    setAccessToken(result.accessToken);
    return result.user;
  } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Signup failed'); }
});

export const login = createAsyncThunk('auth/login', async (data: { email: string; password: string }, { rejectWithValue }) => {
  try {
    const result = await apiPost<{ user: User; accessToken: string }>('/api/auth/login', data);
    setAccessToken(result.accessToken);
    return result.user;
  } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Login failed'); }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await apiPost('/api/auth/logout');
  setAccessToken(null);
});

export const getCurrentUser = createAsyncThunk('auth/getCurrentUser', async (_, { rejectWithValue }) => {
  try {
    // Try refresh first to get a new access token
    const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!refreshRes.ok) return rejectWithValue('No session');
    const refreshData = await refreshRes.json();
    if (refreshData.success && refreshData.data?.accessToken) {
      setAccessToken(refreshData.data.accessToken);
      return refreshData.data.user;
    }
    return rejectWithValue('No session');
  } catch { return rejectWithValue('No session'); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(signup.fulfilled, (state, action) => { state.status = 'succeeded'; state.user = action.payload; state.isInitialized = true; })
      .addCase(signup.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload as string; })
      .addCase(login.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(login.fulfilled, (state, action) => { state.status = 'succeeded'; state.user = action.payload; state.isInitialized = true; })
      .addCase(login.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload as string; })
      .addCase(logout.fulfilled, (state) => { state.user = null; state.status = 'idle'; })
      .addCase(getCurrentUser.pending, (state) => { state.status = 'loading'; })
      .addCase(getCurrentUser.fulfilled, (state, action) => { state.status = 'succeeded'; state.user = action.payload; state.isInitialized = true; })
      .addCase(getCurrentUser.rejected, (state) => { state.status = 'failed'; state.user = null; state.isInitialized = true; });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
