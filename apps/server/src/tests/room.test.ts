import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { roomService } from '../services/roomService';
import { prisma } from '../config/prisma';

describe('Room & Meeting Service', () => {
  let hostId: string;
  let createdRoomId: string;
  let createdRoomCode: string;

  beforeAll(async () => {
    // Pick existing seeded user or create temporary
    const user = await prisma.user.findFirst();
    hostId = user!.id;
  });

  it('should create room with unique code and fingerprint', async () => {
    const room = await roomService.createRoom(hostId, {
      title: 'Sprint Planning & Retro',
      passcode: '987654',
      waitingRoomEnabled: true,
      allowGuest: true,
      muteOnEntry: false,
      allowScreenShare: true,
      allowChat: true,
      allowWhiteboard: true,
      allowFiles: true,
      e2eeEnabled: true,
      maxParticipants: 12,
    });

    expect(room.id).toBeDefined();
    expect(room.roomCode).toMatch(/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
    expect(room.securityFingerprint).toMatch(/^\d{4} - \d{4} - \d{4}$/);
    createdRoomId = room.id;
    createdRoomCode = room.roomCode;
  });

  it('should retrieve room by code', async () => {
    const room = await roomService.getRoomByCode(createdRoomCode);
    expect(room.title).toBe('Sprint Planning & Retro');
    expect(room.hasPasscode).toBe(true);
  });

  it('should verify room passcode correctly', async () => {
    const valid = await roomService.verifyPasscode(createdRoomId, '987654');
    const invalid = await roomService.verifyPasscode(createdRoomId, 'wrongcode');
    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });

  it('should generate valid iCalendar (.ics) formatted data', async () => {
    const room = await roomService.getRoomByCode(createdRoomId);
    const ics = roomService.generateIcs(room);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('SUMMARY:Sprint Planning & Retro');
    expect(ics).toContain('END:VCALENDAR');
  });

  afterAll(async () => {
    if (createdRoomId) {
      await prisma.room.deleteMany({ where: { id: createdRoomId } });
    }
  });
});
