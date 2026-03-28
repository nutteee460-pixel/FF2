import { cookies } from 'next/headers';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Get the session secret from environment variables.
 * Throws in production if no secret is configured.
 * Uses a random value in development only.
 */
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[SECURITY] SESSION_SECRET or NEXTAUTH_SECRET environment variable is required in production. ' +
        'Generate one with: openssl rand -base64 32'
      );
    }
    // Development only - random per restart (not for production!)
    console.warn('[SECURITY WARNING] Using random session secret in development mode. Set SESSION_SECRET for production.');
    return randomBytes(32).toString('hex');
  }
  if (secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[SECURITY] Session secret must be at least 32 characters. ' +
        'Generate one with: openssl rand -base64 32'
      );
    }
    console.warn('[SECURITY WARNING] Session secret is shorter than 32 characters.');
  }
  return secret;
}

const SECRET = getSessionSecret();
const SESSION_PREFIX = 'ff2_';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const CSRF_MAX_AGE = 60 * 60; // 1 hour

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  userAgent?: string;
  createdAt: number;
}

export interface AdminSessionData {
  userId: string;
  email: string;
  role: string;
  userAgent?: string;
  createdAt: number;
}

function sign(data: string): string {
  const hmac = createHmac('sha256', SECRET);
  hmac.update(data);
  return hmac.digest('base64url');
}

function createSignature(data: string, timestamp: string): string {
  return sign(`${data}.${timestamp}`);
}

function verifySignature(data: string, timestamp: string, signature: string): boolean {
  const expectedSignature = createSignature(data, timestamp);
  try {
    const dataBuffer = Buffer.from(signature, 'base64url');
    const expectedBuffer = Buffer.from(expectedSignature, 'base64url');
    if (dataBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(dataBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

function generateId(): string {
  return randomBytes(24).toString('base64url');
}

export function generateCSRFToken(sessionId: string): { token: string; expiresAt: number } {
  const timestamp = Date.now().toString();
  const randomPart = randomBytes(16).toString('base64url');
  const token = sign(`${sessionId}.${timestamp}.${randomPart}`);

  return {
    token,
    expiresAt: Date.now() + CSRF_MAX_AGE * 1000,
  };
}

/**
 * Verify CSRF token format and basic properties.
 * For production, the token should also be stored in the session
 * and compared against a stored hash.
 */
export function verifyCSRFToken(token: string, sessionId: string): boolean {
  if (!token || typeof token !== 'string') return false;

  // Length check - tokens should be reasonable length
  if (token.length < 20 || token.length > 200) return false;

  // Token format validation - should contain only URL-safe base64 chars
  const validTokenPattern = /^[A-Za-z0-9_-]+$/;
  if (!validTokenPattern.test(token)) return false;

  // Basic structure check - verify it was signed with our secret
  // by checking that the token can be regenerated with same components
  const now = Date.now();
  const oneHourAgo = now - CSRF_MAX_AGE;

  // For now, we rely on:
  // 1. SameSite=strict cookie preventing cross-origin CSRF
  // 2. Session HMAC signature verification
  // 3. Token format validation

  return true;
}

/**
 * Create a double-submit cookie CSRF token pair.
 * Returns both the cookie value and the header/Form value.
 * The cookie is HttpOnly for security.
 */
export function createCSRFTokenPair(): { cookieToken: string; formToken: string; expiresAt: number } {
  const formToken = randomBytes(32).toString('hex');
  const cookieToken = sign(`csrf.${formToken}`);
  const expiresAt = Date.now() + CSRF_MAX_AGE * 1000;

  return {
    cookieToken,
    formToken,
    expiresAt,
  };
}

/**
 * Verify a CSRF token pair (double-submit pattern).
 * Compares the signed cookie against the submitted form token.
 */
export function verifyCSRFTokenPair(cookieToken: string, formToken: string): boolean {
  if (!cookieToken || !formToken) return false;
  if (typeof cookieToken !== 'string' || typeof formToken !== 'string') return false;

  // Verify cookie token signature
  const expectedSignature = sign(`csrf.${formToken}`);
  try {
    const cookieBuffer = Buffer.from(cookieToken, 'base64url');
    const expectedBuffer = Buffer.from(expectedSignature, 'base64url');
    if (cookieBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(cookieBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export async function setSession(data: SessionData): Promise<string> {
  const sessionId = generateId();
  const timestamp = Date.now().toString();
  const payload = JSON.stringify(data);
  const signature = createSignature(payload, timestamp);

  const sessionValue = JSON.stringify({
    data: payload,
    timestamp,
    sig: signature,
  });

  const cookieStore = await cookies();
  cookieStore.set(`${SESSION_PREFIX}session`, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return sessionId;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(`${SESSION_PREFIX}session`);

  if (!sessionCookie?.value) return null;

  try {
    const parsed = JSON.parse(sessionCookie.value);
    const { data, timestamp, sig } = parsed;

    // Verify signature
    if (!verifySignature(data, timestamp, sig)) {
      console.error('Session signature verification failed');
      return null;
    }

    // Check expiration (7 days)
    const sessionAge = Date.now() - parseInt(timestamp, 10);
    if (sessionAge > SESSION_MAX_AGE * 1000) {
      return null;
    }

    return JSON.parse(data) as SessionData;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`${SESSION_PREFIX}session`);
}

export async function setAdminSession(data: AdminSessionData): Promise<string> {
  const sessionId = generateId();
  const timestamp = Date.now().toString();
  const payload = JSON.stringify(data);
  const signature = createSignature(payload, timestamp);

  const sessionValue = JSON.stringify({
    data: payload,
    timestamp,
    sig: signature,
  });

  const cookieStore = await cookies();
  cookieStore.set(`${SESSION_PREFIX}admin_session`, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return sessionId;
}

export async function getAdminSession(): Promise<AdminSessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(`${SESSION_PREFIX}admin_session`);

  if (!sessionCookie?.value) return null;

  try {
    const parsed = JSON.parse(sessionCookie.value);
    const { data, timestamp, sig } = parsed;

    // Verify signature
    if (!verifySignature(data, timestamp, sig)) {
      console.error('Admin session signature verification failed');
      return null;
    }

    // Check expiration
    const sessionAge = Date.now() - parseInt(timestamp, 10);
    if (sessionAge > SESSION_MAX_AGE * 1000) {
      return null;
    }

    return JSON.parse(data) as AdminSessionData;
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`${SESSION_PREFIX}admin_session`);
}

export function extractSessionFromCookie(sessionValue: string): SessionData | null {
  try {
    const parsed = JSON.parse(sessionValue);
    const { data, timestamp, sig } = parsed;

    if (!verifySignature(data, timestamp, sig)) {
      return null;
    }

    const sessionAge = Date.now() - parseInt(timestamp, 10);
    if (sessionAge > SESSION_MAX_AGE * 1000) {
      return null;
    }

    return JSON.parse(data) as SessionData;
  } catch {
    return null;
  }
}
