import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter: pool });

async function main() {
  if (process.env.NODE_ENV !== 'development') return;

  await prisma.authAccount.upsert({
    where: {
      provider_providerId: {
        provider: 'INTERNAL',
        providerId: 'admin',
      },
    },
    update: {},
    create: {
      provider: 'INTERNAL',
      providerId: 'admin',
      passwordHash: '<hashed-password>',
      user: {
        create: {
          name: 'System Admin',
          role: 'ADMIN',
        },
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
