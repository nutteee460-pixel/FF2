const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function main() {
  const email = 'admin@ff2.com';
  const password = 'admin1234';
  const hashed = await bcrypt.hash(password, 10);

  const existing = await p.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    p.$disconnect();
    return;
  }

  const admin = await p.user.create({
    data: {
      email,
      password: hashed,
      role: 'ADMIN',
    },
  });

  console.log('Admin created!');
  console.log('Email:', email);
  console.log('Password:', password);
  p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
