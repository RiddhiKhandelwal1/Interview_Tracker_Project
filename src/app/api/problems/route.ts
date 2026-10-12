import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const sp = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(sp.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '100')));
    const offset = (page - 1) * limit;
    const difficulty = sp.get('difficulty') || undefined;
    const status = sp.get('status') || undefined;
    const platform = sp.get('platform') || undefined;
    const topic = sp.get('topic') || undefined;
    const search = sp.get('search') || undefined;
    const isFavourite = sp.get('isFavourite');

    const where: Record<string, unknown> = { userId: user.userId };
    if (difficulty) where.difficulty = difficulty;
    if (status) where.status = status;
    if (platform) where.platform = platform;
    if (isFavourite !== null && isFavourite !== undefined) where.isFavourite = isFavourite === 'true';
    if (search) where.title = { contains: search };
    if (topic) {
      where.problemTopics = { some: { topic: { name: topic } } };
    }

    const [problems, totalCount] = await Promise.all([
      prisma.problem.findMany({
        where: where as never,
        include: { problemTopics: { include: { topic: true } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.problem.count({ where: where as never }),
    ]);

    const data = problems.map((p) => ({
      id: p.id, userId: p.userId, title: p.title, difficulty: p.difficulty,
      status: p.status, solved: p.status === 'solved', platform: p.platform,
      url: p.url, notes: p.notes,
      topic: p.problemTopics[0]?.topic?.name || null,
      isFavourite: p.isFavourite, dateSolved: p.dateSolved,
      revisionDate: p.revisionDate, version: p.version,
      createdAt: p.createdAt, updatedAt: p.updatedAt,
    }));

    return success({ data, meta: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) } });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const body = await request.json();
    const { title, difficulty, status: pStatus, platform, url, notes, topic, isFavourite, dateSolved, revisionDate } = body;
    if (!title) return error('Title is required', 400);

    const problem = await prisma.$transaction(async (tx) => {
      const created = await tx.problem.create({
        data: {
          userId: user.userId, title,
          difficulty: difficulty || 'easy', status: pStatus || 'pending',
          platform: platform || 'leetcode', url: url || null,
          notes: notes || null, isFavourite: isFavourite || false,
          dateSolved: dateSolved ? new Date(dateSolved) : null,
          revisionDate: revisionDate ? new Date(revisionDate) : null,
        },
      });
      if (topic) {
        const t = await tx.topic.upsert({ where: { name: topic }, create: { name: topic }, update: {} });
        await tx.problemTopic.create({ data: { problemId: created.id, topicId: t.id } });
      }
      return tx.problem.findUnique({
        where: { id: created.id },
        include: { problemTopics: { include: { topic: true } } },
      });
    });

    if (!problem) return error('Failed to create problem', 500);
    return success({
      id: problem.id, userId: problem.userId, title: problem.title,
      difficulty: problem.difficulty, status: problem.status, solved: problem.status === 'solved',
      platform: problem.platform, url: problem.url, notes: problem.notes,
      topic: problem.problemTopics[0]?.topic?.name || null,
      isFavourite: problem.isFavourite, dateSolved: problem.dateSolved,
      revisionDate: problem.revisionDate, version: problem.version,
      createdAt: problem.createdAt, updatedAt: problem.updatedAt,
    }, 201, 'Problem created');
  });
}
