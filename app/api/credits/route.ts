import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractSessionFromCookie } from '@/lib/session';
import { creditTopupSchema } from '@/lib/schemas';

// In-memory rate limiting for credits
const creditAttempts = new Map<string, { count: number; resetAt: number }>();

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ff2_session');
    if (!sessionCookie) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const sessionData = extractSessionFromCookie(sessionCookie.value);
    if (!sessionData) {
      return NextResponse.json({ message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
    }

    const userId = sessionData.userId;

    // Get user profiles with expiry info
    const profiles = await prisma.profile.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        tier: true,
        superExpiry: true,
        modelExpiry: true,
        freeExpiry: true,
      },
    });

    // Calculate total days for each tier
    const now = new Date();
    let totalFreeDays = 0;
    let totalSuperDays = 0;
    let totalModelDays = 0;

    profiles.forEach(profile => {
      if (profile.freeExpiry && new Date(profile.freeExpiry) > now) {
        const days = Math.ceil((new Date(profile.freeExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        totalFreeDays += days;
      }
      if (profile.superExpiry && new Date(profile.superExpiry) > now) {
        const days = Math.ceil((new Date(profile.superExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        totalSuperDays += days;
      }
      if (profile.modelExpiry && new Date(profile.modelExpiry) > now) {
        const days = Math.ceil((new Date(profile.modelExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        totalModelDays += days;
      }
    });

    // Get credit history
    const history = await prisma.creditHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      profiles,
      summary: {
        totalFreeDays,
        totalSuperDays,
        totalModelDays,
      },
      history,
    });
  } catch (error) {
    console.error('Get credits error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ff2_session');
    if (!sessionCookie) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const sessionData = extractSessionFromCookie(sessionCookie.value);
    if (!sessionData) {
      return NextResponse.json({ message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
    }

    const userId = sessionData.userId;

    // Rate limiting for credit requests (5 per hour)
    const now = Date.now();
    const rateKey = `credit_${userId}`;
    const rateInfo = creditAttempts.get(rateKey);

    if (rateInfo && rateInfo.resetAt > now) {
      if (rateInfo.count >= 5) {
        return NextResponse.json(
          { message: 'คุณส่งคำขอเติมเงินบ่อยเกินไป กรุณารอ ' + Math.ceil((rateInfo.resetAt - now) / 60000) + ' นาที' },
          { status: 429 }
        );
      }
      rateInfo.count++;
    } else {
      creditAttempts.set(rateKey, { count: 1, resetAt: now + 3600000 });
    }

    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = creditTopupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const { amount, profileId } = validationResult.data;

    // Verify profile belongs to user and is approved (has expiry date)
    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!profile) {
      return NextResponse.json({ message: 'ไม่พบโปรไฟล์ที่เลือก' }, { status: 404 });
    }

    // Check if profile has any active expiry (meaning it was approved and has days)
    const currentTime = new Date();
    const hasActiveDays =
      (profile.freeExpiry && new Date(profile.freeExpiry) > currentTime) ||
      (profile.superExpiry && new Date(profile.superExpiry) > currentTime) ||
      (profile.modelExpiry && new Date(profile.modelExpiry) > currentTime);

    if (!hasActiveDays) {
      return NextResponse.json(
        { message: 'โปรไฟล์นี้ยังไม่มีวันใช้งาน กรุณาสร้างโพสต์และรอการอนุมัติก่อน' },
        { status: 400 }
      );
    }

    // Validate proof (base64 image data URL)
    const proofStr = typeof body.proof === 'string' ? body.proof.trim() : '';
    if (!proofStr || !proofStr.startsWith('data:image/')) {
      return NextResponse.json(
        { message: 'กรุณาอัพโหลดสลิปโอนเงิน (รูปภาพ)' },
        { status: 400 }
      );
    }

    // Limit proof size (max 5MB base64)
    if (proofStr.length > 7000000) {
      return NextResponse.json(
        { message: 'ไฟล์รูปภาพใหญ่เกินไป (สูงสุด 5MB)' },
        { status: 400 }
      );
    }

    // Create credit request
    const creditRequest = await prisma.creditHistory.create({
      data: {
        userId,
        profileId,
        amount,
        type: 'TOPUP',
        proof: proofStr,
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      { message: 'ส่งคำขอเติมเงินสำเร็จ รอการตรวจสอบ', request: creditRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create credit request error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
