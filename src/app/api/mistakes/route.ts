import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const sp = request.nextUrl.searchParams;
    const type = sp.get('type') || undefined;
    const topic = sp.get('topic') || undefined;
    const difficulty = sp.get('difficulty') || undefined;

    const where: Record<string, unknown> = { userId: user.userId };
    if (type) where.type = type;
    if (difficulty || topic) {
      where.problem = {};
      if (difficulty) (where.problem as Record<string, unknown>).difficulty = difficulty;
      if (topic) (where.problem as Record<string, unknown>).problemTopics = { some: { topic: { name: topic } } };
    }

    const mistakes = await prisma.mistake.findMany({
      where: where as never,
      include: {
        problem: { include: { problemTopics: { include: { topic: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = mistakes.map((m) => ({
      id: m.id, problemId: m.problemId, problemTitle: m.problem.title,
      topic: m.problem.problemTopics[0]?.topic?.name || null,
      difficulty: m.problem.difficulty,
      type: m.type, notes: m.notes, createdAt: m.createdAt,
    }));

    // Analytics
    const typeCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = {};
    mistakes.forEach((m) => {
      typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
      const t = m.problem.problemTopics[0]?.topic?.name || 'Unknown';
      topicCounts[t] = (topicCounts[t] || 0) + 1;
      difficultyCounts[m.problem.difficulty] = (difficultyCounts[m.problem.difficulty] || 0) + 1;
    });

    const totalMistakes = mistakes.length;
    const analytics = totalMistakes >= 3 ? {
      mostCommonType: Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      mostAffectedTopic: Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null,
      typeDistribution: Object.entries(typeCounts).map(([type, count]) => ({
        type, count, percentage: Math.round((count / totalMistakes) * 100),
      })).sort((a, b) => b.count - a.count),
      topicDistribution: Object.entries(topicCounts).map(([topic, count]) => ({
        topic, count,
      })).sort((a, b) => b.count - a.count),
    } : null;

    return success({ mistakes: data, analytics, totalCount: totalMistakes });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const { problemId, type, notes } = await request.json();
    if (!problemId || !type) return error('problemId and type are required', 400);

    const problem = await prisma.problem.findFirst({ where: { id: problemId, userId: user.userId } });
    if (!problem) return error('Problem not found', 404);

    const mistake = await prisma.mistake.create({
      data: { userId: user.userId, problemId, type, notes: notes || null },
      include: {
        problem: { include: { problemTopics: { include: { topic: true } } } },
      },
    });

    // Also shorten revision interval if exists (connect features)
    const revision = await prisma.problemRevision.findUnique({
      where: { userId_problemId: { userId: user.userId, problemId } },
    });
    if (revision) {
      const shorterInterval = Math.max(1, Math.floor(revision.intervalDays / 2));
      await prisma.problemRevision.update({
        where: { id: revision.id },
        data: {
          intervalDays: shorterInterval,
          nextReviewAt: new Date(Date.now() + shorterInterval * 24 * 60 * 60 * 1000),
          confidence: Math.max(1, revision.confidence - 1),
        },
      });
    }

    return success({
      id: mistake.id, problemId: mistake.problemId, problemTitle: mistake.problem.title,
      topic: mistake.problem.problemTopics[0]?.topic?.name || null,
      difficulty: mistake.problem.difficulty,
      type: mistake.type, notes: mistake.notes, createdAt: mistake.createdAt,
    }, 201, 'Mistake recorded');
  });
}
