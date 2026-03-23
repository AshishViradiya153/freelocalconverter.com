import { NextResponse } from "next/server";

/**
 * In-memory friendly rate limiting stub (always allows).
 * Add your own store-backed limiter here if you need production limits without env files.
 */
export async function checkRateLimit(_req?: Request) {
  return { success: true as const };
}

export function rateLimitResponse(result: {
  limit?: number;
  reset?: number;
  remaining?: number;
}) {
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(result.limit ?? 30),
        "X-RateLimit-Remaining": String(result.remaining ?? 0),
        "X-RateLimit-Reset": String(result.reset ?? Date.now()),
      },
    },
  );
}
