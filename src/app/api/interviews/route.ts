import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const interviews = await prisma.interview.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });
    const data = interviews.map((i) => ({
      id: i.id, userId: i.userId, company: i.company, role: i.role,
      status: i.status, interviewStage: i.interviewStage,
      applicationDate: i.applicationDate, interviewDate: i.interviewDate,
      jobUrl: i.jobUrl, notes: i.notes, result: i.result,
      nextAction: i.nextAction, nextActionDate: i.nextActionDate,
      createdAt: i.createdAt, updatedAt: i.updatedAt,
    }));
    return success(data);
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const body = await request.json();
    if (!body.company) return error('Company is required', 400);
    const interview = await prisma.interview.create({
      data: {
        userId: user.userId, company: body.company,
        role: body.role || null, status: body.status || 'applied',
        interviewStage: body.interviewStage || null,
        applicationDate: body.applicationDate ? new Date(body.applicationDate) : null,
        interviewDate: body.interviewDate ? new Date(body.interviewDate) : null,
        jobUrl: body.jobUrl || null, notes: body.notes || null,
        result: body.result || null, nextAction: body.nextAction || null,
        nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : null,
      },
    });
    return success({
      id: interview.id, userId: interview.userId, company: interview.company,
      role: interview.role, status: interview.status,
      interviewStage: interview.interviewStage,
      applicationDate: interview.applicationDate, interviewDate: interview.interviewDate,
      jobUrl: interview.jobUrl, notes: interview.notes, result: interview.result,
      nextAction: interview.nextAction, nextActionDate: interview.nextActionDate,
      createdAt: interview.createdAt, updatedAt: interview.updatedAt,
    }, 201, 'Interview created');
  });
}
