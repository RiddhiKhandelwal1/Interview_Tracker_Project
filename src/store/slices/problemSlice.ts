import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';

interface Problem {
  id: number; userId: number; title: string; difficulty: string; status: string;
  solved: boolean; platform: string; url: string | null; notes: string | null;
  topic: string | null; isFavourite: boolean; dateSolved: string | null;
  revisionDate: string | null; version: number; createdAt: string; updatedAt: string;
}

interface ProblemState {
  items: Problem[]; status: 'idle' | 'loading' | 'succeeded' | 'failed'; error: string | null;
  filters: { search: string; difficulty: string; topic: string; platform: string; sortBy: string };
}

const initialState: ProblemState = {
  items: [], status: 'idle', error: null,
  filters: { search: '', difficulty: '', topic: '', platform: '', sortBy: 'newest' },
};

export const fetchProblems = createAsyncThunk('problems/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const result = await apiGet<{ data: Problem[] }>('/api/problems');
    return result.data || result;
  } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const addProblem = createAsyncThunk('problems/add', async (data: Record<string, unknown>, { rejectWithValue }) => {
  try { return await apiPost<Problem>('/api/problems', data); } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const updateProblem = createAsyncThunk('problems/update', async ({ id, data }: { id: number; data: Record<string, unknown> }, { rejectWithValue }) => {
  try { return await apiPatch<Problem>(`/api/problems/${id}`, data); } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const deleteProblem = createAsyncThunk('problems/delete', async (id: number, { rejectWithValue }) => {
  try { await apiDelete(`/api/problems/${id}`); return id; } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

const problemSlice = createSlice({
  name: 'problems', initialState,
  reducers: {
    setFilter(state, action) { const { key, value } = action.payload; (state.filters as Record<string, string>)[key] = value; },
    clearFilters(state) { state.filters = initialState.filters; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProblems.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchProblems.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload as Problem[]; })
      .addCase(fetchProblems.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload as string; })
      .addCase(addProblem.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateProblem.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteProblem.fulfilled, (state, action) => { state.items = state.items.filter((p) => p.id !== action.payload); });
  },
});

export const { setFilter, clearFilters } = problemSlice.actions;
export default problemSlice.reducer;
