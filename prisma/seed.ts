import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create super admin user with full access
  await prisma.user.upsert({
    where: { email: 'admin@signalcartel.com' },
    update: {},
    create: {
      email: 'admin@signalcartel.com',
      name: 'Signal Cartel Admin',
      role: 'super_admin',
      subscriptionTier: 'ultra_elite',
      subscriptionStatus: 'active',
      subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  });

  // Create a demo user with active subscription
  await prisma.user.upsert({
    where: { email: 'demo@signalcartel.com' },
    update: {},
    create: {
      email: 'demo@signalcartel.com',
      name: 'Demo User',
      role: 'user',
      subscriptionTier: 'professional',
      subscriptionStatus: 'active',
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  // Create a user without subscription
  await prisma.user.upsert({
    where: { email: 'test@signalcartel.com' },
    update: {},
    create: {
      email: 'test@signalcartel.com',
      name: 'Test User',
      role: 'user',
      subscriptionTier: 'none',
      subscriptionStatus: 'inactive',
    },
  });

  console.log('Database seeded successfully!');
  console.log('Super Admin: admin@signalcartel.com (password: admin123)');
  console.log('Demo User: demo@signalcartel.com (password: admin123)');
  console.log('Test User: test@signalcartel.com (password: admin123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });