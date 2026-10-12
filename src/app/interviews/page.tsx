'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInterviews, addInterview, updateInterview, deleteInterview } from '@/store/slices/interviewSlice';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { Plus, Briefcase, Edit3, Trash2 } from 'lucide-react';
import { INTERVIEW_STATUSES } from '@/lib/constants';
import toast from 'react-hot-toast';
import type { AppDispatch, RootState } from '@/store/store';

export default function InterviewsPage() { return <ProtectedRoute><InterviewsContent /></ProtectedRoute>; }

function InterviewsContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: interviews, status } = useSelector((s: RootState) => s.interviews);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { dispatch(fetchInterviews()); }, [dispatch]);

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      if (editing) { await dispatch(updateInterview({ id: editing.id as number, data })).unwrap(); toast.success('Interview updated'); }
      else { await dispatch(addInterview(data)).unwrap(); toast.success('Interview added'); }
      setIsModalOpen(false); setEditing(null);
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id: number) => {
    try { await dispatch(deleteInterview(id)).unwrap(); toast.success('Interview deleted'); } catch { toast.error('Failed to delete'); }
  };

  const getStatusVariant = (s: string) => {
    if (s === 'selected') return 'success';
    if (s === 'rejected') return 'danger';
    if (s === 'applied') return 'info';
    return 'warning';
  };

  return (
    <AppLayout title="Interviews">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-violet-500/10"><Briefcase size={16} className="text-violet-400" /></div>
            <div><h2 className="text-[15px] font-semibold text-[#E6E8EB]">Interview Tracker</h2><p className="text-xs text-[#7A8290]">Track your job applications</p></div>
          </div>
          <Button onClick={() => { setEditing(null); setIsModalOpen(true); }} size="sm"><Plus size={14} /> Add Interview</Button>
        </div>

        {status === 'loading' && interviews.length === 0 ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-sm" />)}</div>
        ) : interviews.length === 0 ? (
          <EmptyState icon={Briefcase} title="No interviews yet" description="Start tracking your job applications">
            <Button onClick={() => { setEditing(null); setIsModalOpen(true); }} size="sm"><Plus size={14} /> Add Interview</Button>
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {interviews.map((interview) => (
              <div key={interview.id} className="rounded-sm border border-[#1F2430] bg-[#12161F] p-4 hover:border-zinc-700/60 transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-[#E6E8EB]">{interview.company}</h3>
                      <Badge variant={getStatusVariant(interview.status)}>{interview.status.replace('_', ' ')}</Badge>
                    </div>
                    {interview.role && <p className="text-xs text-[#7A8290]">{interview.role}</p>}
                    {interview.interviewDate && <p className="text-[11px] text-zinc-600 mt-1">Interview: {new Date(interview.interviewDate).toLocaleDateString()}</p>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditing(interview); setIsModalOpen(true); }} className="p-1.5 rounded-sm text-[#7A8290] hover:text-[#E6E8EB] hover:bg-zinc-800 cursor-pointer"><Edit3 size={14} /></button>
                    <button onClick={() => handleDelete(interview.id)} className="p-1.5 rounded-sm text-[#7A8290] hover:text-[#E6E8EB] hover:bg-[#1F2430] cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditing(null); }} title={editing ? 'Edit Interview' : 'Add Interview'}>
        <InterviewForm initial={editing} onSave={handleSave} onClose={() => { setIsModalOpen(false); setEditing(null); }} />
      </Modal>
    </AppLayout>
  );
}

function InterviewForm({ initial, onSave, onClose }: { initial: Record<string, unknown> | null; onSave: (d: Record<string, unknown>) => void; onClose: () => void }) {
  const [company, setCompany] = useState((initial?.company as string) || '');
  const [role, setRole] = useState((initial?.role as string) || '');
  const [interviewStatus, setInterviewStatus] = useState((initial?.status as string) || 'applied');
  const [interviewDate, setInterviewDate] = useState((initial?.interviewDate as string)?.split('T')[0] || '');
  const [notes, setNotes] = useState((initial?.notes as string) || '');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ company, role, status: interviewStatus, interviewDate: interviewDate || null, notes }); }} className="space-y-4">
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Company *</label>
        <input value={company} onChange={(e) => setCompany(e.target.value)} required className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none focus:border-indigo-500" /></div>
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Role</label>
        <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none focus:border-indigo-500" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Status</label>
          <select value={interviewStatus} onChange={(e) => setInterviewStatus(e.target.value)} className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none">
            {INTERVIEW_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
        <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Interview Date</label>
          <input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none" /></div>
      </div>
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none focus:border-indigo-500 resize-none" /></div>
      <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit">{initial ? 'Update' : 'Add Interview'}</Button></div>
    </form>
  );
}
