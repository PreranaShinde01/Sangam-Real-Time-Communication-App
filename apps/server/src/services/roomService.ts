import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { generateRoomCode, generateRoomFingerprint, CreateRoomInput } from '@sangam/shared';

export class RoomService {
  /**
   * Create a new room with host
   */
  async createRoom(hostId: string, input: CreateRoomInput) {
    let roomCode = generateRoomCode();
    // Ensure room code uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.room.findUnique({ where: { roomCode } });
      if (!exists) break;
      roomCode = generateRoomCode();
      attempts++;
    }

    const room = await prisma.room.create({
      data: {
        roomCode,
        title: input.title,
        hostId,
        passcode: input.passcode || null,
        waitingRoomEnabled: input.waitingRoomEnabled,
        allowGuest: input.allowGuest,
        muteOnEntry: input.muteOnEntry,
        allowScreenShare: input.allowScreenShare,
        allowChat: input.allowChat,
        allowWhiteboard: input.allowWhiteboard,
        allowFiles: input.allowFiles,
        e2eeEnabled: input.e2eeEnabled,
        maxParticipants: input.maxParticipants,
        scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : null,
      },
      include: {
        host: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    const fingerprint = generateRoomFingerprint(room.id, room.createdAt.getTime());

    return {
      ...room,
      securityFingerprint: fingerprint,
    };
  }

  /**
   * Get room by readable code or ID
   */
  async getRoomByCode(codeOrId: string) {
    const room = await prisma.room.findFirst({
      where: {
        OR: [{ roomCode: codeOrId }, { id: codeOrId }],
      },
      include: {
        host: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!room) {
      throw new AppError('Room not found', 404);
    }

    if (room.isEnded) {
      throw new AppError('This meeting has already ended', 410);
    }

    const fingerprint = generateRoomFingerprint(room.id, room.createdAt.getTime());

    return {
      id: room.id,
      roomCode: room.roomCode,
      title: room.title,
      hostId: room.hostId,
      hostName: room.host.name,
      isLocked: room.isLocked,
      hasPasscode: !!room.passcode,
      waitingRoomEnabled: room.waitingRoomEnabled,
      allowGuest: room.allowGuest,
      muteOnEntry: room.muteOnEntry,
      allowScreenShare: room.allowScreenShare,
      allowChat: room.allowChat,
      allowWhiteboard: room.allowWhiteboard,
      allowFiles: room.allowFiles,
      e2eeEnabled: room.e2eeEnabled,
      maxParticipants: room.maxParticipants,
      scheduledStart: room.scheduledStart,
      securityFingerprint: fingerprint,
      createdAt: room.createdAt,
    };
  }

  /**
   * Verify room passcode
   */
  async verifyPasscode(roomId: string, passcode?: string): Promise<boolean> {
    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new AppError('Room not found', 404);
    if (!room.passcode) return true;
    return room.passcode === passcode;
  }

  /**
   * Get user's hosted meetings and history
   */
  async getUserMeetings(userId: string) {
    return prisma.room.findMany({
      where: { hostId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Generate an iCalendar (.ics) string for scheduling
   */
  generateIcs(room: any): string {
    const start = room.scheduledStart ? new Date(room.scheduledStart) : new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default

    const formatDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Sangam Video Conferencing//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${room.id}@sangam.app`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:${room.title}`,
      `DESCRIPTION:Join Sangam meeting: ${room.roomCode}\\nMeet. Collaborate. Stay secure.`,
      `STATUS:CONFIRMED`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }
}

export const roomService = new RoomService();
