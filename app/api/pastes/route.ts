import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, ttl_seconds, max_views } = body;

    // Validation
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required and must be a non-empty string.' }, { status: 400 });
    }

    if (ttl_seconds !== undefined) {
      if (!Number.isInteger(ttl_seconds) || ttl_seconds < 1) {
        return NextResponse.json({ error: 'ttl_seconds must be an integer >= 1.' }, { status: 400 });
      }
    }

    if (max_views !== undefined) {
      if (!Number.isInteger(max_views) || max_views < 1) {
        return NextResponse.json({ error: 'max_views must be an integer >= 1.' }, { status: 400 });
      }
    }

    const store = getStore();
    const id = await store.createPaste({
      content,
      ttl_seconds,
      max_views
    });

    // Construct URL
    // We can use the request.url to determine the host, or generic logic
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const url = `${protocol}://${host}/p/${id}`;

    return NextResponse.json({ id, url }, { status: 201 });

  } catch (error) {
    console.error("Error creating paste:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
