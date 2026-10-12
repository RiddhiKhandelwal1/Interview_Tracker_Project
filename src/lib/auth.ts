/**
 * Authentication utilities for JWT token management.
 * Uses 'jose' library (Web Crypto API based) which works in Edge and Node.js runtimes.
 * Access tokens are short-lived (15m), refresh tokens are long-lived (7d) in httpOnly cookies.
 */

import { SignJWT, jwtVerify } from 'jose';
import { createHash } from 'crypto';
import { cookies } from 'next/headers';
import prisma from './prisma';

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!);
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  userId: number;
  role: string;
}

export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(ACCESS_EXPIRES)
    .setIssuedAt()
    .sign(ACCESS_SECRET);
}

export async function generateRefreshToken(payload: { userId: number; tokenId: number }): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(REFRESH_EXPIRES)
    .setIssuedAt()
    .sign(REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload as unknown as TokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<{ userId: number; tokenId: number }> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as unknown as { userId: number; tokenId: number };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function generateTokenPair(user: { id: number; role: string }) {
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_MS);
  const tokenRecord = await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: 'pending', expiresAt },
  });

  const accessToken = await generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = await generateRefreshToken({ userId: user.id, tokenId: tokenRecord.id });
  const tokenHash = hashToken(refreshToken);

  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: { tokenHash },
  });

  return { accessToken, refreshToken };
}

export function getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  };
}

/** Extract and verify user from Authorization header. Returns null if invalid. */
export async function getAuthUser(request: Request): Promise<TokenPayload | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

/** Require auth - throws NextResponse error if not authenticated */
export async function requireAuth(request: Request): Promise<TokenPayload> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function setRefreshCookie(refreshToken: string) {
  const cookieStore = await cookies();
  cookieStore.set('refreshToken', refreshToken, getRefreshCookieOptions());
}

export async function clearRefreshCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('refreshToken');
}

export async function getRefreshCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('refreshToken')?.value;
}
