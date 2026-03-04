type CounterEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

const counters = new Map<string, CounterEntry>();

function getDefaultLimit(): number {
  const parsed = Number(process.env.AI_RATE_LIMIT_PER_MIN);
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.floor(parsed);
}

export function checkAiRateLimit(
  key: string,
  options?: { limit?: number; windowMs?: number },
): RateLimitResult {
  const limit = options?.limit ?? getDefaultLimit();
  const windowMs = options?.windowMs ?? 60_000;

  const now = Date.now();
  const current = counters.get(key);

  if (!current || current.resetAt <= now) {
    counters.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  counters.set(key, current);

  return {
    allowed: true,
    limit,
    remaining: limit - current.count,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'Retry-After': String(result.retryAfterSeconds),
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
  };
}
