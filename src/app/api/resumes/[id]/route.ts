import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';
import { readFile, unlink } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const resume = await prisma.resume.findFirst({ where: { id: parseInt(id), userId: user.userId } });
    if (!resume) return error('Resume not found', 404);
    try {
      const filePath = path.join(UPLOAD_DIR, resume.generatedName);
      const buffer = await readFile(filePath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': resume.mimeType,
          'Content-Disposition': `attachment; filename="${resume.originalName}"`,
        },
      });
    } catch {
      return error('Resume file not found on disk', 404);
    }
  });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (user) => {
    const { id } = await params;
    const resume = await prisma.resume.findFirst({ where: { id: parseInt(id), userId: user.userId } });
    if (!resume) return error('Resume not found', 404);
    await prisma.resume.delete({ where: { id: parseInt(id) } });
    try { await unlink(path.join(UPLOAD_DIR, resume.generatedName)); } catch { /* file may already be gone */ }
    return success(null, 200, 'Resume deleted');
  });
}
