import { getAuthUser, TokenPayload } from './auth';
import { authError } from './api-response';
import { NextResponse } from 'next/server';

/** Wrapper that extracts auth and catches errors for API route handlers */
export async function withAuth(
  request: Request,
  handler: (user: TokenPayload, request: Request) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const user = await getAuthUser(request);
    if (!user) return authError();
    return await handler(user, request);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : message.includes('Conflict') ? 409 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
