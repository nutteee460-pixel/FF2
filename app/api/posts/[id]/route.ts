import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractSessionFromCookie } from '@/lib/session';
import { postUpdateSchema } from '@/lib/schemas';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        profile: {
          select: {
            name: true,
            age: true,
            province: true,
            user: { select: { lineId: true } },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ message: 'ไม่พบโพสต์' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const body = await request.json();

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) {
      return NextResponse.json({ message: 'ไม่พบโพสต์' }, { status: 404 });
    }

    // Authorization: admin can update any post, others can only update their own
    if (sessionData.role !== 'ADMIN') {
      const profile = await prisma.profile.findUnique({ where: { id: post.profileId } });
      if (profile?.userId !== sessionData.userId) {
        return NextResponse.json({ message: 'คุณไม่มีสิทธิ์ดำเนินการ' }, { status: 403 });
      }

      // Non-admin users can only update their own posts (not approve/reject)
      if (body.status && body.status !== post.status) {
        return NextResponse.json(
          { message: 'คุณไม่มีสิทธิ์เปลี่ยนสถานะโพสต์' },
          { status: 403 }
        );
      }
    }

    // Validate input with Zod schema
    const validationResult = postUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const validated = validationResult.data;

    // Whitelist allowed fields - prevents mass assignment
    const updateData: Record<string, unknown> = {};

    if (validated.title !== undefined) updateData.title = validated.title.slice(0, 200);
    if (validated.description !== undefined) updateData.description = validated.description?.slice(0, 2000);
    if (validated.lineId !== undefined) updateData.lineId = validated.lineId.trim().slice(0, 100);
    if (validated.contactName !== undefined) updateData.contactName = validated.contactName?.trim().slice(0, 100);
    if (validated.age !== undefined) updateData.age = validated.age;
    if (validated.province !== undefined) updateData.province = validated.province;
    if (validated.district !== undefined) updateData.district = validated.district;
    if (validated.images !== undefined) updateData.images = JSON.stringify(validated.images);

    // Only admins can change status and adminNotes
    if (sessionData.role === 'ADMIN') {
      if (validated.status !== undefined) updateData.status = validated.status;
      if (validated.adminNotes !== undefined) updateData.adminNotes = validated.adminNotes?.slice(0, 1000);
    }

    const updatedPost = await prisma.post.update({
      where: { id: params.id },
      data: updateData,
    });

    // If approved, update profile status to APPROVED and set free expiry
    if (sessionData.role === 'ADMIN' && validated.status === 'APPROVED') {
      const profile = await prisma.profile.findUnique({ where: { id: post.profileId } });
      if (profile && profile.status === 'PENDING') {
        const now = new Date();
        const freeExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days free
        await prisma.profile.update({
          where: { id: post.profileId },
          data: {
            status: 'APPROVED',
            freeExpiry,
          },
        });
      }
    }

    return NextResponse.json({ message: 'อัพเดทสำเร็จ', post: updatedPost });
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) {
      return NextResponse.json({ message: 'ไม่พบโพสต์' }, { status: 404 });
    }

    // Verify ownership or admin
    const profile = await prisma.profile.findUnique({ where: { id: post.profileId } });
    if (profile?.userId !== sessionData.userId && sessionData.role !== 'ADMIN') {
      return NextResponse.json({ message: 'คุณไม่มีสิทธิ์ลบโพสต์นี้' }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'ลบโพสต์สำเร็จ' });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json({ message: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }
}
