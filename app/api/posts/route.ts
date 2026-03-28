import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractSessionFromCookie } from '@/lib/session';
import { postSchema } from '@/lib/schemas';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const status = searchParams.get('status');

    const whereClause: Record<string, unknown> = {};
    if (profileId) {
      whereClause.profileId = profileId;
    }
    if (status) {
      // Validate status values
      if (['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        whereClause.status = status;
      }
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        profile: {
          select: {
            name: true,
            user: { select: { lineId: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit results
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ff2_session');
    if (!sessionCookie) {
      return NextResponse.json({ message: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const sessionData = extractSessionFromCookie(sessionCookie.value);
    if (!sessionData) {
      return NextResponse.json({ message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
    }

    const actor = await prisma.user.findUnique({ where: { id: sessionData.userId } });
    if (!actor || (actor.accountType !== 'POSTER' && actor.role !== 'ADMIN')) {
      return NextResponse.json(
        { message: 'เฉพาะบัญชี Post งานเท่านั้นที่สร้างโพสต์ได้' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input with Zod schema
    const validationResult = postSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const validated = validationResult.data;

    // Verify profile belongs to user
    const profile = await prisma.profile.findUnique({ where: { id: validated.profileId } });

    if (!profile || profile.userId !== sessionData.userId) {
      return NextResponse.json({ message: 'ไม่พบโปรไฟล์หรือคุณไม่มีสิทธิ์' }, { status: 403 });
    }

    // Sanitize strings
    const contactNameVal = validated.contactName?.trim() || null;

    // Create post
    const post = await prisma.post.create({
      data: {
        profileId: validated.profileId,
        title: validated.title.slice(0, 200),
        images: JSON.stringify(validated.images),
        description: validated.description?.slice(0, 2000) || null,
        lineId: validated.lineId.trim(),
        contactName: contactNameVal,
        age: validated.age,
        province: validated.province,
        district: validated.district || null,
        status: 'PENDING',
      },
    });

    // Update User + Profile with contact info
    await prisma.user.update({
      where: { id: profile.userId },
      data: {
        lineId: validated.lineId.trim(),
        ...(contactNameVal ? { name: contactNameVal } : {}),
        province: validated.province,
        ...(validated.district ? { district: validated.district } : {}),
      },
    });

    await prisma.profile.update({
      where: { id: validated.profileId },
      data: {
        age: validated.age,
        ...(contactNameVal ? { name: contactNameVal } : {}),
        province: validated.province,
        ...(validated.district ? { district: validated.district } : {}),
      },
    });

    return NextResponse.json({ message: 'สร้างโพสต์สำเร็จ รอการอนุมัติ', post }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
