import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin() {
  let adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: 'Admin', permissions: 'all' }
    });
  }

  const email = 'control-center-9x8d@dataextract.com';
  const password = 'Dx@7Tr!9m^QzP2L';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Erase the old weak dictionary-guessable admin account entirely from SQLite!
  await prisma.user.deleteMany({ where: { email: 'admin@dataextract.com' } });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        roleId: adminRole.id
      }
    });
    console.log('New Secure Admin user created successfully!');
  } else {
    await prisma.user.update({
      where: { email },
      data: { roleId: adminRole.id, passwordHash }
    });
    console.log('Secure Admin user forcefully updated successfully!');
  }
}

seedAdmin().catch(console.error).finally(() => prisma.$disconnect());
