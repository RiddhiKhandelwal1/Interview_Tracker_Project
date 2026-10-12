'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotes, addNote, updateNote, deleteNote } from '@/store/slices/noteSlice';
import { fetchProblems } from '@/store/slices/problemSlice';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { Plus, StickyNote, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AppDispatch, RootState } from '@/store/store';

export default function NotesPage() { return <ProtectedRoute><NotesContent /></ProtectedRoute>; }

function NotesContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: notes, status } = useSelector((s: RootState) => s.notes);
  const { items: problems } = useSelector((s: RootState) => s.problems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { dispatch(fetchNotes()); dispatch(fetchProblems()); }, [dispatch]);

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      if (editing) { await dispatch(updateNote({ id: editing.id as number, data })).unwrap(); toast.success('Note updated'); }
      else { await dispatch(addNote(data)).unwrap(); toast.success('Note created'); }
      setIsModalOpen(false); setEditing(null);
    } catch { toast.error('Failed to save note'); }
  };

  const handleDelete = async (id: number) => {
    try { await dispatch(deleteNote(id)).unwrap(); toast.success('Note deleted'); } catch { toast.error('Failed to delete'); }
  };

  return (
    <AppLayout title="Notes">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#1F2430]"><StickyNote size={16} className="text-[#E6E8EB]" /></div>
            <div><h2 className="text-[15px] font-semibold text-[#E6E8EB]">Study Notes</h2><p className="text-xs text-[#7A8290]">Your personal knowledge base</p></div>
          </div>
          <Button onClick={() => { setEditing(null); setIsModalOpen(true); }} size="sm"><Plus size={14} /> New Note</Button>
        </div>

        {status === 'loading' && notes.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36 rounded-sm" />)}</div>
        ) : notes.length === 0 ? (
          <EmptyState icon={StickyNote} title="No notes yet" description="Create your first study note">
            <Button onClick={() => { setEditing(null); setIsModalOpen(true); }} size="sm"><Plus size={14} /> New Note</Button>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-sm border border-[#1F2430] bg-[#12161F] p-4 hover:border-zinc-700/60 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-[#E6E8EB] line-clamp-2">{note.title}</h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                    <button onClick={() => { setEditing(note); setIsModalOpen(true); }} className="p-1 rounded text-[#7A8290] hover:text-[#E6E8EB] cursor-pointer"><Edit3 size={12} /></button>
                    <button onClick={() => handleDelete(note.id)} className="p-1 rounded text-[#7A8290] hover:text-[#E6E8EB] cursor-pointer"><Trash2 size={12} /></button>
                  </div>
                </div>
                <p className="text-xs text-[#7A8290] line-clamp-3 mb-3">{note.content}</p>
                {note.tags && Array.isArray(note.tags) && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">{(note.tags as string[]).map((tag) => (
                    <span key={tag} className="rounded-sm bg-[#1F2430] px-2 py-0.5 text-[10px] text-[#E6E8EB]">{tag}</span>
                  ))}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null); }} title={editing ? 'Edit Note' : 'Create Note'}>
        <NoteForm initial={editing} problems={problems} onSave={handleSave} onClose={() => { setIsModalOpen(false); setEditing(null); }} />
      </Modal>
    </AppLayout>
  );
}

function NoteForm({ initial, problems, onSave, onClose }: { initial: Record<string, unknown> | null; problems: Array<{ id: number; title: string }>; onSave: (d: Record<string, unknown>) => void; onClose: () => void }) {
  const [title, setTitle] = useState((initial?.title as string) || '');
  const [content, setContent] = useState((initial?.content as string) || '');
  const [tags, setTags] = useState((initial?.tags as string[] || []).join(', '));
  const [problemId, setProblemId] = useState<number | string>(initial?.problemId as number || '');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ title, content, tags: tags.split(',').map((t) => t.trim()).filter(Boolean), problemId: problemId || null }); }} className="space-y-4">
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none focus:border-indigo-500" /></div>
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Content *</label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={5} className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none focus:border-indigo-500 resize-none" /></div>
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Tags (comma separated)</label>
        <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none focus:border-indigo-500" placeholder="dp, arrays, hard" /></div>
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Linked Problem</label>
        <select value={problemId} onChange={(e) => setProblemId(e.target.value)} className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none">
          <option value="">None</option>{problems.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
      <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit">{initial ? 'Update' : 'Create Note'}</Button></div>
    </form>
  );
}
