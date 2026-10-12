'use client';
import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProblems } from '@/store/slices/problemSlice';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/Spinner';
import { BarChart3, Sparkles, ChevronDown, ChevronUp, Loader2, Target, BookOpen, Calendar, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';
import { apiPost } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { AppDispatch, RootState } from '@/store/store';

export default function AnalyticsPage() { return <ProtectedRoute><AnalyticsContent /></ProtectedRoute>; }

function AnalyticsContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { items: problems, status } = useSelector((s: RootState) => s.problems);

  useEffect(() => { dispatch(fetchProblems()); }, [dispatch]);

  const stats = useMemo(() => {
    const solved = problems.filter((p) => p.solved || p.status === 'solved');
    const topicMap: Record<string, number> = {};
    solved.forEach((p) => { if (p.topic) topicMap[p.topic] = (topicMap[p.topic] || 0) + 1; });
    const topicData = Object.entries(topicMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const diffData = [
      { name: 'Easy', value: solved.filter((p) => p.difficulty === 'easy').length, color: '#10B981' },
      { name: 'Medium', value: solved.filter((p) => p.difficulty === 'medium').length, color: '#F59E0B' },
      { name: 'Hard', value: solved.filter((p) => p.difficulty === 'hard').length, color: '#EF4444' },
    ];
    return { total: problems.length, solved: solved.length, topicData, diffData };
  }, [problems]);

  return (
    <AppLayout title="Analytics">
      <div className="space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#1F2430]"><BarChart3 size={16} className="text-[#E6E8EB]" /></div>
          <div><h2 className="text-[15px] font-semibold text-[#E6E8EB]">Analytics</h2><p className="text-xs text-[#7A8290]">Visualize your preparation progress</p></div>
        </div>

        {status === 'loading' && problems.length === 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-sm" />)}</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Insights */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <InsightCard label="Total" value={stats.total} color="text-[#E6E8EB]" />
              <InsightCard label="Solved" value={stats.solved} color="text-[#E6E8EB]" />
              <InsightCard label="Rate" value={`${stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0}%`} color="text-cyan-400" />
              <InsightCard label="Topics" value={stats.topicData.length} color="text-violet-400" />
            </div>

            {/* AI Coach */}
            <AICoach problems={problems as any[]} />

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-sm border border-[#1F2430] bg-[#12161F] p-4">
                <h3 className="text-sm font-semibold text-[#E6E8EB] mb-4">Difficulty Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart><Pie data={stats.diffData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {stats.diffData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie><Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', color: '#a1a1aa' }} /></PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-sm border border-[#1F2430] bg-[#12161F] p-4">
                <h3 className="text-sm font-semibold text-[#E6E8EB] mb-4">Topic Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.topicData.slice(0, 8)} layout="vertical"><XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} /><YAxis type="category" dataKey="name" width={80} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} /><Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px', color: '#a1a1aa' }} /></BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function InsightCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-sm border border-[#1F2430] bg-[#12161F] p-4">
      <p className="text-xs text-[#7A8290] mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// AI Coach Component (migrated from original)
interface CoachPlan { summary: string; interviewReadiness: string; nextDifficultyTarget: string; weeklyGoal: string; tip: string; focusTopics: string[]; dailyPlan: Array<{ day: string; task: string }>; }

function AICoach({ problems }: { problems: Array<Record<string, unknown>> }) {
  const [plan, setPlan] = useState<CoachPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const handleGenerate = async () => {
    setLoading(true); setError(null); setPlan(null);
    try {
      const result = await apiPost<CoachPlan>('/api/ai/coach', { problems });
      setPlan(result); setExpanded(true);
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.'); }
    finally { setLoading(false); }
  };

  const readinessColors: Record<string, string> = { Beginner: 'text-sky-400', Intermediate: 'text-violet-400', Advanced: 'text-[#E6E8EB]' };
  const diffColors: Record<string, string> = { easy: 'text-[#E6E8EB]', medium: 'text-[#E6E8EB]', hard: 'text-[#E6E8EB]' };

  return (
    <div className="relative overflow-hidden rounded-sm border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-violet-950/30">
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-sm bg-indigo-600/8 blur-[80px]" />
      <div className="relative p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25"><Sparkles size={16} className="text-[#E6E8EB]" /></div>
            <div><h3 className="text-[15px] font-semibold text-[#E6E8EB]">AI Study Coach</h3><p className="text-xs text-[#7A8290]">Powered by Gemini · Personalized for your data</p></div>
          </div>
          <div className="flex items-center gap-2">
            {plan && <button onClick={() => setExpanded((e) => !e)} className="flex items-center gap-1 rounded-sm px-2 py-1 text-xs text-[#7A8290] hover:text-[#E6E8EB] hover:bg-zinc-800/50 transition-colors cursor-pointer">{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{expanded ? 'Collapse' : 'Expand'}</button>}
            <button onClick={handleGenerate} disabled={loading || problems.length === 0}
              className="relative inline-flex items-center gap-2 rounded-sm bg-indigo-600 px-4 py-2 text-xs font-semibold text-[#E6E8EB] shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {loading ? 'Analyzing...' : plan ? 'Regenerate' : 'Generate My Plan'}
            </button>
          </div>
        </div>

        {!plan && !loading && !error && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-sm border border-[#1F2430] bg-[#12161F] p-4">
            <p className="text-sm text-[#7A8290] leading-relaxed">Click <span className="text-[#E6E8EB] font-medium">Generate My Plan</span> to get a personalized study roadmap.</p>
          </motion.div>
        )}

        <AnimatePresence>{error && <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 flex items-start gap-3 rounded-sm border border-red-500/20 bg-red-500/5 p-4"><AlertCircle size={16} className="text-[#E6E8EB] mt-0.5 flex-shrink-0" /><p className="text-sm text-red-300">{error}</p></motion.div>}</AnimatePresence>

        {loading && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-4 rounded-sm bg-zinc-800/80 animate-pulse" style={{ width: `${85 - i * 10}%` }} />)}</motion.div>}

        <AnimatePresence>
          {plan && expanded && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-5 space-y-4 overflow-hidden">
              <div className="rounded-sm border border-[#1F2430] bg-[#12161F] p-4"><p className="text-sm text-[#E6E8EB] leading-relaxed">{plan.summary}</p></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {plan.interviewReadiness && <div className="flex items-center gap-3 rounded-sm border border-[#1F2430] bg-[#12161F] p-3.5"><div><p className="text-[10px] text-[#7A8290] uppercase tracking-wider font-medium">Readiness</p><p className={`text-sm font-semibold ${readinessColors[plan.interviewReadiness] || 'text-[#E6E8EB]'}`}>{plan.interviewReadiness}</p></div></div>}
                {plan.nextDifficultyTarget && <div className="flex items-center gap-3 rounded-sm border border-[#1F2430] bg-[#12161F] p-3.5"><Target size={16} className={diffColors[plan.nextDifficultyTarget] || 'text-[#7A8290]'} /><div><p className="text-[10px] text-[#7A8290] uppercase tracking-wider font-medium">Next Difficulty</p><p className={`text-sm font-semibold capitalize ${diffColors[plan.nextDifficultyTarget] || 'text-[#E6E8EB]'}`}>{plan.nextDifficultyTarget}</p></div></div>}
                <div className="flex items-center gap-3 rounded-sm border border-[#1F2430] bg-[#12161F] p-3.5"><Calendar size={16} className="text-cyan-400" /><div><p className="text-[10px] text-[#7A8290] uppercase tracking-wider font-medium">Weekly Goal</p><p className="text-sm font-semibold text-[#E6E8EB]">{plan.weeklyGoal}</p></div></div>
                <div className="flex items-start gap-3 rounded-sm border border-amber-500/20 bg-[#D9A253]/5 p-3.5"><Lightbulb size={16} className="text-[#E6E8EB] mt-0.5 flex-shrink-0" /><p className="text-xs text-amber-200/80 leading-relaxed">{plan.tip}</p></div>
              </div>
              {plan.focusTopics?.length > 0 && (
                <div><div className="flex items-center gap-2 mb-2.5"><BookOpen size={13} className="text-[#7A8290]" /><p className="text-xs font-medium text-[#7A8290] uppercase tracking-wider">Focus Topics</p></div>
                  <div className="flex flex-wrap gap-2">{plan.focusTopics.map((t) => <span key={t} className="rounded-sm px-3 py-1 text-xs font-medium bg-[#1F2430] text-[#E6E8EB] border border-indigo-500/20">{t}</span>)}</div></div>
              )}
              {plan.dailyPlan?.length > 0 && (
                <div><div className="flex items-center gap-2 mb-2.5"><TrendingUp size={13} className="text-[#7A8290]" /><p className="text-xs font-medium text-[#7A8290] uppercase tracking-wider">7-Day Roadmap</p></div>
                  <div className="space-y-2">{plan.dailyPlan.map((item, i) => (
                    <motion.div key={item.day} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex items-start gap-3 rounded-sm border border-[#1F2430] bg-[#12161F] px-3.5 py-2.5">
                      <span className="mt-0.5 min-w-[56px] text-[10px] font-semibold text-[#E6E8EB] uppercase tracking-wider">{item.day}</span>
                      <span className="text-sm text-[#E6E8EB]">{item.task}</span>
                    </motion.div>
                  ))}</div></div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
