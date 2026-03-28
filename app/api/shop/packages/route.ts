import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractSessionFromCookie } from '@/lib/session';

/** ราคาแพ็คเกจสำหรับผู้ใช้ที่ล็อกอิน (แก้ไขได้จากแอดมิน) */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ff2_session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const sessionData = extractSessionFromCookie(sessionCookie.value);
    if (!sessionData) {
      return NextResponse.json({ message: 'เซสชันหมดอายุ' }, { status: 401 });
    }

    let packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    if (packages.length === 0) {
      await prisma.package.createMany({
        data: [
          {
            name: 'SUPER',
            price7Days: 5,
            price14Days: 5,
            price15Days: 90,
            price30Days: 150,
            description: 'แสดงช่องที่ 1 (บนสุด) ระยะเวลา 7/14 วัน',
            isActive: true,
          },
          {
            name: 'MODEL',
            price7Days: 5,
            price14Days: 5,
            price15Days: 90,
            price30Days: 150,
            description: 'แสดงช่องที่ 2 ระยะเวลา 7/14 วัน',
            isActive: true,
          },
          {
            name: 'VERIFY',
            price7Days: 50,
            price14Days: 0,
            price15Days: 90,
            price30Days: 150,
            description: 'ยืนยันตัวตน (วันใช้งานทั่วไป) 7 / 15 / 30 วัน',
            isActive: true,
          },
        ],
      });
      packages = await prisma.package.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    }

    if (!packages.some((p) => p.name === 'VERIFY')) {
      await prisma.package.create({
        data: {
          name: 'VERIFY',
          price7Days: 50,
          price14Days: 0,
          price15Days: 90,
          price30Days: 150,
          description: 'ยืนยันตัวตน (วันใช้งานทั่วไป) 7 / 15 / 30 วัน',
          isActive: true,
        },
      });
      packages = await prisma.package.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Shop packages error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
