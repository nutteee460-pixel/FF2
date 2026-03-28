import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { extractSessionFromCookie } from '@/lib/session';

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        lineId: true,
        province: true,
        district: true,
        role: true,
        isBanned: true,
        createdAt: true,
        profiles: true,
        creditHistory: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ff2_admin_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const sessionData = extractSessionFromCookie(sessionCookie.value);
    if (!sessionData || sessionData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์ดำเนินการ' }, { status: 403 });
    }

    const body = await request.json();
    const { isBanned, role, password, name, lineId } = body;

    const updateData: Record<string, unknown> = {};

    if (typeof isBanned === 'boolean') {
      updateData.isBanned = isBanned;
    }

    if (role && ['USER', 'ADMIN'].includes(role)) {
      updateData.role = role;
    }

    if (typeof name === 'string') {
      updateData.name = name.slice(0, 100);
    }

    if (typeof lineId === 'string') {
      updateData.lineId = lineId.slice(0, 100);
    }

    if (password && typeof password === 'string' && password.length >= 8) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ message: 'อัพเดทสำเร็จ', user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
