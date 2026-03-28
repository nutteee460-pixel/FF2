import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ message: 'กรุณากรอกรหัสผ่าน' }, { status: 400 });
    }

    const sessionCookie = cookies().get('session');
    if (!sessionCookie) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());

    if (sessionData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์ดำเนินการ' }, { status: 403 });
    }

    // Find the admin user making the request
    const admin = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      select: { id: true, email: true, password: true },
    });

    if (!admin) {
      return NextResponse.json({ message: 'ไม่พบผู้ใช้' }, { status: 404 });
    }

    // Verify password
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return NextResponse.json({ message: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    return NextResponse.json({ message: 'ยืนยันสำเร็จ', email: admin.email });
  } catch (error) {
    console.error('Verify admin error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
