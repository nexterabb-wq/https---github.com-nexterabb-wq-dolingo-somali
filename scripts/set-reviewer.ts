import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function run() {
  await p.user.update({ where: { email: 'test@somali.app' }, data: { role: 'reviewer' } });
  console.log('User upgraded to reviewer');
  const u = await p.user.findUnique({ where: { email: 'test@somali.app' }, select: { email: true, role: true } });
  console.log(u);
  await p.$disconnect();
}
run();
