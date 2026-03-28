import { headers } from 'next/headers';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  });
  lastCleanup = now;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

function getIdentifier(): string {
  // In production, use IP address from headers
  // For server-side, we use a combination of factors
  return 'api_' + Date.now().toString(36);
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanupExpiredEntries();

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Initialize or reset if window expired
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetAt,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

// Pre-configured rate limit rules
export const RATE_LIMITS = {
  // Strict: 5 attempts per minute (login, register)
  AUTH_STRICT: { windowMs: 60 * 1000, maxRequests: 5 },

  // Moderate: 20 attempts per minute (general API)
  API_MODERATE: { windowMs: 60 * 1000, maxRequests: 20 },

  // Lenient: 100 attempts per minute (read operations)
  READ_LENIENT: { windowMs: 60 * 1000, maxRequests: 100 },

  // Per user: 10 requests per minute per user
  USER_ACTION: { windowMs: 60 * 1000, maxRequests: 10 },

  // Transfer: 10 transfers per hour
  TRANSFER: { windowMs: 60 * 60 * 1000, maxRequests: 10 },

  // Credit topup: 5 per hour
  CREDIT_TOPUP: { windowMs: 60 * 60 * 1000, maxRequests: 5 },
};

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.remaining.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
    ...(result.retryAfter
      ? { 'Retry-After': result.retryAfter.toString() }
      : {}),
  };
}

export function isRateLimited(
  identifier: string,
  action: keyof typeof RATE_LIMITS
): RateLimitResult {
  return rateLimit(`rate_${action}_${identifier}`, RATE_LIMITS[action]);
}
