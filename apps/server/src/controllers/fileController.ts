import { Request, Response, NextFunction } from 'express';
import { fileService } from '../services/fileService';
import { AppError } from '../middleware/errorHandler';

export class FileController {
  async uploadFile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const { roomId, iv, encryptedKey, recipientId, originalName, mimeType } = req.body;
      if (!roomId || !iv) {
        throw new AppError('Missing required encrypted file metadata (roomId, iv)', 400);
      }

      const uploaderId = req.user ? req.user.userId : 'guest';
      const uploaderName = req.user ? req.user.name : 'Participant';

      const fileRecord = await fileService.recordSharedFile({
        roomId,
        uploaderId,
        uploaderName,
        name: originalName || req.file.originalname,
        size: req.file.size,
        mimeType: mimeType || req.file.mimetype,
        storagePath: req.file.path,
        iv,
        encryptedKey,
        recipientId,
      });

      res.status(201).json(fileRecord);
    } catch (err) {
      next(err);
    }
  }

  async downloadFile(req: Request, res: Response, next: NextFunction) {
    try {
      const fileId = String(req.params.fileId);
      const file = await fileService.getFileForDownload(fileId);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}.enc"`);
      res.setHeader('X-File-IV', file.iv);
      if (file.encryptedKey) {
        res.setHeader('X-File-Key', file.encryptedKey);
      }

      res.sendFile(file.storagePath);
    } catch (err) {
      next(err);
    }
  }
}

export const fileController = new FileController();
