import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractSessionFromCookie } from '@/lib/session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ff2_admin_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const sessionData = extractSessionFromCookie(sessionCookie.value);
    if (!sessionData || sessionData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    // Get all pending posts
    const pendingPosts = await prisma.post.findMany({
      where: { status: 'PENDING' },
      include: {
        profile: {
          select: {
            id: true,
            name: true,
            age: true,
            province: true,
            images: true,
            user: {
              select: {
                id: true,
                email: true,
                lineId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Get all pending credit requests
    const pendingCredits = await prisma.creditHistory.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        profile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    // Get transfer logs
    const transferLogs = await prisma.transferLog.findMany({
      include: {
        fromProfile: {
          select: {
            id: true,
            name: true,
            user: { select: { email: true } },
          },
        },
        toProfile: {
          select: {
            id: true,
            name: true,
            user: { select: { email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      pendingPosts,
      pendingCredits,
      transferLogs,
    });
  } catch (error) {
    console.error('Get pending error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
