const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, email: true, role: true } })
  .then(r => {
    console.log(JSON.stringify(r, null, 2));
    p.$disconnect();
  })
  .catch(e => {
    console.error(e);
    p.$disconnect();
  });
