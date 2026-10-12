import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const body = await request.json();
    const existing = await prisma.note.findFirst({ where: { id: parseInt(id), userId: user.userId } });
    if (!existing) return error('Note not found', 404);
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.content !== undefined) data.content = body.content;
    if (body.tags !== undefined) data.tags = body.tags;
    if (body.problemId !== undefined) data.problemId = body.problemId || null;
    if (body.revisionDate !== undefined) data.revisionDate = body.revisionDate ? new Date(body.revisionDate) : null;
    const note = await prisma.note.update({
      where: { id: parseInt(id) },
      data: data as never,
      include: { problem: { select: { id: true, title: true } } },
    });
    return success({
      id: note.id, userId: note.userId, title: note.title, content: note.content,
      tags: note.tags, problemId: note.problemId,
      problemTitle: note.problem?.title || null,
      revisionDate: note.revisionDate, createdAt: note.createdAt, updatedAt: note.updatedAt,
    });
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const result = await prisma.note.deleteMany({ where: { id: parseInt(id), userId: user.userId } });
    if (result.count === 0) return error('Note not found', 404);
    return success(null, 200, 'Note deleted');
  });
}
