import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const body = await request.json();
    const existing = await prisma.interview.findFirst({ where: { id: parseInt(id), userId: user.userId } });
    if (!existing) return error('Interview not found', 404);
    const data: Record<string, unknown> = {};
    if (body.company !== undefined) data.company = body.company;
    if (body.role !== undefined) data.role = body.role || null;
    if (body.status !== undefined) data.status = body.status;
    if (body.interviewStage !== undefined) data.interviewStage = body.interviewStage || null;
    if (body.applicationDate !== undefined) data.applicationDate = body.applicationDate ? new Date(body.applicationDate) : null;
    if (body.interviewDate !== undefined) data.interviewDate = body.interviewDate ? new Date(body.interviewDate) : null;
    if (body.jobUrl !== undefined) data.jobUrl = body.jobUrl || null;
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.result !== undefined) data.result = body.result || null;
    if (body.nextAction !== undefined) data.nextAction = body.nextAction || null;
    if (body.nextActionDate !== undefined) data.nextActionDate = body.nextActionDate ? new Date(body.nextActionDate) : null;
    const interview = await prisma.interview.update({ where: { id: parseInt(id) }, data: data as never });
    return success({
      id: interview.id, userId: interview.userId, company: interview.company,
      role: interview.role, status: interview.status,
      interviewStage: interview.interviewStage,
      applicationDate: interview.applicationDate, interviewDate: interview.interviewDate,
      jobUrl: interview.jobUrl, notes: interview.notes, result: interview.result,
      nextAction: interview.nextAction, nextActionDate: interview.nextActionDate,
      createdAt: interview.createdAt, updatedAt: interview.updatedAt,
    });
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const result = await prisma.interview.deleteMany({ where: { id: parseInt(id), userId: user.userId } });
    if (result.count === 0) return error('Interview not found', 404);
    return success(null, 200, 'Interview deleted');
  });
}
