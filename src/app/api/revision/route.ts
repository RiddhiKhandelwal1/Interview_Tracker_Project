import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';

// Spaced repetition intervals in days
const INTERVALS = [2, 7, 14, 30, 60];

function getNextInterval(currentInterval: number, struggled: boolean): number {
  if (struggled) return Math.max(1, Math.floor(currentInterval / 2));
  const idx = INTERVALS.indexOf(currentInterval);
  if (idx === -1) return INTERVALS.find((i) => i > currentInterval) || 60;
  return INTERVALS[Math.min(idx + 1, INTERVALS.length - 1)];
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const revisions = await prisma.problemRevision.findMany({
      where: { userId: user.userId },
      include: {
        problem: { include: { problemTopics: { include: { topic: true } } } },
      },
      orderBy: { nextReviewAt: 'asc' },
    });

    const now = new Date();
    const dueToday = revisions.filter((r) => r.nextReviewAt <= now);
    const upcoming = revisions.filter((r) => r.nextReviewAt > now);

    const data = revisions.map((r) => ({
      id: r.id, problemId: r.problemId,
      problemTitle: r.problem.title,
      topic: r.problem.problemTopics[0]?.topic?.name || null,
      difficulty: r.problem.difficulty,
      reviewCount: r.reviewCount, confidence: r.confidence,
      lastReviewedAt: r.lastReviewedAt, nextReviewAt: r.nextReviewAt,
      intervalDays: r.intervalDays,
      isDue: r.nextReviewAt <= now,
    }));

    return success({ revisions: data, dueCount: dueToday.length, upcomingCount: upcoming.length });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const { problemId } = await request.json();
    if (!problemId) return error('problemId is required', 400);

    // Check problem exists and belongs to user
    const problem = await prisma.problem.findFirst({ where: { id: problemId, userId: user.userId } });
    if (!problem) return error('Problem not found', 404);

    // Check if revision already exists
    const existing = await prisma.problemRevision.findUnique({
      where: { userId_problemId: { userId: user.userId, problemId } },
    });
    if (existing) return error('Revision already exists for this problem', 409);

    const revision = await prisma.problemRevision.create({
      data: {
        userId: user.userId, problemId,
        nextReviewAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        intervalDays: 2,
      },
    });
    return success(revision, 201, 'Revision scheduled');
  });
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (user) => {
    const { revisionId, action } = await request.json();
    if (!revisionId || !action) return error('revisionId and action are required', 400);

    const revision = await prisma.problemRevision.findFirst({
      where: { id: revisionId, userId: user.userId },
    });
    if (!revision) return error('Revision not found', 404);

    const struggled = action === 'struggled';
    const newInterval = getNextInterval(revision.intervalDays, struggled);
    const newConfidence = struggled
      ? Math.max(1, revision.confidence - 1)
      : Math.min(5, revision.confidence + 1);

    const updated = await prisma.problemRevision.update({
      where: { id: revisionId },
      data: {
        reviewCount: { increment: 1 },
        confidence: newConfidence,
        lastReviewedAt: new Date(),
        nextReviewAt: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000),
        intervalDays: newInterval,
      },
    });

    return success(updated, 200, struggled ? 'Review recorded — will review sooner' : 'Great job! Next review scheduled');
  });
}
