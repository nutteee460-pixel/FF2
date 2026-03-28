import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { profileUpdateSchema } from '@/lib/schemas';

function sanitizeString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function sanitizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === 'string')
      .map(v => v.trim())
      .filter(v => v.length > 0);
  }
  return [];
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: params.id },
      include: { user: { select: { lineId: true, name: true } } },
    });

    if (!profile) {
      return NextResponse.json({ message: 'ไม่พบโปรไฟล์' }, { status: 404 });
    }

    // Only expose LINE ID if profile is APPROVED
    if (profile.status !== 'APPROVED') {
      return NextResponse.json(
        { message: 'โปรไฟล์นี้ยังไม่ได้รับการอนุมัติ' },
        { status: 403 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const sessionCookie = cookies().get('session');
    if (!sessionCookie) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    let sessionData: { userId: string; role: string };
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    } catch {
      return NextResponse.json({ message: 'เซสชันไม่ถูกต้อง' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({ where: { id: params.id } });
    if (!profile) {
      return NextResponse.json({ message: 'ไม่พบโปรไฟล์' }, { status: 404 });
    }

    // Authorization check: user must own the profile OR be admin
    const isOwner = profile.userId === sessionData.userId;
    const isAdmin = sessionData.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์แก้ไขโปรไฟล์นี้' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = profileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const validated = validationResult.data;

    // Whitelist allowed fields for update - prevents mass assignment
    const updateData: Record<string, unknown> = {};

    if (validated.name !== undefined) {
      updateData.name = validated.name;
    }
    if (validated.age !== undefined) {
      updateData.age = validated.age;
    }
    if (validated.province !== undefined) {
      updateData.province = validated.province;
    }
    if (validated.district !== undefined) {
      updateData.district = validated.district;
    }
    if (validated.description !== undefined) {
      updateData.description = validated.description;
    }
    if (validated.serviceTypes !== undefined) {
      updateData.serviceTypes = JSON.stringify(validated.serviceTypes);
    }
    if (validated.appearance !== undefined) {
      updateData.appearance = JSON.stringify(validated.appearance);
    }
    if (validated.ageRange !== undefined) {
      updateData.ageRange = JSON.stringify(validated.ageRange);
    }

    // Users cannot change their own tier or status - only admins can
    if (isAdmin) {
      if (typeof body.tier === 'string') {
        if (['SUPER', 'MODEL', 'FREE'].includes(body.tier)) {
          updateData.tier = body.tier;
        }
      }
      if (typeof body.status === 'string') {
        if (['PENDING', 'APPROVED', 'REJECTED'].includes(body.status)) {
          updateData.status = body.status;
        }
      }
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ message: 'อัพเดทโปรไฟล์สำเร็จ', profile: updatedProfile });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const sessionCookie = cookies().get('session');
    if (!sessionCookie) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    let sessionData: { userId: string; role: string };
    try {
      sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    } catch {
      return NextResponse.json({ message: 'เซสชันไม่ถูกต้อง' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({ where: { id: params.id } });
    if (!profile) {
      return NextResponse.json({ message: 'ไม่พบโปรไฟล์' }, { status: 404 });
    }

    // Authorization check
    const isOwner = profile.userId === sessionData.userId;
    const isAdmin = sessionData.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์ลบโปรไฟล์นี้' }, { status: 403 });
    }

    await prisma.profile.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'ลบโปรไฟล์สำเร็จ' });
  } catch (error) {
    console.error('Delete profile error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
