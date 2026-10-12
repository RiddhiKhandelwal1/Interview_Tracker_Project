'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchResumes, uploadResume, deleteResume } from '@/store/slices/resumeSlice';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Spinner';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AppDispatch, RootState } from '@/store/store';

export default function ResumesPage() { return <ProtectedRoute><ResumesContent /></ProtectedRoute>; }

function ResumesContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: resumes, status } = useSelector((s: RootState) => s.resumes);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { dispatch(fetchResumes()); }, [dispatch]);

  const handleUpload = async (file: File, description: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) formData.append('description', description);
    try { await dispatch(uploadResume(formData)).unwrap(); toast.success('Resume uploaded'); setIsModalOpen(false); }
    catch { toast.error('Upload failed'); }
  };

  const handleDelete = async (id: number) => {
    try { await dispatch(deleteResume(id)).unwrap(); toast.success('Resume deleted'); } catch { toast.error('Failed to delete'); }
  };

  return (
    <AppLayout title="Resumes">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#1F2430]"><FileText size={16} className="text-[#E6E8EB]" /></div>
            <div><h2 className="text-[15px] font-semibold text-[#E6E8EB]">Resume Manager</h2><p className="text-xs text-[#7A8290]">Upload and manage your resumes</p></div>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="sm"><Upload size={14} /> Upload</Button>
        </div>

        {status === 'loading' && resumes.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 rounded-sm" />)}</div>
        ) : resumes.length === 0 ? (
          <EmptyState icon={FileText} title="No resumes" description="Upload your first resume"><Button onClick={() => setIsModalOpen(true)} size="sm"><Upload size={14} /> Upload</Button></EmptyState>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {resumes.map((r) => (
              <div key={r.id} className="rounded-sm border border-[#1F2430] bg-[#12161F] p-4 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#1F2430]"><FileText size={18} className="text-[#E6E8EB]" /></div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`/api/resumes/${r.id}`} className="p-1.5 rounded-sm text-[#7A8290] hover:text-[#E6E8EB] hover:bg-zinc-800"><Download size={14} /></a>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-sm text-[#7A8290] hover:text-[#E6E8EB] hover:bg-[#1F2430] cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-sm font-medium text-[#E6E8EB] truncate">{r.fileName}</p>
                {r.description && <p className="text-xs text-[#7A8290] mt-1 line-clamp-2">{r.description}</p>}
                <p className="text-[11px] text-zinc-600 mt-2">{(r.fileSize / 1024).toFixed(1)} KB • {new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Resume">
        <UploadForm onUpload={handleUpload} onClose={() => setIsModalOpen(false)} />
      </Modal>
    </AppLayout>
  );
}

function UploadForm({ onUpload, onClose }: { onUpload: (f: File, d: string) => void; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [desc, setDesc] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (file) onUpload(file, desc); }} className="space-y-4">
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">File *</label>
        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} required
          className="w-full text-sm text-[#7A8290] file:mr-3 file:rounded-sm file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#E6E8EB] file:cursor-pointer" /></div>
      <div><label className="block text-xs font-medium text-[#7A8290] mb-1">Description</label>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-sm border border-[#1F2430] bg-[#12161F] px-3 py-2 text-sm text-[#E6E8EB] outline-none focus:border-indigo-500" placeholder="e.g., SDE resume for Google" /></div>
      <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit">Upload</Button></div>
    </form>
  );
}
