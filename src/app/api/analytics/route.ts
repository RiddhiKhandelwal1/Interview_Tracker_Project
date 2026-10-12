import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const [problems, interviews, solvedByDate, topicDist] = await Promise.all([
      prisma.problem.findMany({ where: { userId: user.userId }, include: { problemTopics: { include: { topic: true } } } }),
      prisma.interview.findMany({ where: { userId: user.userId } }),
      prisma.problem.groupBy({
        by: ['dateSolved'],
        where: { userId: user.userId, dateSolved: { not: null } },
        _count: true,
      }),
      prisma.problemTopic.findMany({
        where: { problem: { userId: user.userId, status: 'solved' } },
        include: { topic: true },
      }),
    ]);

    const total = problems.length;
    const solved = problems.filter((p) => p.status === 'solved').length;
    const attempted = problems.filter((p) => p.status === 'attempted').length;
    const revising = problems.filter((p) => p.status === 'revising').length;
    const pending = problems.filter((p) => p.status === 'pending').length;
    const easySolved = problems.filter((p) => p.difficulty === 'easy' && p.status === 'solved').length;
    const mediumSolved = problems.filter((p) => p.difficulty === 'medium' && p.status === 'solved').length;
    const hardSolved = problems.filter((p) => p.difficulty === 'hard' && p.status === 'solved').length;

    // Topic distribution
    const topicCounts: Record<string, number> = {};
    topicDist.forEach((pt) => { topicCounts[pt.topic.name] = (topicCounts[pt.topic.name] || 0) + 1; });
    const topicDistribution = Object.entries(topicCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    // Solving activity (last 30 days)
    const solvingActivity = solvedByDate
      .filter((s) => s.dateSolved)
      .map((s) => ({ date: s.dateSolved!.toISOString().split('T')[0], count: s._count }));

    // Streak calculation
    const solvedDates = new Set(solvingActivity.map((a) => a.date));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (solvedDates.has(key)) streak++;
      else if (i > 0) break;
    }

    // Interview summary
    const interviewSummary = {
      total: interviews.length,
      applied: interviews.filter((i) => i.status === 'applied').length,
      selected: interviews.filter((i) => i.status === 'selected').length,
      rejected: interviews.filter((i) => i.status === 'rejected').length,
    };

    return success({
      problems: { total, solved, attempted, revising, pending, easy: easySolved, medium: mediumSolved, hard: hardSolved },
      solvingActivity, topicDistribution, interviews: interviewSummary, streak,
    });
  });
}
