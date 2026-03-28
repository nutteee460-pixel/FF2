import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { extractSessionFromCookie } from '@/lib/session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ff2_admin_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = extractSessionFromCookie(sessionCookie.value);
    if (!sessionData || sessionData.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const packages = await prisma.package.findMany({
      orderBy: { name: 'asc' },
    });

    if (packages.length === 0) {
      await prisma.package.createMany({
        data: [
          {
            name: 'SUPER',
            price7Days: 5,
            price14Days: 5,
            description: 'แสดงช่องที่ 1 (บนสุด) ระยะเวลา 7/14 วัน',
            isActive: true,
          },
          {
            name: 'MODEL',
            price7Days: 5,
            price14Days: 5,
            description: 'แสดงช่องที่ 2 ระยะเวลา 7/14 วัน',
            isActive: true,
          },
        ],
      });

      const created = await prisma.package.findMany({
        orderBy: { name: 'asc' },
      });
      return NextResponse.json(created);
    }

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ff2_admin_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = extractSessionFromCookie(sessionCookie.value);
    if (!sessionData || sessionData.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { id, price7Days, price14Days, description, isActive } = body;

    // Validate input
    if (!id) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    const updated = await prisma.package.update({
      where: { id },
      data: {
        price7Days: Math.max(0, Number(price7Days) || 0),
        price14Days: Math.max(0, Number(price14Days) || 0),
        description: String(description || '').slice(0, 500),
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating package:', error);
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('ff2_admin_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionData = extractSessionFromCookie(sessionCookie.value);
    if (!sessionData || sessionData.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { name, price7Days, price14Days, description } = body;

    // Validate required fields
    if (!name || !['SUPER', 'MODEL'].includes(name)) {
      return NextResponse.json({ error: 'Invalid package name' }, { status: 400 });
    }

    const created = await prisma.package.create({
      data: {
        name,
        price7Days: Math.max(0, Number(price7Days) || 0),
        price14Days: Math.max(0, Number(price14Days) || 0),
        description: String(description || '').slice(0, 500),
        isActive: true,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
  }
}
