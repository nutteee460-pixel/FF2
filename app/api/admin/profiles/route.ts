import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractSessionFromCookie } from '@/lib/session';

async function adminGuard() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('ff2_admin_session');
  if (!sessionCookie?.value) return null;
  const sessionData = extractSessionFromCookie(sessionCookie.value);
  if (!sessionData || sessionData.role !== 'ADMIN') return null;
  return sessionData;
}

export async function GET(request: Request) {
  const session = await adminGuard();
  if (!session) {
    return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  try {
    // ค้นหาตามชื่อโพสต์ (title) หรือชื่อโปรไฟล์ — ใช้หลังบ้านจัดการโพสต์
    const posts = await prisma.post.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { profile: { name: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {},
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            age: true,
            province: true,
            freeExpiry: true,
            superExpiry: true,
            modelExpiry: true,
            tier: true,
            status: true,
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                lineId: true,
              },
            },
          },
        },
      },
      take: 200,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Admin posts search error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await adminGuard();
  if (!session) {
    return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { profileId, action, kind, days } = body;

    if (!profileId || !action || !kind) {
      return NextResponse.json({ message: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    const dayNum = Number.isInteger(days) ? days : parseInt(String(days), 10);
    if (!Number.isFinite(dayNum) || dayNum < 1 || dayNum > 3650) {
      return NextResponse.json({ message: 'จำนวนวันต้องอยู่ระหว่าง 1–3650' }, { status: 400 });
    }

    if (!['ADD', 'REMOVE', 'SET'].includes(action)) {
      return NextResponse.json({ message: 'action ไม่ถูกต้อง' }, { status: 400 });
    }

    if (!['FREE', 'SUPER', 'MODEL'].includes(kind)) {
      return NextResponse.json({ message: 'kind ไม่ถูกต้อง' }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) {
      return NextResponse.json({ message: 'ไม่พบโปรไฟล์' }, { status: 404 });
    }

    const now = new Date();
    const expiryField = kind === 'FREE' ? 'freeExpiry' : kind === 'SUPER' ? 'superExpiry' : 'modelExpiry';

    const currentExpiry = profile[expiryField] as Date | null;
    const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;

    if (action === 'ADD') {
      const newExpiry = new Date(baseDate.getTime() + dayNum * 24 * 60 * 60 * 1000);
      await prisma.profile.update({
        where: { id: profileId },
        data: { [expiryField]: newExpiry },
      });
    } else if (action === 'REMOVE') {
      const newExpiry = new Date(baseDate.getTime() - dayNum * 24 * 60 * 60 * 1000);
      await prisma.profile.update({
        where: { id: profileId },
        data: { [expiryField]: newExpiry },
      });
    } else if (action === 'SET') {
      const newExpiry = new Date(now.getTime() + dayNum * 24 * 60 * 60 * 1000);
      await prisma.profile.update({
        where: { id: profileId },
        data: { [expiryField]: newExpiry },
      });
    }

    const updated = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, freeExpiry: true, superExpiry: true, modelExpiry: true },
    });

    const msg =
      action === 'ADD' ? 'เพิ่มวันสำเร็จ' : action === 'REMOVE' ? 'ลดวันสำเร็จ' : 'ตั้งค่าวันสำเร็จ';

    return NextResponse.json({
      message: msg,
      profile: updated
        ? {
            id: updated.id,
            freeExpiry: updated.freeExpiry?.toISOString() ?? null,
            superExpiry: updated.superExpiry?.toISOString() ?? null,
            modelExpiry: updated.modelExpiry?.toISOString() ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error('Update profile credits error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
