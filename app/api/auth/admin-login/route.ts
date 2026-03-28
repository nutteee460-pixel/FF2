import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setAdminSession } from '@/lib/session';
import { loginSchema } from '@/lib/schemas';

export async function POST(request: Request) {
  try {
    // Rate limiting for admin login
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const now = Date.now();
    const key = `admin_login_${clientIp}`;

    const adminAttempts = globalThis as unknown as { adminLoginAttempts: Record<string, { count: number; resetAt: number }> };
    if (!adminAttempts.adminLoginAttempts) {
      adminAttempts.adminLoginAttempts = {};
    }

    const attempt = adminAttempts.adminLoginAttempts[key];
    if (attempt && attempt.resetAt > now) {
      if (attempt.count >= 3) {
        return NextResponse.json(
          {
            message: 'มีการพยายามเข้าสู่ระบบหลังบ้านมากเกินไป กรุณารอ ' +
              Math.ceil((attempt.resetAt - now) / 1000) + ' วินาที'
          },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil((attempt.resetAt - now) / 1000).toString(),
            },
          }
        );
      }
      attempt.count++;
    } else {
      adminAttempts.adminLoginAttempts[key] = {
        count: 1,
        resetAt: now + 60000, // 1 minute window
      };
    }

    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Find admin user
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

    // Check if admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'คุณไม่มีสิทธิ์เข้าหลังบ้าน' },
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

    // Create signed admin session
    await setAdminSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      createdAt: Date.now(),
    });

    return NextResponse.json({
      message: 'เข้าสู่ระบบหลังบ้านสำเร็จ',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}
