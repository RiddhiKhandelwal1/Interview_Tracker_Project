'use client';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProblems } from '@/store/slices/problemSlice';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { RefreshCw, Plus, Clock, CheckCircle2, AlertCircle, Brain } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/api-client';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import type { AppDispatch, RootState } from '@/store/store';

interface Revision {
  id: number; problemId: number; problemTitle: string; topic: string | null;
  difficulty: string; reviewCount: number; confidence: number;
  lastReviewedAt: string | null; nextReviewAt: string; intervalDays: number; isDue: boolean;
}

export default function RevisionPage() { return <ProtectedRoute><RevisionContent /></ProtectedRoute>; }

function RevisionContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: problems } = useSelector((s: RootState) => s.problems);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => { dispatch(fetchProblems()); load(); }, [dispatch]);

  const load = async () => {
    try {
      const data = await apiGet<{ revisions: Revision[]; dueCount: number }>('/api/revision');
      setRevisions(data.revisions); setDueCount(data.dueCount);
    } catch {} finally { setLoading(false); }
  };

  const addRevision = async (problemId: number) => {
    try { await apiPost('/api/revision', { problemId }); toast.success('Problem added to revision queue'); load(); setShowAddModal(false); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const recordReview = async (revisionId: number, action: 'nailed_it' | 'struggled') => {
    try { await apiPatch('/api/revision', { revisionId, action }); toast.success(action === 'nailed_it' ? 'Great job!' : 'Will review sooner'); load(); }
    catch { toast.error('Failed to record review'); }
  };

  const dueRevisions = revisions.filter((r) => r.isDue);
  const upcomingRevisions = revisions.filter((r) => !r.isDue);
  const confidenceColor = (c: number) => c >= 4 ? 'text-[#E6E8EB]' : c >= 3 ? 'text-[#E6E8EB]' : 'text-[#E6E8EB]';

  // Problems not yet in revision
  const trackedIds = new Set(revisions.map((r) => r.problemId));
  const solvedProblems = problems.filter((p) => (p.solved || p.status === 'solved') && !trackedIds.has(p.id));

  return (
    <AppLayout title="Revision">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-teal-500/10"><RefreshCw size={16} className="text-teal-400" /></div>
            <div><h2 className="text-[15px] font-semibold text-[#E6E8EB]">Spaced Revision</h2><p className="text-xs text-[#7A8290]">Adaptive review scheduling for long-term retention</p></div>
          </div>
          <div className="flex items-center gap-2">
            {dueCount > 0 && <Badge variant="danger">{dueCount} due today</Badge>}
            <Button onClick={() => setShowAddModal(true)} size="sm"><Plus size={14} /> Add Problem</Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-sm" />)}</div>
        ) : revisions.length === 0 ? (
          <EmptyState icon={Brain} title="No revisions scheduled" description="Add solved problems to start spaced revision">
            <Button onClick={() => setShowAddModal(true)} size="sm"><Plus size={14} /> Add Problem</Button>
          </EmptyState>
        ) : (
          <div className="space-y-6">
            {/* Due Today */}
            {dueRevisions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3"><AlertCircle size={14} className="text-[#E6E8EB]" /><h3 className="text-sm font-semibold text-[#E6E8EB]">Due for Review ({dueRevisions.length})</h3></div>
                <div className="space-y-2">
                  {dueRevisions.map((rev) => (
                    <motion.div key={rev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-sm border border-red-500/20 bg-red-500/5 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#E6E8EB]">{rev.problemTitle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={rev.difficulty === 'easy' ? 'success' : rev.difficulty === 'medium' ? 'warning' : 'danger'}>{rev.difficulty}</Badge>
                            {rev.topic && <Badge variant="info">{rev.topic}</Badge>}
                            <span className="text-[11px] text-[#7A8290]">Review #{rev.reviewCount + 1}</span>
                            <span className={`text-[11px] ${confidenceColor(rev.confidence)}`}>Confidence: {rev.confidence}/5</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button onClick={() => recordReview(rev.id, 'struggled')} variant="danger" size="sm">Struggled</Button>
                          <Button onClick={() => recordReview(rev.id, 'nailed_it')} size="sm"><CheckCircle2 size={14} /> Nailed It</Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcomingRevisions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3"><Clock size={14} className="text-[#7A8290]" /><h3 className="text-sm font-semibold text-[#7A8290]">Upcoming Reviews</h3></div>
                <div className="space-y-2">
                  {upcomingRevisions.map((rev) => (
                    <div key={rev.id} className="rounded-sm border border-[#1F2430] bg-[#12161F] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#E6E8EB]">{rev.problemTitle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={rev.difficulty === 'easy' ? 'success' : rev.difficulty === 'medium' ? 'warning' : 'danger'}>{rev.difficulty}</Badge>
                            {rev.topic && <Badge variant="info">{rev.topic}</Badge>}
                            <span className={`text-[11px] ${confidenceColor(rev.confidence)}`}>Confidence: {rev.confidence}/5</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#7A8290]">Next review</p>
                          <p className="text-sm text-[#E6E8EB]">{new Date(rev.nextReviewAt).toLocaleDateString()}</p>
                          <p className="text-[11px] text-zinc-600">in {rev.intervalDays} days</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Problem Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#12161F]/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-sm border border-[#1F2430] bg-[#12161F] shadow-2xl max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1F2430] px-5 py-3.5">
              <h2 className="text-sm font-semibold text-[#E6E8EB]">Add Problem to Revision</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#7A8290] hover:text-[#E6E8EB] cursor-pointer">✕</button>
            </div>
            <div className="p-5">
              {solvedProblems.length === 0 ? (
                <p className="text-sm text-[#7A8290] py-4 text-center">No solved problems available. Solve problems first, then add them to revision.</p>
              ) : (
                <div className="space-y-2">{solvedProblems.map((p) => (
                  <button key={p.id} onClick={() => addRevision(p.id)}
                    className="w-full flex items-center justify-between rounded-sm border border-[#1F2430] bg-[#12161F] px-4 py-3 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-colors cursor-pointer text-left">
                    <div><p className="text-sm font-medium text-[#E6E8EB]">{p.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[11px] capitalize ${p.difficulty === 'easy' ? 'text-[#E6E8EB]' : p.difficulty === 'medium' ? 'text-[#E6E8EB]' : 'text-[#C7595A]'}`}>{p.difficulty}</span>
                        {p.topic && <span className="text-[11px] text-[#E6E8EB]">{p.topic}</span>}
                      </div>
                    </div>
                    <Plus size={16} className="text-[#7A8290]" />
                  </button>
                ))}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
