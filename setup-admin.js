/**
 * FF2 Setup Script — รันครั้งเดียวเพื่อสร้างตารางและแอดมิน
 * 
 * วิธีใช้:
 *   1. ตั้ง DATABASE_URL ในไฟล์ .env หรือ environment ก่อนรัน
 *   2. รัน: node setup-admin.js
 *   3. ถ้าต้องการสร้างบน Vercel: ใช้วิธีเรียก API ด้านล่าง
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 FF2 Setup — กำลังสร้างแอดมิน...\n');

  const email = process.argv[2] || 'admin@ff2.com';
  const password = process.argv[3] || 'Admin1234!';

  // 1. สร้าง admin user
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    // อัพเดทเป็น ADMIN ถ้ามีอยู่แล้ว
    const updated = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role: 'ADMIN', password: hashedPassword },
    });
    console.log('✅ อัพเดทแอดมินสำเร็จ:', updated.email);
  } else {
    // สร้างใหม่
    const admin = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
        accountType: 'POSTER',
        name: 'ผู้ดูแลระบบ',
        lineId: '',
        province: 'กรุงเทพมหานคร',
        district: '',
      },
    });
    console.log('✅ สร้างแอดมินสำเร็จ:', admin.email);
  }

  console.log('\n📋 ข้อมูลล็อกอิน:');
  console.log('   อีเมล:', email);
  console.log('   รหัส:', password);
  console.log('\n🌐 ไปที่: https://ff-2-ivory.vercel.app/admin-login');
}

main()
  .catch((e) => {
    console.error('❌ ผิดพลาด:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
