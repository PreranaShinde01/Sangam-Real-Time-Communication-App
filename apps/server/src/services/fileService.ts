import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export class FileService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(env.UPLOAD_DIR);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Save shared encrypted file metadata
   */
  async recordSharedFile(data: {
    roomId: string;
    uploaderId: string;
    uploaderName: string;
    name: string;
    size: number;
    mimeType: string;
    storagePath: string;
    iv: string;
    encryptedKey?: string;
    recipientId?: string;
  }) {
    // Validate disallowed extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.vbs', '.scr', '.pif'];
    const ext = path.extname(data.name).toLowerCase();
    if (dangerousExtensions.includes(ext)) {
      // Remove temporary stored file
      if (fs.existsSync(data.storagePath)) {
        fs.unlinkSync(data.storagePath);
      }
      throw new AppError('File type not permitted for security reasons', 400);
    }

    const file = await prisma.sharedFile.create({
      data: {
        roomId: data.roomId,
        uploaderId: data.uploaderId,
        name: data.name,
        size: data.size,
        mimeType: data.mimeType || 'application/octet-stream',
        storagePath: data.storagePath,
        iv: data.iv,
        encryptedKey: data.encryptedKey || null,
        recipientId: data.recipientId || null,
      },
    });

    return {
      id: file.id,
      roomId: file.roomId,
      name: file.name,
      size: file.size,
      mimeType: file.mimeType,
      iv: file.iv,
      encryptedKey: file.encryptedKey,
      uploaderId: data.uploaderId,
      uploaderName: data.uploaderName,
      recipientId: file.recipientId,
      downloadUrl: `/api/files/${file.id}/download`,
      createdAt: file.createdAt.getTime(),
    };
  }

  /**
   * Get file metadata and physical path for download
   */
  async getFileForDownload(fileId: string) {
    const file = await prisma.sharedFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new AppError('File not found', 404);
    }

    if (!fs.existsSync(file.storagePath)) {
      throw new AppError('File content has been purged or deleted', 410);
    }

    return file;
  }

  /**
   * Clean up all files associated with a meeting
   */
  async cleanupRoomFiles(roomId: string) {
    const files = await prisma.sharedFile.findMany({ where: { roomId } });
    for (const f of files) {
      try {
        if (fs.existsSync(f.storagePath)) {
          fs.unlinkSync(f.storagePath);
        }
      } catch {
        // ignore deletion failure for already removed files
      }
    }
    await prisma.sharedFile.deleteMany({ where: { roomId } });
  }
}

export const fileService = new FileService();
