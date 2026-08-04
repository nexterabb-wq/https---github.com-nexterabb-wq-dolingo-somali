import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const u = await p.user.findUnique({ where: { email: 'test@somali.app' }, select: { id: true } });
console.log(u?.id);
await p.$disconnect();
