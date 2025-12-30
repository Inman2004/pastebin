import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export async function GET() {
  const store = getStore();
  const isHealthy = await store.healthCheck();

  if (isHealthy) {
    return NextResponse.json({ ok: true }, { status: 200 });
  } else {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
