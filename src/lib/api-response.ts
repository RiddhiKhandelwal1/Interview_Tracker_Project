import { NextResponse } from 'next/server';

export function success(data: unknown = null, status = 200, message = 'OK') {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function error(message: string, status = 500) {
  return NextResponse.json({ success: false, message }, { status });
}

export function authError(message = 'Authentication required') {
  return NextResponse.json({ success: false, message }, { status: 401 });
}
