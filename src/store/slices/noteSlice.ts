import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';

interface Note {
  id: number; userId: number; title: string; content: string; tags: string[] | null;
  problemId: number | null; problemTitle: string | null; revisionDate: string | null;
  createdAt: string; updatedAt: string;
}

interface NoteState { items: Note[]; status: 'idle' | 'loading' | 'succeeded' | 'failed'; error: string | null; }
const initialState: NoteState = { items: [], status: 'idle', error: null };

export const fetchNotes = createAsyncThunk('notes/fetchAll', async (_, { rejectWithValue }) => {
  try { return await apiGet<Note[]>('/api/notes'); } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const addNote = createAsyncThunk('notes/add', async (data: Record<string, unknown>, { rejectWithValue }) => {
  try { return await apiPost<Note>('/api/notes', data); } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const updateNote = createAsyncThunk('notes/update', async ({ id, data }: { id: number; data: Record<string, unknown> }, { rejectWithValue }) => {
  try { return await apiPatch<Note>(`/api/notes/${id}`, data); } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

export const deleteNote = createAsyncThunk('notes/delete', async (id: number, { rejectWithValue }) => {
  try { await apiDelete(`/api/notes/${id}`); return id; } catch (err) { return rejectWithValue(err instanceof Error ? err.message : 'Failed'); }
});

const noteSlice = createSlice({
  name: 'notes', initialState, reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchNotes.fulfilled, (state, action) => { state.status = 'succeeded'; state.items = action.payload; })
      .addCase(fetchNotes.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload as string; })
      .addCase(addNote.fulfilled, (state, action) => { state.items.unshift(action.payload); })
      .addCase(updateNote.fulfilled, (state, action) => {
        const idx = state.items.findIndex((n) => n.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteNote.fulfilled, (state, action) => { state.items = state.items.filter((n) => n.id !== action.payload); });
  },
});

export default noteSlice.reducer;
