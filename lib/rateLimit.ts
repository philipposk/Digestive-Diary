import { NextRequest } from 'next/server';

// In-memory token bucket. Single-process; resets on cold start.
// Production-grade rate limiting needs a shared store (Upstash Redis or similar) —
// migration: swap the Map for a Redis call keyed on bucket+ip with the same algo.

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xreal = req.headers.get('x-real-ip');
  if (xreal) return xreal.trim();
  return 'unknown';
}

export interface RateLimitOptions {
  bucket: string;
  capacity?: number;       // max tokens
  refillPerMinute?: number; // tokens refilled per minute
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec?: number;
}

export function rateLimit(req: NextRequest, opts: RateLimitOptions): RateLimitResult {
  const capacity = opts.capacity ?? 10;
  const refill = opts.refillPerMinute ?? 10;
  const ip = getClientIp(req);
  const key = `${opts.bucket}:${ip}`;
  const now = Date.now();

  const existing = buckets.get(key);
  const refillRatePerMs = refill / 60_000;

  if (!existing) {
    buckets.set(key, { tokens: capacity - 1, lastRefill: now });
    return { ok: true, remaining: capacity - 1 };
  }

  const elapsed = now - existing.lastRefill;
  existing.tokens = Math.min(capacity, existing.tokens + elapsed * refillRatePerMs);
  existing.lastRefill = now;

  if (existing.tokens < 1) {
    const secsUntilOne = (1 - existing.tokens) / refillRatePerMs / 1000;
    return { ok: false, remaining: 0, retryAfterSec: Math.ceil(secsUntilOne) };
  }
  existing.tokens -= 1;
  return { ok: true, remaining: Math.floor(existing.tokens) };
}
