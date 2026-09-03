"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const passwordHash = await bcrypt.hash('Test@123456', 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@shiplio.dev' },
        update: {},
        create: {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@shiplio.dev',
            phone: '+1234567890',
            passwordHash,
            role: client_1.UserRole.SUPER_ADMIN,
            emailVerified: true,
            isActive: true,
        },
    });
    console.log('✅ Super Admin created:', superAdmin.email);
    const drivers = [];
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
                role: client_1.UserRole.DRIVER,
                emailVerified: true,
                isActive: true,
            },
        });
        drivers.push(driver);
        console.log(`✅ Driver ${i} created:`, driver.email);
    }
    const warehouseStaff = [];
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
                role: client_1.UserRole.WAREHOUSE,
                emailVerified: true,
                isActive: true,
            },
        });
        warehouseStaff.push(warehouse);
        console.log(`✅ Warehouse Staff ${i} created:`, warehouse.email);
    }
    const regularUser = await prisma.user.upsert({
        where: { email: 'customer@shiplio.dev' },
        update: {},
        create: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'customer@shiplio.dev',
            phone: '+1555000123',
            passwordHash,
            role: client_1.UserRole.USER,
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
//# sourceMappingURL=seed.js.map