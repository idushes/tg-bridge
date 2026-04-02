import { NextResponse } from 'next/server';

/** Kubernetes liveness: process responds; no external dependencies. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
