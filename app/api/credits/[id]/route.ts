import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractSessionFromCookie } from '@/lib/session';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ff2_admin_session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบแอดมิน' }, { status: 401 });
    }

    const sessionData = extractSessionFromCookie(sessionCookie.value);
    if (!sessionData || sessionData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์ดำเนินการ' }, { status: 403 });
    }

    const creditRequest = await prisma.creditHistory.findUnique({ where: { id: params.id } });
    if (!creditRequest) {
      return NextResponse.json({ message: 'ไม่พบคำขอ' }, { status: 404 });
    }

    const body = await request.json();
    const { status, adminNotes } = body;
    const bodyProfileId = typeof body.profileId === 'string' ? body.profileId : undefined;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ message: 'สถานะไม่ถูกต้อง' }, { status: 400 });
    }

    let profileToUpdate = null;

    if (status === 'APPROVED') {
      const targetId = bodyProfileId || creditRequest.profileId || undefined;
      if (targetId) {
        profileToUpdate = await prisma.profile.findFirst({
          where: { id: targetId, userId: creditRequest.userId },
        });
      }
      if (!profileToUpdate) {
        profileToUpdate = await prisma.profile.findFirst({
          where: { userId: creditRequest.userId },
        });
      }
    }

    if (status === 'APPROVED' && !profileToUpdate) {
      return NextResponse.json(
        {
          message:
            'ผู้ใช้ยังไม่มีโปรไฟล์ ให้สร้างโปรไฟล์จากแดชบอร์ดก่อน จึงค่อยอนุมัติเครดิต',
        },
        { status: 400 }
      );
    }

    await prisma.creditHistory.update({
      where: { id: params.id },
      data: {
        status,
        ...(typeof adminNotes === 'string' ? { adminNotes: adminNotes.slice(0, 1000) } : {}),
      },
    });

    if (status === 'APPROVED' && profileToUpdate) {
      const now = new Date();
      let newExpiry: Date;

      const extendFreeDays = () => {
        const currentExpiry = profileToUpdate!.freeExpiry ? new Date(profileToUpdate!.freeExpiry) : null;
        if (currentExpiry && currentExpiry > now) {
          return new Date(currentExpiry.getTime() + creditRequest.amount * 24 * 60 * 60 * 1000);
        }
        return new Date(now.getTime() + creditRequest.amount * 24 * 60 * 60 * 1000);
      };

      if (creditRequest.type === 'TOPUP' || creditRequest.type === 'VERIFY_IDENTITY') {
        newExpiry = extendFreeDays();
        await prisma.profile.update({
          where: { id: profileToUpdate.id },
          data: { freeExpiry: newExpiry },
        });
      } else if (creditRequest.type === 'PURCHASE_SUPER') {
        const currentExpiry = profileToUpdate.superExpiry ? new Date(profileToUpdate.superExpiry) : null;
        if (currentExpiry && currentExpiry > now) {
          newExpiry = new Date(currentExpiry.getTime() + creditRequest.amount * 24 * 60 * 60 * 1000);
        } else {
          newExpiry = new Date(now.getTime() + creditRequest.amount * 24 * 60 * 60 * 1000);
        }
        await prisma.profile.update({
          where: { id: profileToUpdate.id },
          data: { superExpiry: newExpiry, tier: 'SUPER' },
        });
      } else if (creditRequest.type === 'PURCHASE_MODEL') {
        const currentExpiry = profileToUpdate.modelExpiry ? new Date(profileToUpdate.modelExpiry) : null;
        if (currentExpiry && currentExpiry > now) {
          newExpiry = new Date(currentExpiry.getTime() + creditRequest.amount * 24 * 60 * 60 * 1000);
        } else {
          newExpiry = new Date(now.getTime() + creditRequest.amount * 24 * 60 * 60 * 1000);
        }
        await prisma.profile.update({
          where: { id: profileToUpdate.id },
          data: { modelExpiry: newExpiry, tier: 'MODEL' },
        });
      }
    }

    return NextResponse.json({ message: 'อัพเดทสำเร็จ' });
  } catch (error) {
    console.error('Update credit error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
