import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { success, error } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';
import { writeFile, mkdir, unlink, readFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    const resumes = await prisma.resume.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });
    return success(resumes.map((r) => ({
      id: r.id, userId: r.userId, fileName: r.originalName,
      fileId: r.generatedName, description: r.description,
      fileSize: r.fileSize, mimeType: r.mimeType,
      uploadDate: r.createdAt, createdAt: r.createdAt,
    })));
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const description = formData.get('description') as string | null;
    if (!file) return error('No file uploaded', 400);

    await mkdir(UPLOAD_DIR, { recursive: true });
    const generatedName = `${uuidv4()}-${file.name}`;
    const filePath = path.join(UPLOAD_DIR, generatedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const resume = await prisma.resume.create({
      data: {
        userId: user.userId, originalName: file.name,
        generatedName, filePath, fileSize: file.size,
        mimeType: file.type || 'application/pdf',
        description: description || null,
      },
    });
    return success({
      id: resume.id, userId: resume.userId, fileName: resume.originalName,
      fileId: resume.generatedName, description: resume.description,
      fileSize: resume.fileSize, mimeType: resume.mimeType,
      uploadDate: resume.createdAt, createdAt: resume.createdAt,
    }, 201, 'Resume uploaded');
  });
}
