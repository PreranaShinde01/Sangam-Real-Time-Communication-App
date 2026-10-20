import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Sangam database with demo data...');

  const passwordHash = await bcrypt.hash('Sangam@123', 10);

  // 1. Create Demo Admin / Host (Alice)
  const alice = await prisma.user.upsert({
    where: { email: 'alice@sangam.local' },
    update: {},
    create: {
      email: 'alice@sangam.local',
      name: 'Alice Sharma (Host)',
      passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  // 2. Create Demo Participant (Bob)
  const bob = await prisma.user.upsert({
    where: { email: 'bob@sangam.local' },
    update: {},
    create: {
      email: 'bob@sangam.local',
      name: 'Bob Deshmukh',
      passwordHash,
      role: 'PARTICIPANT',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  // 3. Create Demo Co-host (Charlie)
  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@sangam.local' },
    update: {},
    create: {
      email: 'charlie@sangam.local',
      name: 'Charlie Patel (Co-Host)',
      passwordHash,
      role: 'COHOST',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  // 4. Create Demo Room
  const demoRoom = await prisma.room.upsert({
    where: { roomCode: 'san-gam-demo' },
    update: {},
    create: {
      roomCode: 'san-gam-demo',
      title: 'Sangam Launch & Product Review',
      hostId: alice.id,
      passcode: '123456',
      waitingRoomEnabled: false,
      allowGuest: true,
      muteOnEntry: false,
      allowScreenShare: true,
      allowChat: true,
      allowWhiteboard: true,
      allowFiles: true,
      e2eeEnabled: true,
      maxParticipants: 12,
    },
  });

  console.log('✅ Seed completed successfully:');
  console.log(`- Admin/Host: alice@sangam.local (password: Sangam@123)`);
  console.log(`- Participant: bob@sangam.local (password: Sangam@123)`);
  console.log(`- Co-host: charlie@sangam.local (password: Sangam@123)`);
  console.log(`- Demo Room: code "san-gam-demo" (passcode: 123456)`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
