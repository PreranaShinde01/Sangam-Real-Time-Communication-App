import {
  Participant,
  RoomSettings,
  RoomState,
  UserRole,
  Poll,
  BreakoutSession,
  generateRoomFingerprint,
} from '@sangam/shared';
import { prisma } from '../config/prisma';

export class RoomManager {
  // In-memory active rooms: roomId -> RoomState
  private rooms: Map<string, RoomState> = new Map();
  // Socket ID to roomId map for fast lookup
  private socketToRoom: Map<string, string> = new Map();
  // Polls per room: roomId -> Poll[]
  private roomPolls: Map<string, Poll[]> = new Map();
  // Breakout sessions per room: roomId -> BreakoutSession
  private roomBreakouts: Map<string, BreakoutSession> = new Map();

  /**
   * Initialize or retrieve room state
   */
  async getOrCreateRoom(roomId: string): Promise<RoomState> {
    let state = this.rooms.get(roomId);
    if (!state) {
      let dbRoom = null;
      try {
        dbRoom = await prisma.room.findFirst({
          where: { OR: [{ id: roomId }, { roomCode: roomId }] },
          include: { host: true },
        });
      } catch {
        // Fallback to in-memory room for ad-hoc or tests
      }

      const settings: RoomSettings = {
        isLocked: dbRoom ? dbRoom.isLocked : false,
        waitingRoomEnabled: dbRoom ? dbRoom.waitingRoomEnabled : false,
        allowGuest: dbRoom ? dbRoom.allowGuest : true,
        muteOnEntry: dbRoom ? dbRoom.muteOnEntry : false,
        allowScreenShare: dbRoom ? dbRoom.allowScreenShare : true,
        allowChat: dbRoom ? dbRoom.allowChat : true,
        allowWhiteboard: dbRoom ? dbRoom.allowWhiteboard : true,
        allowFiles: dbRoom ? dbRoom.allowFiles : true,
        e2eeEnabled: dbRoom ? dbRoom.e2eeEnabled : true,
        maxParticipants: dbRoom ? dbRoom.maxParticipants : 12,
        passcode: dbRoom?.passcode || undefined,
      };

      const createdAt = dbRoom ? dbRoom.createdAt.getTime() : Date.now();
      state = {
        roomId,
        roomCode: dbRoom ? dbRoom.roomCode : roomId,
        title: dbRoom ? dbRoom.title : 'Sangam Room',
        hostId: dbRoom ? dbRoom.hostId : '',
        settings,
        participants: {},
        waitingParticipants: {},
        activePresenterId: null,
        securityFingerprint: generateRoomFingerprint(roomId, createdAt),
        createdAt,
      };

      this.rooms.set(roomId, state);
    }
    return state;
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  getRoomBySocketId(socketId: string): RoomState | undefined {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return undefined;
    return this.rooms.get(roomId);
  }

  addParticipant(roomId: string, participant: Participant) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.participants[participant.id] = participant;
    this.socketToRoom.set(participant.id, roomId);
  }

  addWaitingParticipant(roomId: string, participant: Participant) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.waitingParticipants[participant.id] = participant;
    this.socketToRoom.set(participant.id, roomId);
  }

  removeParticipant(socketId: string): { roomId?: string; participant?: Participant } {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return {};

    this.socketToRoom.delete(socketId);
    const room = this.rooms.get(roomId);
    if (!room) return { roomId };

    const participant = room.participants[socketId] || room.waitingParticipants[socketId];
    delete room.participants[socketId];
    delete room.waitingParticipants[socketId];

    // If presenter left, reset presenter
    if (room.activePresenterId === socketId) {
      room.activePresenterId = null;
    }

    // Clean up empty room after 10 minutes of inactivity
    if (
      Object.keys(room.participants).length === 0 &&
      Object.keys(room.waitingParticipants).length === 0
    ) {
      // Keep empty room in cache briefly, remove if stays empty
      setTimeout(() => {
        const cur = this.rooms.get(roomId);
        if (
          cur &&
          Object.keys(cur.participants).length === 0 &&
          Object.keys(cur.waitingParticipants).length === 0
        ) {
          this.rooms.delete(roomId);
          this.roomPolls.delete(roomId);
          this.roomBreakouts.delete(roomId);
        }
      }, 10 * 60 * 1000);
    }

    return { roomId, participant };
  }

  admitParticipant(roomId: string, socketId: string): Participant | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const participant = room.waitingParticipants[socketId];
    if (!participant) return null;

    delete room.waitingParticipants[socketId];
    participant.inWaitingRoom = false;
    room.participants[socketId] = participant;

    return participant;
  }

  denyParticipant(roomId: string, socketId: string): Participant | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const participant = room.waitingParticipants[socketId];
    if (!participant) return null;

    delete room.waitingParticipants[socketId];
    this.socketToRoom.delete(socketId);
    return participant;
  }

  updateTrackState(
    socketId: string,
    updates: { audioEnabled?: boolean; videoEnabled?: boolean; screenShareEnabled?: boolean }
  ) {
    const room = this.getRoomBySocketId(socketId);
    if (!room || !room.participants[socketId]) return;

    const p = room.participants[socketId];
    if (updates.audioEnabled !== undefined) p.audioEnabled = updates.audioEnabled;
    if (updates.videoEnabled !== undefined) p.videoEnabled = updates.videoEnabled;
    if (updates.screenShareEnabled !== undefined) {
      p.screenShareEnabled = updates.screenShareEnabled;
      if (updates.screenShareEnabled) {
        room.activePresenterId = socketId;
      } else if (room.activePresenterId === socketId) {
        room.activePresenterId = null;
      }
    }
  }

  toggleHandRaise(socketId: string): boolean {
    const room = this.getRoomBySocketId(socketId);
    if (!room || !room.participants[socketId]) return false;

    const p = room.participants[socketId];
    p.handRaised = !p.handRaised;
    p.handRaisedAt = p.handRaised ? Date.now() : undefined;
    return p.handRaised;
  }

  // Polls
  getPolls(roomId: string): Poll[] {
    return this.roomPolls.get(roomId) || [];
  }

  addPoll(roomId: string, poll: Poll) {
    const list = this.getPolls(roomId);
    list.push(poll);
    this.roomPolls.set(roomId, list);
    return poll;
  }

  votePoll(roomId: string, pollId: string, optionId: string, voterId: string): Poll | null {
    const polls = this.getPolls(roomId);
    const poll = polls.find((p) => p.id === pollId);
    if (!poll || poll.status === 'ended') return null;

    // Remove any previous vote by this user on this poll
    poll.options.forEach((opt) => {
      opt.voterIds = opt.voterIds.filter((id) => id !== voterId);
    });

    // Add new vote
    const opt = poll.options.find((o) => o.id === optionId);
    if (opt) {
      opt.voterIds.push(voterId);
    }
    return poll;
  }

  endPoll(roomId: string, pollId: string): Poll | null {
    const polls = this.getPolls(roomId);
    const poll = polls.find((p) => p.id === pollId);
    if (!poll) return null;
    poll.status = 'ended';
    return poll;
  }

  // Breakout Rooms
  getBreakoutSession(roomId: string): BreakoutSession | undefined {
    return this.roomBreakouts.get(roomId);
  }

  setBreakoutSession(roomId: string, session: BreakoutSession) {
    this.roomBreakouts.set(roomId, session);
  }

  clearBreakoutSession(roomId: string) {
    this.roomBreakouts.delete(roomId);
  }
}

export const roomManager = new RoomManager();
