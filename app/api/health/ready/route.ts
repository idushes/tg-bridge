import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

/** Kubernetes readiness: DB reachable (same dependency as app traffic). */
export async function GET() {
  try {
    const sql = getSql();
    await sql`select 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
