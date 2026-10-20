import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { LoginSchema, SignupSchema, GuestJoinSchema, VerifyTotpSchema } from '@sangam/shared';
import { prisma } from '../config/prisma';

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const input = SignupSchema.parse(req.body);
      const result = await authService.signup(input);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input = LoginSchema.parse(req.body);
      const result = await authService.login(input);

      if (result.requires2FA) {
        return res.status(200).json({ requires2FA: true, userId: result.user.id });
      }

      res.cookie('refreshToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async guestJoin(req: Request, res: Response, next: NextFunction) {
    try {
      const input = GuestJoinSchema.parse(req.body);
      const result = await authService.createGuest(input.name);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      const result = await authService.refreshTokens(token);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      await authService.logout(token);
      res.clearCookie('refreshToken');
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ user: authService.mapUser(user) });
    } catch (err) {
      next(err);
    }
  }

  async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.generate2FA(req.user!.userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async enable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const input = VerifyTotpSchema.parse(req.body);
      const result = await authService.enable2FA(req.user!.userId, input.code);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async disable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const input = VerifyTotpSchema.parse(req.body);
      const result = await authService.disable2FA(req.user!.userId, input.code);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
