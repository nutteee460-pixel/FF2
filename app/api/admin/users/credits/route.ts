import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractSessionFromCookie } from '@/lib/session';

function adminGuard() {
  const sessionCookie = cookies().get('ff2_admin_session');
  if (!sessionCookie) return false;
  try {
    const sessionData = extractSessionFromCookie(sessionCookie.value);
    return sessionData !== null && sessionData.role === 'ADMIN';
  } catch {
    return false;
  }
}

export async function PUT(request: Request) {
  if (!adminGuard()) {
    return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, action, kind, days } = body;

    if (!userId || !action || !kind) {
      return NextResponse.json({ message: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    // Validate action and kind
    if (!['ADD', 'REMOVE', 'SET'].includes(action)) {
      return NextResponse.json({ message: 'action ไม่ถูกต้อง' }, { status: 400 });
    }
    if (!['FREE', 'SUPER', 'MODEL'].includes(kind)) {
      return NextResponse.json({ message: 'kind ไม่ถูกต้อง' }, { status: 400 });
    }

    const dayNum = typeof days === 'number' ? days : parseInt(String(days), 10);
    if (!Number.isFinite(dayNum) || dayNum < 1 || dayNum > 3650) {
      return NextResponse.json({ message: 'จำนวนวันต้องอยู่ระหว่าง 1–3650' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profiles: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    if (user.profiles.length === 0) {
      return NextResponse.json({ message: 'ผู้ใช้นี้ยังไม่มีโปรไฟล์' }, { status: 400 });
    }

    const now = new Date();
    const expiryField = kind === 'FREE' ? 'freeExpiry' : kind === 'SUPER' ? 'superExpiry' : 'modelExpiry';

    // Apply to ALL profiles of this user
    for (const profile of user.profiles) {
      const currentExpiry = profile[expiryField] as Date | null;
      const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;

      let newExpiry: Date;
      if (action === 'ADD') {
        newExpiry = new Date(baseDate.getTime() + dayNum * 24 * 60 * 60 * 1000);
      } else if (action === 'REMOVE') {
        newExpiry = new Date(baseDate.getTime() - dayNum * 24 * 60 * 60 * 1000);
      } else {
        newExpiry = new Date(now.getTime() + dayNum * 24 * 60 * 60 * 1000);
      }

      await prisma.profile.update({
        where: { id: profile.id },
        data: { [expiryField]: newExpiry },
      });
    }

    const fresh = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profiles: {
          select: { freeExpiry: true, superExpiry: true, modelExpiry: true },
        },
      },
    });

    let totalFreeDays = 0;
    let totalSuperDays = 0;
    let totalModelDays = 0;
    const t = new Date();
    fresh?.profiles.forEach((p) => {
      if (p.freeExpiry && new Date(p.freeExpiry) > t) {
        totalFreeDays += Math.ceil((new Date(p.freeExpiry).getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
      }
      if (p.superExpiry && new Date(p.superExpiry) > t) {
        totalSuperDays += Math.ceil((new Date(p.superExpiry).getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
      }
      if (p.modelExpiry && new Date(p.modelExpiry) > t) {
        totalModelDays += Math.ceil((new Date(p.modelExpiry).getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
      }
    });

    return NextResponse.json({
      message: action === 'ADD' ? 'เพิ่มวันสำเร็จ' : action === 'REMOVE' ? 'ลดวันสำเร็จ' : 'ตั้งค่าวันสำเร็จ',
      totalFreeDays,
      totalSuperDays,
      totalModelDays,
    });
  } catch (error) {
    console.error('Update user credits error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
