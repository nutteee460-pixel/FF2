import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractSessionFromCookie } from '@/lib/session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ff2_admin_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ user: null });
    }

    // Verify session signature
    const sessionData = extractSessionFromCookie(sessionCookie.value);
    if (!sessionData) {
      cookieStore.delete('ff2_admin_session');
      return NextResponse.json({ user: null });
    }

    // Verify user still exists and is still an admin
    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      select: {
        id: true,
        email: true,
        name: true,
        lineId: true,
        province: true,
        district: true,
        role: true,
        accountType: true,
        isBanned: true,
        createdAt: true,
      },
    });

    if (!user || user.isBanned || user.role !== 'ADMIN') {
      cookieStore.delete('ff2_admin_session');
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Admin session error:', error);
    return NextResponse.json({ user: null });
  }
}
