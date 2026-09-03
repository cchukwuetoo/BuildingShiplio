import { config } from 'dotenv';
config();

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password for test users
  const passwordHash = await bcrypt.hash('Test@123456', 10);

  // Create test SUPER_ADMIN
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@shiplio.dev' },
    update: {},
    create: {
      fullName: 'Admin User',
      email: 'admin@shiplio.dev',
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
        fullName: `Driver User${i}`,
        email: `driver${i}@shiplio.dev`,
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
        fullName: `Warehouse Staff${i}`,
        email: `warehouse${i}@shiplio.dev`,
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
      fullName: 'John Doe',
      email: 'customer@shiplio.dev',
      passwordHash,
      role: UserRole.USER,
      emailVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Regular Customer created:', regularUser.email);

  // Create test shipments owned by the customer so driver/warehouse endpoints have data
  const shipmentCount = await prisma.shipment.count({
    where: { userId: regularUser.id },
  });

  if (shipmentCount === 0) {
    for (let i = 1; i <= 3; i++) {
      await prisma.shipment.create({
        data: {
          userId: regularUser.id,
          pickupAddress: `${i} Pickup Street`,
          pickupCity: 'Lagos',
          pickupState: 'Lagos',
          pickupContactName: 'Sender',
          pickupPhone: '+1555000113',
          deliveryAddress: `${i} Delivery Avenue`,
          deliveryCity: 'Abuja',
          deliveryState: 'FCT',
          recipientName: 'Recipient',
          recipientPhone: '+1555000993',
          packageType: 'Box',
          description: `Test shipment ${i}`,
          estimatedWeight: 5.5,
          weightUnit: 'kg',
          isFragile: false,
        },
      });
    }
    console.log('✅ Created 3 test shipments (PENDING) owned by customer');
  } else {
    console.log(`ℹ️ Skipped shipment creation: ${shipmentCount} already exist`);
  }

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