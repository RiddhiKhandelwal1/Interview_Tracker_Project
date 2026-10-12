import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const problem = await prisma.problem.findFirst({
      where: { id: parseInt(id), userId: user.userId },
      include: { problemTopics: { include: { topic: true } } },
    });
    if (!problem) return error('Problem not found', 404);
    return success({
      id: problem.id, userId: problem.userId, title: problem.title,
      difficulty: problem.difficulty, status: problem.status, solved: problem.status === 'solved',
      platform: problem.platform, url: problem.url, notes: problem.notes,
      topic: problem.problemTopics[0]?.topic?.name || null,
      isFavourite: problem.isFavourite, dateSolved: problem.dateSolved,
      revisionDate: problem.revisionDate, version: problem.version,
      createdAt: problem.createdAt, updatedAt: problem.updatedAt,
    });
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const body = await request.json();
    const { version, topic, ...updateData } = body;
    const problemId = parseInt(id);

    const problem = await prisma.$transaction(async (tx) => {
      const data: Record<string, unknown> = {};
      if (updateData.title !== undefined) data.title = updateData.title;
      if (updateData.difficulty !== undefined) data.difficulty = updateData.difficulty;
      if (updateData.status !== undefined) {
        data.status = updateData.status;
        if (updateData.status === 'solved') data.dateSolved = new Date();
      }
      if (updateData.platform !== undefined) data.platform = updateData.platform;
      if (updateData.url !== undefined) data.url = updateData.url || null;
      if (updateData.notes !== undefined) data.notes = updateData.notes || null;
      if (updateData.isFavourite !== undefined) data.isFavourite = updateData.isFavourite;
      if (updateData.dateSolved !== undefined) data.dateSolved = updateData.dateSolved ? new Date(updateData.dateSolved) : null;
      if (updateData.revisionDate !== undefined) data.revisionDate = updateData.revisionDate ? new Date(updateData.revisionDate) : null;

      // Optimistic concurrency
      const result = await tx.problem.updateMany({
        where: { id: problemId, userId: user.userId, ...(version ? { version } : {}) },
        data: { ...data, version: { increment: 1 } } as never,
      });
      if (result.count === 0) return null;

      // Update topic
      if (topic !== undefined) {
        await tx.problemTopic.deleteMany({ where: { problemId } });
        if (topic) {
          const t = await tx.topic.upsert({ where: { name: topic }, create: { name: topic }, update: {} });
          await tx.problemTopic.create({ data: { problemId, topicId: t.id } });
        }
      }

      return tx.problem.findUnique({
        where: { id: problemId },
        include: { problemTopics: { include: { topic: true } } },
      });
    });

    if (!problem) {
      const exists = await prisma.problem.findFirst({ where: { id: problemId, userId: user.userId } });
      if (!exists) return error('Problem not found', 404);
      return error('Conflict: this problem was modified by another session', 409);
    }

    return success({
      id: problem.id, userId: problem.userId, title: problem.title,
      difficulty: problem.difficulty, status: problem.status, solved: problem.status === 'solved',
      platform: problem.platform, url: problem.url, notes: problem.notes,
      topic: problem.problemTopics[0]?.topic?.name || null,
      isFavourite: problem.isFavourite, dateSolved: problem.dateSolved,
      revisionDate: problem.revisionDate, version: problem.version,
      createdAt: problem.createdAt, updatedAt: problem.updatedAt,
    }, 200, 'Problem updated');
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const result = await prisma.problem.deleteMany({ where: { id: parseInt(id), userId: user.userId } });
    if (result.count === 0) return error('Problem not found', 404);
    return success(null, 200, 'Problem deleted');
  });
}
