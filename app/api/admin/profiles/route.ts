import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Use the same admin_session cookie as admin-login
function adminGuard() {
  const sessionCookie = cookies().get('admin_session');
  if (!sessionCookie) return null;

  try {
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    if (sessionData.role !== 'ADMIN') return null;
    return sessionData;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const session = adminGuard();
  if (!session) {
    return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    // ค้นหาโปรไฟล์ตามชื่อโพสต์ หรือชื่อโปรไฟล์
    const posts = await prisma.post.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q } },
              { profile: { name: { contains: q } } },
            ],
          }
        : {},
      include: {
        profile: {
          include: {
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
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Search profiles error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = adminGuard();
  if (!session) {
    return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { profileId, action, kind, days } = body;

    if (!profileId || !action || !kind) {
      return NextResponse.json({ message: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }

    // Validate days as integer
    const dayNum = Number.isInteger(days) ? days : parseInt(String(days), 10);
    if (!Number.isFinite(dayNum) || dayNum < 1 || dayNum > 3650) {
      return NextResponse.json({ message: 'จำนวนวันต้องอยู่ระหว่าง 1–3650' }, { status: 400 });
    }

    // Validate action
    if (!['ADD', 'REMOVE', 'SET'].includes(action)) {
      return NextResponse.json({ message: 'action ไม่ถูกต้อง' }, { status: 400 });
    }

    // Validate kind
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

    const msg = action === 'ADD' ? 'เพิ่มวันสำเร็จ' : action === 'REMOVE' ? 'ลดวันสำเร็จ' : 'ตั้งค่าวันสำเร็จ';

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
