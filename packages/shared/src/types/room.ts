import { z } from 'zod';
import { UserRole } from './auth.js';

export interface RoomSettings {
  isLocked: boolean;
  waitingRoomEnabled: boolean;
  allowGuest: boolean;
  muteOnEntry: boolean;
  allowScreenShare: boolean;
  allowChat: boolean;
  allowWhiteboard: boolean;
  allowFiles: boolean;
  e2eeEnabled: boolean;
  maxParticipants: number;
  passcode?: string | null;
}

export const CreateRoomSchema = z.object({
  title: z.string().min(2).max(100).default('Sangam Meeting'),
  passcode: z.string().max(20).optional(),
  waitingRoomEnabled: z.boolean().default(false),
  allowGuest: z.boolean().default(true),
  muteOnEntry: z.boolean().default(false),
  allowScreenShare: z.boolean().default(true),
  allowChat: z.boolean().default(true),
  allowWhiteboard: z.boolean().default(true),
  allowFiles: z.boolean().default(true),
  e2eeEnabled: z.boolean().default(true),
  maxParticipants: z.number().int().min(2).max(50).default(12),
  scheduledStart: z.string().datetime().optional(),
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;

export interface Participant {
  id: string; // Socket ID or Session Participant ID
  userId: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  isHost: boolean;
  isCohost: boolean;
  isGuest: boolean;
  joinedAt: number;
  inWaitingRoom: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  handRaised: boolean;
  handRaisedAt?: number;
  currentBreakoutRoomId?: string | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'reconnecting';
}

export interface RoomState {
  roomId: string;
  roomCode: string;
  title: string;
  hostId: string;
  settings: RoomSettings;
  participants: Record<string, Participant>;
  waitingParticipants: Record<string, Participant>;
  activePresenterId?: string | null;
  securityFingerprint: string;
  createdAt: number;
}
