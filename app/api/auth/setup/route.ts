import { NextResponse } from 'next/server';

const SECRET_KEY = process.env.SEED_SECRET || 'ff2-seed-key-2024';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== SECRET_KEY) {
      return NextResponse.json({ message: 'Unauthorized - wrong secret' }, { status: 401 });
    }

    // เพิ่ม timeout สำหรับ Neon serverless (冷启动)
    const prisma = new (await import('@prisma/client')).PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL + '&connect_timeout=15' } },
    });

    // Step 1: สร้าง User table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT NOT NULL,
        "name" TEXT,
        "lineId" TEXT DEFAULT '',
        "phone" TEXT,
        "province" TEXT,
        "district" TEXT,
        "role" TEXT DEFAULT 'USER',
        "accountType" TEXT DEFAULT 'POSTER',
        "isBanned" BOOLEAN DEFAULT false,
        "emailVerified" TIMESTAMP,
        "image" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Step 2: สร้าง Profile table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Profile" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "age" INTEGER NOT NULL,
        "province" TEXT NOT NULL,
        "district" TEXT,
        "description" TEXT,
        "images" TEXT NOT NULL,
        "tier" TEXT DEFAULT 'FREE',
        "status" TEXT DEFAULT 'PENDING',
        "serviceTypes" TEXT DEFAULT '[]',
        "appearance" TEXT DEFAULT '[]',
        "ageRange" TEXT DEFAULT '[]',
        "region" TEXT DEFAULT '',
        "superExpiry" TIMESTAMP,
        "modelExpiry" TIMESTAMP,
        "freeExpiry" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      );
    `);

    // Step 3: สร้าง Post table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Post" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "profileId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "images" TEXT NOT NULL,
        "lineId" TEXT DEFAULT '',
        "contactName" TEXT,
        "age" INTEGER,
        "province" TEXT,
        "district" TEXT,
        "status" TEXT DEFAULT 'PENDING',
        "adminNotes" TEXT,
        "serviceTypes" TEXT DEFAULT '[]',
        "appearance" TEXT DEFAULT '[]',
        "ageRange" TEXT DEFAULT '[]',
        "region" TEXT DEFAULT '',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Post_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE
      );
    `);

    // Step 4: สร้าง CreditHistory table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CreditHistory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "profileId" TEXT,
        "amount" INTEGER NOT NULL,
        "type" TEXT NOT NULL,
        "proof" TEXT,
        "status" TEXT DEFAULT 'PENDING',
        "adminNotes" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CreditHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
        CONSTRAINT "CreditHistory_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL
      );
    `);

    // Step 5: สร้าง TransferLog table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "TransferLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "fromProfileId" TEXT NOT NULL,
        "toProfileId" TEXT NOT NULL,
        "days" INTEGER NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TransferLog_fromProfileId_fkey" FOREIGN KEY ("fromProfileId") REFERENCES "Profile"("id") ON DELETE CASCADE,
        CONSTRAINT "TransferLog_toProfileId_fkey" FOREIGN KEY ("toProfileId") REFERENCES "Profile"("id") ON DELETE CASCADE
      );
    `);

    // Step 6: สร้าง Settings table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Settings" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
        "bankName" TEXT,
        "bankAccount" TEXT,
        "bankNumber" TEXT,
        "telegramChannel" TEXT,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Step 7: สร้าง Package table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Package" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "price7Days" INTEGER NOT NULL DEFAULT 5,
        "price14Days" INTEGER NOT NULL DEFAULT 5,
        "description" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Step 8: สร้าง admin user
    const email = searchParams.get('email') || 'admin@ff2.com';
    const password = searchParams.get('password') || 'Admin1234!';
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    let result: { email: string; role: string };
    if (existing) {
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: { role: 'ADMIN', password: hashedPassword },
      });
      result = { email: email.toLowerCase(), role: 'ADMIN' };
    } else {
      const admin = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'ADMIN',
          accountType: 'POSTER',
        },
      });
      result = { email: admin.email, role: admin.role };
    }

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      message: 'Setup completed — all tables created and admin user ready',
      login: {
        email: result.email,
        password: password,
        url: 'https://ff-2-ivory.vercel.app/admin-login',
      },
    });

  } catch (error: any) {
    console.error('Setup error:', error?.message || error);

    // ถ้า timeout แปลว่า Neon ตอบช้า ลองใหม่อีกครั้ง
    if (error?.message?.includes('timeout') || error?.code === 'P2024') {
      return NextResponse.json(
        {
          message: 'Database connection timeout — เชื่อมต่อ Neon ช้า โปรดลองใหม่อีกครั้ง',
          hint: 'รอ 30 วินาทีแล้วกด Enter ที่ URL อีกครั้ง',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: 'Setup failed', error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
