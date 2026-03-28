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

    // Get all users with profile counts and expiry info
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        lineId: true,
        province: true,
        role: true,
        isBanned: true,
        createdAt: true,
        profiles: {
          select: {
            id: true,
            name: true,
            superExpiry: true,
            modelExpiry: true,
            freeExpiry: true,
          },
        },
        _count: {
          select: { creditHistory: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit results
    });

    // Calculate total days for each user
    const usersWithDays = users.map(user => {
      const now = new Date();
      let totalFreeDays = 0;
      let totalSuperDays = 0;
      let totalModelDays = 0;

      user.profiles.forEach(profile => {
        if (profile.freeExpiry && new Date(profile.freeExpiry) > now) {
          totalFreeDays += Math.ceil((new Date(profile.freeExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
        if (profile.superExpiry && new Date(profile.superExpiry) > now) {
          totalSuperDays += Math.ceil((new Date(profile.superExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
        if (profile.modelExpiry && new Date(profile.modelExpiry) > now) {
          totalModelDays += Math.ceil((new Date(profile.modelExpiry).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
      });

      return {
        ...user,
        totalFreeDays,
        totalSuperDays,
        totalModelDays,
        profileCount: user.profiles.length,
      };
    });

    return NextResponse.json({ users: usersWithDays });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
