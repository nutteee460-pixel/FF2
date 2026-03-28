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

    // Get statistics
    const [
      totalUsers,
      totalProfiles,
      approvedProfiles,
      pendingProfiles,
      approvedPosts,
      pendingPosts,
      totalCredits,
      approvedCredits,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.profile.count({ where: { status: 'APPROVED' } }),
      prisma.profile.count({ where: { status: 'PENDING' } }),
      prisma.post.count({ where: { status: 'APPROVED' } }),
      prisma.post.count({ where: { status: 'PENDING' } }),
      prisma.creditHistory.count(),
      prisma.creditHistory.count({ where: { status: 'APPROVED' } }),
    ]);

    // Get recent credit history with user info
    const recentCredits = await prisma.creditHistory.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Calculate total income (count approved credits)
    const totalIncome = await prisma.creditHistory.aggregate({
      where: { status: 'APPROVED' },
      _count: true,
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalProfiles,
        approvedProfiles,
        pendingProfiles,
        approvedPosts,
        pendingPosts,
        totalCredits,
        approvedCredits,
        estimatedIncome: totalIncome._count * 5, // 5 baht per credit
      },
      recentCredits,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
