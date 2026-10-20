export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string; // Socket ID or user ID
  senderName: string;
  senderAvatar?: string;
  recipientId?: string | null; // null for public room chat, or target socket/user ID for private
  recipientName?: string | null;
  text: string;
  timestamp: number;
  isPrivate: boolean;
  isSystem?: boolean;
}

export interface EmojiReaction {
  id: string;
  emoji: string;
  senderId: string;
  senderName: string;
  timestamp: number;
}
