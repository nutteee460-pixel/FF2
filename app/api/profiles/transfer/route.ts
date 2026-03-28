import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractSessionFromCookie } from '@/lib/session';
import { transferSchema } from '@/lib/schemas';

// In-memory rate limiting for transfers
const transferAttempts = new Map<string, { count: number; resetAt: number }>();

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

    // Rate limiting for transfers (10 per hour)
    const now = Date.now();
    const rateKey = `transfer_${userId}`;
    const rateInfo = transferAttempts.get(rateKey);

    if (rateInfo && rateInfo.resetAt > now) {
      if (rateInfo.count >= 10) {
        return NextResponse.json(
          { message: 'คุณโอนวันใช้งานบ่อยเกินไป กรุณารอ ' + Math.ceil((rateInfo.resetAt - now) / 60000) + ' นาที' },
          { status: 429 }
        );
      }
      rateInfo.count++;
    } else {
      transferAttempts.set(rateKey, { count: 1, resetAt: now + 3600000 });
    }

    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = transferSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const { fromProfileId, toProfileId, days } = validationResult.data;

    // Verify both profiles belong to the same user
    const fromProfile = await prisma.profile.findUnique({ where: { id: fromProfileId } });
    const toProfile = await prisma.profile.findUnique({ where: { id: toProfileId } });

    if (!fromProfile || !toProfile) {
      return NextResponse.json({ message: 'ไม่พบโปรไฟล์' }, { status: 404 });
    }

    if (fromProfile.userId !== userId || toProfile.userId !== userId) {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์โอนวันใช้งานในโปรไฟล์นี้' }, { status: 403 });
    }

    if (fromProfileId === toProfileId) {
      return NextResponse.json({ message: 'ไม่สามารถโอนวันใช้งานให้ตัวเอง' }, { status: 400 });
    }

    // Check if source profile has enough free days
    const currentTime = new Date();
    let sourceExpiry = fromProfile.freeExpiry ? new Date(fromProfile.freeExpiry) : null;
    let sourceDays = 0;

    if (sourceExpiry && sourceExpiry > currentTime) {
      sourceDays = Math.ceil((sourceExpiry.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
    }

    let superDays = 0;
    let modelDays = 0;

    if (fromProfile.superExpiry && new Date(fromProfile.superExpiry) > currentTime) {
      superDays = Math.ceil((new Date(fromProfile.superExpiry).getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (fromProfile.modelExpiry && new Date(fromProfile.modelExpiry) > currentTime) {
      modelDays = Math.ceil((new Date(fromProfile.modelExpiry).getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
    }

    const totalDays = sourceDays + superDays + modelDays;

    if (totalDays < days) {
      return NextResponse.json({ message: 'วันใช้งานไม่เพียงพอ' }, { status: 400 });
    }

    // Deduct from source profile (from free days first)
    let remainingDays = days;

    if (superDays > 0 && remainingDays > 0) {
      const deductFromSuper = Math.min(superDays, remainingDays);
      const newSuperExpiry = new Date(currentTime.getTime() + (superDays - deductFromSuper) * 24 * 60 * 60 * 1000);
      await prisma.profile.update({
        where: { id: fromProfileId },
        data: { superExpiry: superDays - deductFromSuper > 0 ? newSuperExpiry : null },
      });
      remainingDays -= deductFromSuper;
    }

    if (modelDays > 0 && remainingDays > 0) {
      const deductFromModel = Math.min(modelDays, remainingDays);
      const newModelExpiry = new Date(currentTime.getTime() + (modelDays - deductFromModel) * 24 * 60 * 60 * 1000);
      await prisma.profile.update({
        where: { id: fromProfileId },
        data: { modelExpiry: modelDays - deductFromModel > 0 ? newModelExpiry : null },
      });
      remainingDays -= deductFromModel;
    }

    if (remainingDays > 0 && sourceDays > 0) {
      const deductFromFree = Math.min(sourceDays, remainingDays);
      const newFreeExpiry = new Date(currentTime.getTime() + (sourceDays - deductFromFree) * 24 * 60 * 60 * 1000);
      await prisma.profile.update({
        where: { id: fromProfileId },
        data: { freeExpiry: sourceDays - deductFromFree > 0 ? newFreeExpiry : null },
      });
    }

    // Add to destination profile's free days
    let destExpiry = toProfile.freeExpiry ? new Date(toProfile.freeExpiry) : null;
    if (destExpiry && destExpiry > currentTime) {
      destExpiry = new Date(destExpiry.getTime() + days * 24 * 60 * 60 * 1000);
    } else {
      destExpiry = new Date(currentTime.getTime() + days * 24 * 60 * 60 * 1000);
    }

    await prisma.profile.update({
      where: { id: toProfileId },
      data: { freeExpiry: destExpiry },
    });

    // Create transfer log
    await prisma.transferLog.create({
      data: {
        fromProfileId,
        toProfileId,
        days,
      },
    });

    return NextResponse.json({ message: 'โอนวันใช้งานสำเร็จ' });
  } catch (error) {
    console.error('Transfer days error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
