import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { generateTokenPair, setRefreshCookie, clearRefreshCookie, getRefreshCookie, verifyRefreshToken, hashToken } from '@/lib/auth';
import { success, error } from '@/lib/api-response';
import { withAuth } from '@/lib/api-helpers';

const BCRYPT_ROUNDS = 12;

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.pathname.split('/').pop();

    if (action === 'register') return handleRegister(request);
    if (action === 'login') return handleLogin(request);
    if (action === 'refresh') return handleRefresh();
    if (action === 'logout') return handleLogout();

    return error('Unknown auth action', 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Auth error';
    return error(message, 500);
  }
}

export async function GET(request: Request) {
  return withAuth(request, async (user) => {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
    });
    if (!dbUser) return error('User not found', 404);
    return success({ user: dbUser });
  });
}

async function handleRegister(request: Request) {
  const { name, email, password } = await request.json();
  if (!name || !email || !password) return error('Name, email, and password are required', 400);
  if (password.length < 8) return error('Password must be at least 8 characters', 400);

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return error('An account with this email already exists', 409);

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), password: hashedPassword },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  const { accessToken, refreshToken } = await generateTokenPair(user);
  await setRefreshCookie(refreshToken);

  return success({ user, accessToken }, 201, 'Account created successfully');
}

async function handleLogin(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) return error('Email and password are required', 400);

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return error('Invalid email or password', 401);

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return error('Invalid email or password', 401);

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt };
  const { accessToken, refreshToken } = await generateTokenPair(safeUser);
  await setRefreshCookie(refreshToken);

  return success({ user: safeUser, accessToken }, 200, 'Logged in successfully');
}

async function handleRefresh() {
  const oldRefreshToken = await getRefreshCookie();
  if (!oldRefreshToken) return error('Refresh token is required', 401);

  let decoded;
  try { decoded = await verifyRefreshToken(oldRefreshToken); } catch { return error('Invalid or expired refresh token', 401); }

  const tokenHash = hashToken(oldRefreshToken);
  const storedToken = await prisma.refreshToken.findFirst({ where: { tokenHash } });

  if (!storedToken) {
    await prisma.refreshToken.deleteMany({ where: { userId: decoded.userId } });
    return error('Refresh token has been revoked', 401);
  }

  if (new Date(storedToken.expiresAt) < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    return error('Refresh token has expired', 401);
  }

  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });
  if (!user) return error('User no longer exists', 401);

  const { accessToken, refreshToken } = await generateTokenPair(user);
  await setRefreshCookie(refreshToken);

  return success({ user, accessToken }, 200, 'Token refreshed');
}

async function handleLogout() {
  const refreshToken = await getRefreshCookie();
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }
  await clearRefreshCookie();
  return success(null, 200, 'Logged out successfully');
}
