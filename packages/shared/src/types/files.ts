export interface SharedFileMetadata {
  id: string;
  roomId: string;
  name: string;
  size: number;
  mimeType: string;
  iv: string; // Base64 12-byte IV for AES-256-GCM
  encryptedKey?: string; // Optional wrapped key if using hybrid encryption
  uploaderId: string;
  uploaderName: string;
  recipientId?: string | null; // null for broadcast to room
  downloadUrl: string;
  createdAt: number;
}
