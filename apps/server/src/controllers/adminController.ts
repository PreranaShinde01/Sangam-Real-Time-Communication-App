import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export class AdminController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [userCount, roomCount, activeRooms, filesCount] = await Promise.all([
        prisma.user.count(),
        prisma.room.count(),
        prisma.room.count({ where: { isEnded: false } }),
        prisma.sharedFile.count(),
      ]);

      res.status(200).json({
        stats: {
          userCount,
          roomCount,
          activeRooms,
          filesCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isGuest: true,
          twoFactorEnabled: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.status(200).json({ users });
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.auditLog.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      res.status(200).json({ logs });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
