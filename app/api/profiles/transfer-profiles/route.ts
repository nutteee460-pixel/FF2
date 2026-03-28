import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const sessionCookie = cookies().get('session');
    if (!sessionCookie) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    const userId = sessionData.userId;

    // Get user profiles
    const profiles = await prisma.profile.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        tier: true,
        superExpiry: true,
        modelExpiry: true,
        freeExpiry: true,
      },
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Get transfer profiles error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
