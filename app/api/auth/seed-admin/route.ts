import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Secret key to prevent unauthorized access
const SECRET_KEY = process.env.SEED_SECRET || 'ff2-seed-key-2024';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Verify secret key
    if (body.secret !== SECRET_KEY) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const email = body.email || 'admin@ff2.com';
    const password = body.password || 'admin1234';

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      // Update to admin role
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { role: 'ADMIN' },
      });
      return NextResponse.json({
        message: 'Admin updated successfully',
        email: email.toLowerCase(),
        role: 'ADMIN'
      });
    }

    // Create new admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
        accountType: 'POSTER',
      },
    });

    return NextResponse.json({
      message: 'Admin created successfully',
      email: admin.email,
      role: admin.role
    });

  } catch (error) {
    console.error('Seed admin error:', error);
    return NextResponse.json(
      { message: 'Failed to create admin' },
      { status: 500 }
    );
  }
}
