import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const sessionCookie = cookies().get('session');
    if (!sessionCookie) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());

    // Only admin can approve/reject
    if (sessionData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์ดำเนินการ' }, { status: 403 });
    }

    const creditRequest = await prisma.creditHistory.findUnique({ where: { id: params.id } });
    if (!creditRequest) {
      return NextResponse.json({ message: 'ไม่พบคำขอ' }, { status: 404 });
    }

    const body = await request.json();
    const { status, adminNotes, profileId } = body;

    let profileToUpdate = null;

    // Get the profile to update
    if (status === 'APPROVED') {
      if (profileId) {
        // Use specified profileId
        profileToUpdate = await prisma.profile.findFirst({
          where: { id: profileId, userId: creditRequest.userId },
        });
      }
      if (!profileToUpdate) {
        // Fallback to first profile
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
      data: { status, adminNotes },
    });

    if (status === 'APPROVED' && profileToUpdate) {
      const now = new Date();
      let newExpiry: Date;

      if (creditRequest.type === 'TOPUP') {
        const currentExpiry = profileToUpdate.freeExpiry ? new Date(profileToUpdate.freeExpiry) : null;
        if (currentExpiry && currentExpiry > now) {
          newExpiry = new Date(currentExpiry.getTime() + creditRequest.amount * 24 * 60 * 60 * 1000);
        } else {
          newExpiry = new Date(now.getTime() + creditRequest.amount * 24 * 60 * 60 * 1000);
        }
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
