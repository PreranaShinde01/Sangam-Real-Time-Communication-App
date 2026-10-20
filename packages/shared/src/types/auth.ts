import { z } from 'zod';

export enum UserRole {
  HOST = 'HOST',
  COHOST = 'COHOST',
  PARTICIPANT = 'PARTICIPANT',
  GUEST = 'GUEST',
  ADMIN = 'ADMIN',
}

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(64),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  totpCode: z.string().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const GuestJoinSchema = z.object({
  name: z.string().min(2, 'Display name must be at least 2 characters').max(50),
  passcode: z.string().optional(),
});

export type GuestJoinInput = z.infer<typeof GuestJoinSchema>;

export const VerifyTotpSchema = z.object({
  code: z.string().length(6, 'TOTP code must be 6 digits'),
});

export type VerifyTotpInput = z.infer<typeof VerifyTotpSchema>;

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  isGuest: boolean;
  role: UserRole;
  twoFactorEnabled?: boolean;
}

export interface JwtPayload {
  userId: string;
  email?: string;
  name: string;
  isGuest: boolean;
  role: UserRole;
  sessionId?: string;
}

export interface AuthTokens {
  accessToken: string;
  user: AuthUser;
}
