export interface PollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface Poll {
  id: string;
  roomId: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  creatorName: string;
  isAnonymous: boolean;
  status: 'active' | 'ended';
  createdAt: number;
}

export interface BreakoutRoomInfo {
  id: string;
  name: string;
  participantIds: string[];
}

export interface BreakoutSession {
  isActive: boolean;
  durationMinutes: number;
  endsAt?: number;
  rooms: BreakoutRoomInfo[];
}

export interface LiveCaption {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}
