'use client';
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProblems } from '@/store/slices/problemSlice';
import { fetchInterviews } from '@/store/slices/interviewSlice';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/Spinner';
import useAuth from '@/hooks/useAuth';
import type { AppDispatch, RootState } from '@/store/store';

export default function DashboardPage() {
  return <ProtectedRoute><DashboardContent /></ProtectedRoute>;
}

function DashboardContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const { items: problems, status } = useSelector((s: RootState) => s.problems);
  const { items: interviews } = useSelector((s: RootState) => s.interviews);

  useEffect(() => { dispatch(fetchProblems()); dispatch(fetchInterviews()); }, [dispatch]);

  const stats = useMemo(() => {
    const solved = problems.filter((p) => p.solved || p.status === 'solved');
    return {
      total: problems.length, solved: solved.length,
      easy: solved.filter((p) => p.difficulty === 'easy').length,
      medium: solved.filter((p) => p.difficulty === 'medium').length,
      hard: solved.filter((p) => p.difficulty === 'hard').length,
      rate: problems.length > 0 ? Math.round((solved.length / problems.length) * 100) : 0,
      interviews: interviews.length,
    };
  }, [problems, interviews]);

  const isLoading = status === 'loading' && problems.length === 0;

  const getDifficultyColor = (diff: string) => {
    if (diff === 'easy') return 'text-[#4FAE7E]';
    if (diff === 'medium') return 'text-[#D9A253]';
    if (diff === 'hard') return 'text-[#C7595A]';
    return 'text-[#7A8290]';
  };

  const getDifficultyBg = (diff: string) => {
    if (diff === 'easy') return 'bg-[#4FAE7E]';
    if (diff === 'medium') return 'bg-[#D9A253]';
    if (diff === 'hard') return 'bg-[#C7595A]';
    return 'bg-[#1F2430]';
  };

  return (
    <AppLayout title="Dashboard">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-sm" />
          <Skeleton className="h-24 w-full rounded-sm" />
          <Skeleton className="h-32 w-full rounded-sm" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Welcome Header Hero */}
          <div className="flex flex-col items-center justify-center py-16 md:py-24 border-b border-[#1F2430] mb-8">
            <div className="font-mono text-sm text-[#7A8290] mb-4">
              {'//'} dashboard
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold text-[#E6E8EB] mb-4 text-center tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <p className="text-[#7A8290] font-mono text-sm">
              {stats.total > 0 
                ? `${stats.total} problems tracked · ${stats.solved} solved`
                : 'No problems tracked yet — start with your first one.'}
            </p>
          </div>

          {/* Unified Status Bar */}
          <div className="border border-[#1F2430] bg-[#12161F] flex flex-col md:flex-row md:divide-x divide-y md:divide-y-0 divide-[#1F2430]">
            <div className="flex-1 p-4 flex flex-col">
              <span className="font-mono text-2xl text-[#E6E8EB] animate-counter">{stats.total}</span>
              <span className="text-xs text-[#7A8290] uppercase tracking-wide mt-1">Total Problems</span>
            </div>
            <div className="flex-1 p-4 flex flex-col">
              <span className="font-mono text-2xl text-[#E6E8EB] animate-counter">{stats.solved}</span>
              <span className="text-xs text-[#7A8290] uppercase tracking-wide mt-1">Solved</span>
            </div>
            <div className="flex-1 p-4 flex flex-col">
              <span className="font-mono text-2xl text-[#4FC1C9] animate-counter">{stats.rate}%</span>
              <span className="text-xs text-[#7A8290] uppercase tracking-wide mt-1">Solve Rate</span>
            </div>
            <div className="flex-1 p-4 flex flex-col">
              <span className="font-mono text-2xl text-[#E6E8EB] animate-counter">{stats.interviews}</span>
              <span className="text-xs text-[#7A8290] uppercase tracking-wide mt-1">Interviews</span>
            </div>
          </div>

          {/* Single Stacked Bar for Difficulty */}
          <div className="border border-[#1F2430] bg-[#12161F] p-5">
            <h3 className="font-mono text-xs text-[#7A8290] uppercase tracking-wide mb-4">Difficulty breakdown</h3>
            
            <div className="flex h-3 w-full overflow-hidden bg-[#1F2430] mb-3">
              {stats.total > 0 ? (
                <>
                  {stats.easy > 0 && <div className={getDifficultyBg('easy')} style={{ width: `${(stats.easy / stats.total) * 100}%` }} />}
                  {stats.medium > 0 && <div className={getDifficultyBg('medium')} style={{ width: `${(stats.medium / stats.total) * 100}%` }} />}
                  {stats.hard > 0 && <div className={getDifficultyBg('hard')} style={{ width: `${(stats.hard / stats.total) * 100}%` }} />}
                </>
              ) : (
                <div className="w-full bg-[#1F2430]" />
              )}
            </div>
            
            <div className="flex items-center justify-between font-mono text-xs">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#4FAE7E]"></div> <span className="text-[#E6E8EB]">{stats.easy}</span> <span className="text-[#7A8290]">easy</span></span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#D9A253]"></div> <span className="text-[#E6E8EB]">{stats.medium}</span> <span className="text-[#7A8290]">medium</span></span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-[#C7595A]"></div> <span className="text-[#E6E8EB]">{stats.hard}</span> <span className="text-[#7A8290]">hard</span></span>
              </div>
            </div>
          </div>

          {/* Recent Problems File Listing */}
          <div className="border border-[#1F2430] bg-[#12161F]">
            <div className="border-b border-[#1F2430] p-3 px-4">
              <h3 className="font-mono text-xs text-[#7A8290] uppercase tracking-wide">Recent files</h3>
            </div>
            {problems.length === 0 ? (
              <p className="text-sm font-mono text-[#7A8290] p-4">No recent files.</p>
            ) : (
              <div className="divide-y divide-[#1F2430]">
                {problems.slice(0, 5).map((p, idx) => (
                  <div key={p.id} className="flex items-center px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
                    <span className="font-mono text-xs text-[#7A8290] w-8 shrink-0">{(idx + 1).toString().padStart(2, '0')}</span>
                    <span className="font-mono text-sm text-[#E6E8EB] flex-1 truncate">{p.title.toLowerCase().replace(/\s+/g, '_')}.ts</span>
                    <span className={`font-mono text-xs ${getDifficultyColor(p.difficulty)}`}>
                      [{p.difficulty}]
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
