import { NextResponse } from 'next/server';
import { clearAdminSession } from '@/lib/session';

export async function POST() {
  try {
    await clearAdminSession();
    return NextResponse.json({ message: 'ออกจากระบบหลังบ้านสำเร็จ' });
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}
