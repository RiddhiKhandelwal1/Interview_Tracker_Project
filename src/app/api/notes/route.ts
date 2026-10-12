import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const notes = await prisma.note.findMany({
      where: { userId: user.userId },
      include: { problem: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const data = notes.map((n) => ({
      id: n.id, userId: n.userId, title: n.title, content: n.content,
      tags: n.tags, problemId: n.problemId,
      problemTitle: n.problem?.title || null,
      revisionDate: n.revisionDate, createdAt: n.createdAt, updatedAt: n.updatedAt,
    }));
    return success(data);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const { title, content, tags, problemId, revisionDate } = await request.json();
    if (!title || !content) return error('Title and content are required', 400);
    const note = await prisma.note.create({
      data: {
        userId: user.userId, title, content,
        tags: tags || null, problemId: problemId || null,
        revisionDate: revisionDate ? new Date(revisionDate) : null,
      },
      include: { problem: { select: { id: true, title: true } } },
    });
    return success({
      id: note.id, userId: note.userId, title: note.title, content: note.content,
      tags: note.tags, problemId: note.problemId,
      problemTitle: note.problem?.title || null,
      revisionDate: note.revisionDate, createdAt: note.createdAt, updatedAt: note.updatedAt,
    }, 201, 'Note created');
  });
}
