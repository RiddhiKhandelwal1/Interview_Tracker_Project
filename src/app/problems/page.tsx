'use client';
import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProblems, addProblem, updateProblem, deleteProblem, setFilter } from '@/store/slices/problemSlice';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { Plus, Code2, Search, Trash2, Edit3, Star, ExternalLink } from 'lucide-react';
import { DIFFICULTIES, PLATFORMS, TOPICS } from '@/lib/constants';
import toast from 'react-hot-toast';
import type { AppDispatch, RootState } from '@/store/store';

export default function ProblemsPage() { return <ProtectedRoute><ProblemsContent /></ProtectedRoute>; }

function ProblemsContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: problems, status, filters } = useSelector((s: RootState) => s.problems);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { dispatch(fetchProblems()); }, [dispatch]);

  const filtered = useMemo(() => {
    let result = [...problems];
    if (filters.search) result = result.filter((p) => p.title.toLowerCase().includes(filters.search.toLowerCase()));
    if (filters.difficulty) result = result.filter((p) => p.difficulty === filters.difficulty);
    if (filters.topic) result = result.filter((p) => p.topic === filters.topic);
    if (filters.platform) result = result.filter((p) => p.platform === filters.platform);
    return result;
  }, [problems, filters]);

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      if (editing) {
        await dispatch(updateProblem({ id: editing.id as number, data: { ...data, version: editing.version } })).unwrap();
        toast.success('Problem updated');
      } else {
        await dispatch(addProblem(data)).unwrap();
        toast.success('Problem added');
      }
      setIsModalOpen(false); setEditing(null);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleDelete = async (id: number) => {
    try { await dispatch(deleteProblem(id)).unwrap(); toast.success('Problem deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <AppLayout title="Problems">
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1F2430] pb-6 mb-8">
          <div>
            <div className="font-mono text-sm text-[#7A8290] mb-2">{'//'} problems</div>
            <h1 className="text-4xl font-semibold text-[#E6E8EB] tracking-tight">Problem Tracker</h1>
          </div>
          <Button onClick={() => { setEditing(null); setIsModalOpen(true); }} size="sm"><Plus size={14} /> Add Problem</Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A8290]" />
            <input type="text" placeholder="Search problems..." value={filters.search}
              onChange={(e) => dispatch(setFilter({ key: 'search', value: e.target.value }))}
              className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] pl-9 pr-3 py-2 text-sm font-mono text-[#E6E8EB] placeholder-[#7A8290] outline-none focus:border-[#4FC1C9]" />
          </div>
          <select value={filters.difficulty} onChange={(e) => dispatch(setFilter({ key: 'difficulty', value: e.target.value }))}
            className="rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none">
            <option value="">All Difficulties</option>
            {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <select value={filters.topic} onChange={(e) => dispatch(setFilter({ key: 'topic', value: e.target.value }))}
            className="rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none">
            <option value="">All Topics</option>
            {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {status === 'loading' && problems.length === 0 ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-sm" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Code2} title="No problems found" description="Add your first problem or adjust filters">
            <Button onClick={() => { setEditing(null); setIsModalOpen(true); }} size="sm"><Plus size={14} /> Add Problem</Button>
          </EmptyState>
        ) : (
          <div className="border border-[#1F2430] bg-[#12161F]">
            <div className="border-b border-[#1F2430] p-3 px-4">
              <h3 className="font-mono text-xs text-[#7A8290] uppercase tracking-wide">Problems list</h3>
            </div>
            <div className="divide-y divide-[#1F2430]">
              {filtered.map((p, idx) => {
                const getDifficultyColor = (diff: string) => {
                  if (diff === 'easy') return 'text-[#4FAE7E]';
                  if (diff === 'medium') return 'text-[#D9A253]';
                  if (diff === 'hard') return 'text-[#C7595A]';
                  return 'text-[#7A8290]';
                };
                return (
                  <div key={p.id} className="flex items-center px-4 py-2 hover:bg-white/[0.02] transition-colors group">
                    <span className="font-mono text-xs text-[#7A8290] w-8 shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <span className="font-mono text-sm text-[#E6E8EB] truncate">{p.title.toLowerCase().replace(/\s+/g, '_')}.ts</span>
                      <span className={`font-mono text-xs ${getDifficultyColor(p.difficulty)}`}>[{p.difficulty}]</span>
                      {p.topic && <span className="font-mono text-xs text-[#4FC1C9]">[{p.topic}]</span>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-sm text-[#7A8290] hover:text-[#E6E8EB] hover:bg-white/[0.05]"><ExternalLink size={14} /></a>}
                      <button onClick={() => { setEditing(p); setIsModalOpen(true); }} className="p-1.5 rounded-sm text-[#7A8290] hover:text-[#E6E8EB] hover:bg-white/[0.05] cursor-pointer"><Edit3 size={14} /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-sm text-[#7A8290] hover:text-[#C7595A] hover:bg-[#C7595A]/10 cursor-pointer"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null); }} title={editing ? 'Edit Problem' : 'Add Problem'} size="lg">
        <ProblemForm initial={editing} onSave={handleSave} onClose={() => { setIsModalOpen(false); setEditing(null); }} />
      </Modal>
    </AppLayout>
  );
}

function ProblemForm({ initial, onSave, onClose }: { initial: Record<string, unknown> | null; onSave: (data: Record<string, unknown>) => void; onClose: () => void }) {
  const [title, setTitle] = useState((initial?.title as string) || '');
  const [difficulty, setDifficulty] = useState((initial?.difficulty as string) || 'easy');
  const [status, setStatus] = useState((initial?.status as string) || 'pending');
  const [platform, setPlatform] = useState((initial?.platform as string) || 'leetcode');
  const [topic, setTopic] = useState((initial?.topic as string) || '');
  const [url, setUrl] = useState((initial?.url as string) || '');
  const [notes, setNotes] = useState((initial?.notes as string) || '');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ title, difficulty, status, platform, topic, url, notes }); }} className="space-y-4">
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-sm border border-[#1F2430] bg-[#0B0E14] px-3 py-2 text-sm font-mono text-[#E6E8EB] outline-none focus:border-[#4FC1C9]" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Difficulty</label>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none">
            {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
        <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none">
            <option value="pending">Pending</option><option value="attempted">Attempted</option><option value="solved">Solved</option><option value="revising">Revising</option></select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Platform</label>
          <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none">
            {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
        <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Topic</label>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none">
            <option value="">Select topic</option>{TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
      </div>
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">URL</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full rounded-sm border border-[#1F2430] bg-[#0B0E14] px-3 py-2 text-sm font-mono text-[#E6E8EB] outline-none focus:border-[#4FC1C9]" placeholder="https://leetcode.com/..." /></div>
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-sm border border-[#1F2430] bg-[#0B0E14] px-3 py-2 text-sm font-mono text-[#E6E8EB] outline-none focus:border-[#4FC1C9] resize-none" /></div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit">{initial ? 'Update' : 'Add Problem'}</Button>
      </div>
    </form>
  );
}
