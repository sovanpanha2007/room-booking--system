const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // 1. Seed Users (using upsert to make it idempotent)
    console.log('Syncing users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@rms.com' },
        update: {},
        create: {
            email: 'admin@rms.com',
            name: 'System Admin',
            password: adminPassword,
            role: 'ADMIN',
        },
    });
    console.log(`Admin User: ${adminUser.email} (Password: admin123)`);

    const standardPassword = await bcrypt.hash('user123', 10);
    const standardUser = await prisma.user.upsert({
        where: { email: 'user@rms.com' },
        update: {},
        create: {
            email: 'user@rms.com',
            name: 'Jane Doe',
            password: standardPassword,
            role: 'USER',
        },
    });
    console.log(`Standard User: ${standardUser.email} (Password: user123)`);

    // 2. Seed Rooms (using upsert based on unique roomNumber)
    console.log('Syncing rooms...');
    const roomsData = [
        { roomNumber: '101', name: 'Conference Room A', capacity: 10, location: '1st Floor, Wing A' },
        { roomNumber: '102', name: 'Board Room B', capacity: 6, location: '1st Floor, Wing B' },
        { roomNumber: '201', name: 'Training Center C', capacity: 25, location: '2nd Floor, Main Hall' },
        { roomNumber: '301', name: 'Executive Suite D', capacity: 4, location: '3rd Floor, Penthouse' }
    ];

    for (const room of roomsData) {
        const seededRoom = await prisma.room.upsert({
            where: { roomNumber: room.roomNumber },
            update: {
                name: room.name,
                capacity: room.capacity,
                location: room.location,
                isActive: true
            },
            create: {
                roomNumber: room.roomNumber,
                name: room.name,
                capacity: room.capacity,
                location: room.location,
            }
        });
        console.log(`Room: ${seededRoom.name} [Number: ${seededRoom.roomNumber}]`);
    }

    console.log('✅ Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
