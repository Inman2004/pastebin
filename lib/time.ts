import { headers } from 'next/headers';

/**
 * Returns the current time in milliseconds.
 * In production, this returns Date.now().
 * In test mode (TEST_MODE=1), it checks the 'x-test-now-ms' header.
 *
 * This function must be called within a Request Context (Server Component, Route Handler).
 */
export async function getNow(): Promise<number> {
  // If not in test mode, return system time immediately
  // This avoids overhead of calling headers() if not needed,
  // although headers() is generally fast.
  if (process.env.TEST_MODE !== '1') {
    return Date.now();
  }

  try {
    const headersList = await headers();
    const testNow = headersList.get('x-test-now-ms');
    if (testNow) {
      const parsed = parseInt(testNow, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    // Fallback if called outside of request context or other error
    console.warn('getNow called outside of request context or error accessing headers:', error);
  }

  return Date.now();
}
