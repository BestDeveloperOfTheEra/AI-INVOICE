import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const users = await prisma.user.findMany({
    take: 5,
    include: { role: true }
  });
  console.log(`Total users: ${userCount}`);
  console.log('Sample users:', JSON.stringify(users, null, 2));
  
  const roles = await prisma.role.findMany();
  console.log('Roles:', JSON.stringify(roles, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
