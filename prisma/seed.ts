import { config } from 'dotenv';
config();

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password for test users
  const passwordHash = await bcrypt.hash('Test@123456', 10);

  // Clear existing users for clean seeding (optional)
  // await prisma.user.deleteMany({});

  // Create test SUPER_ADMIN
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@shiplio.dev' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@shiplio.dev',
      phone: '+1234567890',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Super Admin created:', superAdmin.email);

  // Create test DRIVERS
  const drivers: any[] = [];
  for (let i = 1; i <= 3; i++) {
    const driver = await prisma.user.upsert({
      where: { email: `driver${i}@shiplio.dev` },
      update: {},
      create: {
        firstName: `Driver`,
        lastName: `User${i}`,
        email: `driver${i}@shiplio.dev`,
        phone: `+123456789${i}`,
        passwordHash,
        role: UserRole.DRIVER,
        emailVerified: true,
        isActive: true,
      },
    });
    drivers.push(driver);
    console.log(`✅ Driver ${i} created:`, driver.email);
  }

  // Create test WAREHOUSE STAFF
  const warehouseStaff: any[] = [];
  for (let i = 1; i <= 2; i++) {
    const warehouse = await prisma.user.upsert({
      where: { email: `warehouse${i}@shiplio.dev` },
      update: {},
      create: {
        firstName: `Warehouse`,
        lastName: `Staff${i}`,
        email: `warehouse${i}@shiplio.dev`,
        phone: `+198765432${i}`,
        passwordHash,
        role: UserRole.WAREHOUSE,
        emailVerified: true,
        isActive: true,
      },
    });
    warehouseStaff.push(warehouse);
    console.log(`✅ Warehouse Staff ${i} created:`, warehouse.email);
  }

  // Create test REGULAR USER
  const regularUser = await prisma.user.upsert({
    where: { email: 'customer@shiplio.dev' },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'customer@shiplio.dev',
      phone: '+1555000123',
      passwordHash,
      role: UserRole.USER,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Regular Customer created:', regularUser.email);

  console.log('\n📋 Test User Credentials:');
  console.log('----------------------------');
  console.log('Admin:       admin@shiplio.dev / Test@123456');
  console.log('Driver 1:    driver1@shiplio.dev / Test@123456');
  console.log('Driver 2:    driver2@shiplio.dev / Test@123456');
  console.log('Driver 3:    driver3@shiplio.dev / Test@123456');
  console.log('Warehouse 1: warehouse1@shiplio.dev / Test@123456');
  console.log('Warehouse 2: warehouse2@shiplio.dev / Test@123456');
  console.log('Customer:    customer@shiplio.dev / Test@123456');
  console.log('----------------------------\n');

  console.log('✨ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
