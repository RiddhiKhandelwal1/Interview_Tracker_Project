import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost, apiDelete } from '@/lib/api-client';

interface Resume {
  id: number; userId: number; fileName: string; fileId: string;
  description: string | null; fileSize: number; mimeType: string;
  uploadDate: string; createdAt: string;
}

interface ResumeState { items: Resume[]; status: 'idle' | 'loading' | 'succeeded' | 'failed'; error: string | null; }
const initialState: ResumeState = { items: [], status: 'idle', error: null };

export const fetchResumes = createAsyncThunk('resumes/fetchAll', async (_, { rejectWithValue }) => {
  try { return await apiGet<Resume[]>('/api/resumes'); } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const uploadResume = createAsyncThunk('resumes/upload', async (formData: FormData, { rejectWithValue }) => {
  try { return await apiPost<Resume>('/api/resumes', formData); } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const deleteResume = createAsyncThunk('resumes/delete', async (id: number, { rejectWithValue }) => {
  try { await apiDelete(`/api/resumes/${id}`); return id; } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

const resumeSlice = createSlice({
  name: 'resumes', initialState, reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchResumes.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchResumes.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchResumes.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload as string; })
      .addCase(uploadResume.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(deleteResume.fulfilled, (state, action) => { state.items = state.items.filter((r) => r.id !== action.payload); });
  },
});

export default resumeSlice.reducer;
