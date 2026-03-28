import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setSession, extractSessionFromCookie } from '@/lib/session';
import { RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/schemas';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const rateLimitResult = RATE_LIMITS.AUTH_STRICT;
    const now = Date.now();
    const key = `login_${clientIp}`;

    // Simple in-memory rate limiting
    const loginAttempts = globalThis as unknown as { loginAttempts: Record<string, { count: number; resetAt: number }> };
    if (!loginAttempts.loginAttempts) {
      loginAttempts.loginAttempts = {};
    }

    const attempt = loginAttempts.loginAttempts[key];
    if (attempt && attempt.resetAt > now) {
      if (attempt.count >= 5) {
        return NextResponse.json(
          {
            message: 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอ ' +
              Math.ceil((attempt.resetAt - now) / 1000) + ' วินาที'
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((attempt.resetAt - now) / 1000).toString(),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }
      attempt.count++;
    } else {
      loginAttempts.loginAttempts[key] = {
        count: 1,
        resetAt: now + 60000, // 1 minute window
      };
    }

    const body = await request.json();

    // Validate input with Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Check if banned
    if (user.isBanned) {
      return NextResponse.json(
        { message: 'บัญชีนี้ถูกระงับการใช้งาน' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Create signed session
    await setSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
