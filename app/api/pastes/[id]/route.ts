import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';
import { getNow } from '@/lib/time';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getStore();
  const now = await getNow();

  const paste = await store.getPaste(id);

  if (!paste) {
    return NextResponse.json({ error: 'Paste not found' }, { status: 404 });
  }

  // Check TTL expiry
  // Note: Redis/In-Memory store handles basic expiration, but "x-test-now-ms" overrides time.
  // The store (Redis) might have already deleted it if using system time.
  // But if we are simulating time travel (past or future), we must check explicitly against `now`.

  // If `expires_at` is set, check against `now`.
  if (paste.expires_at && now > paste.expires_at) {
    return NextResponse.json({ error: 'Paste expired' }, { status: 404 });
  }

  // Check Max Views
  // If max_views is set, verify we haven't exceeded it.
  // The prompt says:
  // "Paste with max_views = 1: first fetch -> 200, second -> 404"
  // So we increment on fetch.
  // We need to check if views >= max_views BEFORE incrementing?
  // Or is "views" the number of times it HAS been viewed?
  // Usually:
  // 1. Check if views < max_views
  // 2. Increment views
  // 3. Return content

  if (paste.max_views !== undefined) {
    if (paste.views >= paste.max_views) {
       return NextResponse.json({ error: 'View limit exceeded' }, { status: 404 });
    }
  }

  // Increment view count
  // We do this asynchronously or block?
  // "Each successful API fetch counts as a view"
  // If we return successfully, we must count it.
  await store.incrementView(id);

  // Calculate remaining views
  let remaining_views = null;
  if (paste.max_views !== undefined) {
    // We just incremented, so subtract from max
    // Wait, `paste.views` is the OLD value from `getPaste`.
    // The new value is `paste.views + 1`.
    remaining_views = Math.max(0, paste.max_views - (paste.views + 1));
  }

  return NextResponse.json({
    content: paste.content,
    remaining_views,
    expires_at: paste.expires_at ? new Date(paste.expires_at).toISOString() : null
  });
}
