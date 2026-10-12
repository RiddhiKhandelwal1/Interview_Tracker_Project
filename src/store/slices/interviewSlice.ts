import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';

interface Interview {
  id: number; userId: number; company: string; role: string | null;
  status: string; interviewStage: string | null;
  applicationDate: string | null; interviewDate: string | null;
  jobUrl: string | null; notes: string | null; result: string | null;
  nextAction: string | null; nextActionDate: string | null;
  createdAt: string; updatedAt: string;
}

interface InterviewState { items: Interview[]; status: 'idle' | 'loading' | 'succeeded' | 'failed'; error: string | null; }
const initialState: InterviewState = { items: [], status: 'idle', error: null };

export const fetchInterviews = createAsyncThunk('interviews/fetchAll', async (_, { rejectWithValue }) => {
  try { return await apiGet<Interview[]>('/api/interviews'); } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const addInterview = createAsyncThunk('interviews/add', async (data: Record<string, unknown>, { rejectWithValue }) => {
  try { return await apiPost<Interview>('/api/interviews', data); } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const updateInterview = createAsyncThunk('interviews/update', async ({ id, data }: { id: number; data: Record<string, unknown> }, { rejectWithValue }) => {
  try { return await apiPatch<Interview>(`/api/interviews/${id}`, data); } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const deleteInterview = createAsyncThunk('interviews/delete', async (id: number, { rejectWithValue }) => {
  try { await apiDelete(`/api/interviews/${id}`); return id; } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

const interviewSlice = createSlice({
  name: 'interviews', initialState, reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInterviews.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchInterviews.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchInterviews.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload as string; })
      .addCase(addInterview.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateInterview.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteInterview.fulfilled, (state, action) => { state.items = state.items.filter((i) => i.id !== action.payload); });
  },
});

export default interviewSlice.reducer;
