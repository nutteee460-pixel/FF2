import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/session';
import { registerApiSchema } from '@/lib/schemas';

export async function POST(request: Request) {
  try {
    // Rate limiting for registration
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const now = Date.now();
    const key = `register_${clientIp}`;

    const regAttempts = globalThis as unknown as { regAttempts: Record<string, { count: number; resetAt: number }> };
    if (!regAttempts.regAttempts) {
      regAttempts.regAttempts = {};
    }

    const attempt = regAttempts.regAttempts[key];
    if (attempt && attempt.resetAt > now) {
      if (attempt.count >= 3) {
        return NextResponse.json(
          {
            message: 'มีการพยายามสมัครสมาชิกมากเกินไป กรุณารอ ' +
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
      regAttempts.regAttempts[key] = {
        count: 1,
        resetAt: now + 60000, // 1 minute window
      };
    }

    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = registerApiSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const validated = validationResult.data;
    const { email, password, accountType } = validated;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'อีเมลนี้มีผู้ใช้งานแล้ว' },
        { status: 400 }
      );
    }

    // Hash password with strong salt rounds
    const hashedPassword = await bcrypt.hash(password, 12);

    // Determine account type
    const type = accountType === 'POSTER' ? 'POSTER' : 'BUYER';

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        accountType: type,
      },
    });

    // Create session
    await setSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      createdAt: Date.now(),
    });

    return NextResponse.json(
      { message: 'สมัครสมาชิกสำเร็จ', userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register error:', error);

    let message = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
    if (error?.code === 'P2002') {
      message = 'อีเมลนี้มีผู้ใช้งานแล้ว';
    }

    return NextResponse.json({ message }, { status: 500 });
  }
}
