import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractSessionFromCookie } from '@/lib/session';
import { settingsSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    return NextResponse.json(settings || {
      bankName: '',
      bankAccount: '',
      bankNumber: '',
      telegramChannel: '',
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

async function updateSettings(request: Request) {
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

  const validationResult = settingsSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { message: validationResult.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' },
      { status: 400 }
    );
  }

  const validated = validationResult.data;

  const settingsData = {
    bankName: validated.bankName?.slice(0, 100) || '',
    bankAccount: validated.bankAccount?.slice(0, 200) || '',
    bankNumber: validated.bankNumber?.slice(0, 50) || '',
    telegramChannel: validated.telegramChannel?.slice(0, 200) || '',
  };

  const settings = await prisma.settings.upsert({
    where: { id: 'default' },
    update: settingsData,
    create: { id: 'default', ...settingsData },
  });

  return NextResponse.json({ message: 'บันทึกสำเร็จ', settings });
}

/** บาง environment (หรือ deploy เก่า) คืน 405 กับ PUT — ใช้ POST จากหน้าแอดมิน */
export async function PUT(request: Request) {
  try {
    return await updateSettings(request);
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return await updateSettings(request);
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
