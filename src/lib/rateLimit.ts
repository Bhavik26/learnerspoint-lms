/**
 * In-Memory Rate Limiting Helper for API Security Hardening
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = store.get(identifier);

  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    store.set(identifier, { count: 1, resetTime });
    return { success: true, limit, remaining: limit - 1, resetTime };
  }

  if (record.count >= limit) {
    return { success: false, limit, remaining: 0, resetTime: record.resetTime };
  }

  record.count += 1;
  return { success: true, limit, remaining: limit - record.count, resetTime: record.resetTime };
}
