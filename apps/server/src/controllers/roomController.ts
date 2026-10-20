import { Request, Response, NextFunction } from 'express';
import { roomService } from '../services/roomService';
import { CreateRoomSchema } from '@sangam/shared';

export class RoomController {
  async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const input = CreateRoomSchema.parse(req.body);
      const hostId = req.user!.userId;
      const room = await roomService.createRoom(hostId, input);

      res.status(201).json(room);
    } catch (err) {
      next(err);
    }
  }

  async getRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const codeOrId = String(req.params.codeOrId);
      const room = await roomService.getRoomByCode(codeOrId);

      res.status(200).json(room);
    } catch (err) {
      next(err);
    }
  }

  async verifyPasscode(req: Request, res: Response, next: NextFunction) {
    try {
      const roomId = String(req.params.roomId);
      const { passcode } = req.body;
      const isValid = await roomService.verifyPasscode(roomId, passcode);

      res.status(200).json({ valid: isValid });
    } catch (err) {
      next(err);
    }
  }

  async getUserMeetings(req: Request, res: Response, next: NextFunction) {
    try {
      const meetings = await roomService.getUserMeetings(req.user!.userId);
      res.status(200).json({ meetings });
    } catch (err) {
      next(err);
    }
  }

  async downloadIcs(req: Request, res: Response, next: NextFunction) {
    try {
      const roomId = String(req.params.roomId);
      const room = await roomService.getRoomByCode(roomId);
      const icsData = roomService.generateIcs(room);

      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', `attachment; filename="${room.roomCode}.ics"`);
      res.send(icsData);
    } catch (err) {
      next(err);
    }
  }
}

export const roomController = new RoomController();
