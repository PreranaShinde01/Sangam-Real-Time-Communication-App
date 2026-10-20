import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import {
  AuthTokens,
  AuthUser,
  JwtPayload,
  LoginInput,
  SignupInput,
  UserRole,
} from '@sangam/shared';

export class AuthService {
  /**
   * Register a new user
   */
  async signup(input: SignupInput): Promise<AuthTokens> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new AppError('An account with this email already exists', 409);
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
        role: UserRole.PARTICIPANT,
        isGuest: false,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_SIGNUP',
        details: `User registered with email ${user.email}`,
      },
    });

    return this.generateAuthTokens(user);
  }

  /**
   * Log in an existing user with optional TOTP 2FA check
   */
  async login(input: LoginInput): Promise<AuthTokens & { requires2FA?: boolean }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    // 2FA Verification if enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!input.totpCode) {
        return {
          accessToken: '',
          user: this.mapUser(user),
          requires2FA: true,
        };
      }

      const isValid = authenticator.check(input.totpCode, user.twoFactorSecret);
      if (!isValid) {
        throw new AppError('Invalid 2FA authentication code', 401);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: `Successful login for ${user.email}`,
      },
    });

    return this.generateAuthTokens(user);
  }

  /**
   * Create a guest session
   */
  async createGuest(name: string): Promise<AuthTokens> {
    const user = await prisma.user.create({
      data: {
        name,
        isGuest: true,
        role: UserRole.GUEST,
      },
    });

    return this.generateAuthTokens(user);
  }

  /**
   * Generate access and refresh token pair
   */
  async generateAuthTokens(user: any): Promise<AuthTokens> {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email || undefined,
      name: user.name,
      isGuest: user.isGuest,
      role: user.role as UserRole,
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    });

    // Generate refresh token with unique jti to ensure absolute uniqueness
    const refreshTokenString = jwt.sign(
      { ...payload, jti: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
      }
    );

    // Store refresh token with expiry (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      user: this.mapUser(user),
    };
  }

  /**
   * Rotate refresh token and issue new token pair
   */
  async refreshTokens(oldRefreshToken: string): Promise<AuthTokens> {
    if (!oldRefreshToken) {
      throw new AppError('No refresh token provided', 401);
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });

    // Reuse detection: if token is revoked or not found, revoke all refresh tokens for this user!
    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.updateMany({
          where: { userId: payload.userId },
          data: { revoked: true },
        });
      }
      throw new AppError('Refresh token invalid or re-used. Session terminated.', 401);
    }

    // Revoke old token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Issue new pair
    return this.generateAuthTokens(storedToken.user);
  }

  /**
   * Revoke token upon logout
   */
  async logout(refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }
  }

  /**
   * Setup 2FA: generates TOTP secret and QR code data URL
   */
  async generate2FA(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email || user.name, 'Sangam', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    // Save temporary secret
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return {
      secret,
      qrCodeDataUrl,
    };
  }

  /**
   * Verify and enable 2FA
   */
  async enable2FA(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new AppError('2FA setup not initialized', 400);
    }

    const isValid = authenticator.check(code, user.twoFactorSecret);
    if (!isValid) {
      throw new AppError('Invalid authentication code', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: '2FA_ENABLED',
        details: 'User enabled two-factor authentication',
      },
    });

    return { success: true };
  }

  /**
   * Disable 2FA
   */
  async disable2FA(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new AppError('2FA not active', 400);
    }

    const isValid = authenticator.check(code, user.twoFactorSecret);
    if (!isValid) {
      throw new AppError('Invalid authentication code', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return { success: true };
  }

  mapUser(user: any): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email || undefined,
      avatarUrl: user.avatarUrl || undefined,
      isGuest: user.isGuest,
      role: user.role as UserRole,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }
}

export const authService = new AuthService();
