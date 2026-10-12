'use client';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProblems } from '@/store/slices/problemSlice';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { AlertTriangle, Plus, BarChart3, Trash2 } from 'lucide-react';
import { MISTAKE_TYPES } from '@/lib/constants';
import { apiGet, apiPost } from '@/lib/api-client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import type { AppDispatch, RootState } from '@/store/store';

interface MistakeData {
  id: number; problemId: number; problemTitle: string; topic: string | null;
  difficulty: string; type: string; notes: string | null; createdAt: string;
}

interface MistakeAnalytics {
  mostCommonType: string | null;
  mostAffectedTopic: string | null;
  typeDistribution: Array<{ type: string; count: number; percentage: number }>;
  topicDistribution: Array<{ topic: string; count: number }>;
}

export default function MistakesPage() { return <ProtectedRoute><MistakesContent /></ProtectedRoute>; }

function MistakesContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: problems } = useSelector((s: RootState) => s.problems);
  const [mistakes, setMistakes] = useState<MistakeData[]>([]);
  const [analytics, setAnalytics] = useState<MistakeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => { dispatch(fetchProblems()); load(); }, [dispatch]);

  const load = async () => {
    try {
      const data = await apiGet<{ mistakes: MistakeData[]; analytics: MistakeAnalytics | null }>('/api/mistakes');
      setMistakes(data.mistakes); setAnalytics(data.analytics);
    } catch {} finally { setLoading(false); }
  };

  const handleAdd = async (data: { problemId: number; type: string; notes: string }) => {
    try { await apiPost('/api/mistakes', data); toast.success('Mistake recorded'); load(); setIsModalOpen(false); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const filtered = typeFilter ? mistakes.filter((m) => m.type === typeFilter) : mistakes;
  const typeLabel = (t: string) => MISTAKE_TYPES.find((mt) => mt.value === t)?.label || t.replace(/_/g, ' ');

  const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];

  return (
    <AppLayout title="Mistakes">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#C7595A]/10"><AlertTriangle size={16} className="text-[#C7595A]" /></div>
            <div><h2 className="text-[15px] font-semibold text-[#E6E8EB]">Mistake Journal</h2><p className="text-xs text-[#7A8290]">Track and analyze your mistakes to improve</p></div>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="sm"><Plus size={14} /> Log Mistake</Button>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-sm" />)}</div>
        ) : mistakes.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No mistakes logged" description="Log mistakes to see patterns and improve"><Button onClick={() => setIsModalOpen(true)} size="sm"><Plus size={14} /> Log Mistake</Button></EmptyState>
        ) : (
          <div className="space-y-5">
            {/* Analytics */}
            {analytics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-sm border border-[#1F2430] bg-[#12161F] p-4">
                  <h3 className="text-sm font-semibold text-[#E6E8EB] mb-4">Mistake Type Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart><Pie data={analytics.typeDistribution.map((d) => ({ name: typeLabel(d.type), value: d.count }))} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}>
                      {analytics.typeDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie><Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', color: '#a1a1aa' }} /></PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-sm border border-[#1F2430] bg-[#12161F] p-4">
                  <h3 className="text-sm font-semibold text-[#E6E8EB] mb-4">Most Affected Topics</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.topicDistribution.slice(0, 6)} layout="vertical"><XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} /><YAxis type="category" dataKey="topic" width={80} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                      <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} /><Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', color: '#a1a1aa' }} /></BarChart>
                  </ResponsiveContainer>
                </div>
                {analytics.mostCommonType && (
                  <div className="lg:col-span-2 rounded-sm border border-amber-500/20 bg-[#D9A253]/5 p-4">
                    <div className="flex items-center gap-2 mb-2"><BarChart3 size={14} className="text-[#E6E8EB]" /><h4 className="text-xs font-semibold text-[#E6E8EB] uppercase tracking-wider">Key Insights</h4></div>
                    <p className="text-sm text-[#E6E8EB]">Your most common mistake is <span className="text-[#E6E8EB] font-medium">{typeLabel(analytics.mostCommonType)}</span>
                      {analytics.mostAffectedTopic && <>, primarily in <span className="text-[#E6E8EB] font-medium">{analytics.mostAffectedTopic}</span></>}. Focus your revision on these areas.</p>
                  </div>
                )}
              </div>
            )}

            {/* Filter */}
            <div className="flex items-center gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none">
                <option value="">All Types</option>
                {MISTAKE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <span className="text-xs text-[#7A8290]">{filtered.length} mistake{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* List */}
            <div className="space-y-2">
              {filtered.map((m) => (
                <div key={m.id} className="rounded-sm border border-[#1F2430] bg-[#12161F] p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#E6E8EB]">{m.problemTitle}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="danger">{typeLabel(m.type)}</Badge>
                        <Badge variant={m.difficulty === 'easy' ? 'success' : m.difficulty === 'medium' ? 'warning' : 'danger'}>{m.difficulty}</Badge>
                        {m.topic && <Badge variant="info">{m.topic}</Badge>}
                      </div>
                      {m.notes && <p className="text-xs text-[#7A8290] mt-2">{m.notes}</p>}
                    </div>
                    <span className="text-[11px] text-zinc-600 flex-shrink-0">{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Mistake">
        <MistakeForm problems={problems} onSubmit={handleAdd} onClose={() => setIsModalOpen(false)} />
      </Modal>
    </AppLayout>
  );
}

function MistakeForm({ problems, onSubmit, onClose }: { problems: Array<{ id: number; title: string }>; onSubmit: (d: { problemId: number; type: string; notes: string }) => void; onClose: () => void }) {
  const [problemId, setProblemId] = useState<number>(0);
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (problemId && type) onSubmit({ problemId, type, notes }); }} className="space-y-4">
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Problem *</label>
        <select value={problemId} onChange={(e) => setProblemId(parseInt(e.target.value))} required className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none">
          <option value="">Select a problem</option>{problems.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Mistake Type *</label>
        <select value={type} onChange={(e) => setType(e.target.value)} required className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none">
          <option value="">Select type</option>{MISTAKE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">What went wrong?</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Describe what happened and what you learned..." className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none focus:border-indigo-500 resize-none" /></div>
      <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit">Log Mistake</Button></div>
    </form>
  );
}
