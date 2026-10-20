import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { authService } from '../services/authService';
import { prisma } from '../config/prisma';

describe('Auth Service & Security Suite', () => {
  const testEmail = `test-${Date.now()}@sangam.local`;
  const testPassword = 'Password@123';
  let createdUserId: string;

  it('should successfully register a user and issue JWT tokens', async () => {
    const res = await authService.signup({
      name: 'Test Engineer',
      email: testEmail,
      password: testPassword,
    });

    expect(res.accessToken).toBeDefined();
    expect(res.user.email).toBe(testEmail.toLowerCase());
    createdUserId = res.user.id;
  });

  it('should reject registration with duplicate email', async () => {
    await expect(
      authService.signup({
        name: 'Another User',
        email: testEmail,
        password: testPassword,
      })
    ).rejects.toThrow('already exists');
  });

  it('should authenticate user with valid credentials', async () => {
    const res = await authService.login({
      email: testEmail,
      password: testPassword,
    });

    expect(res.accessToken).toBeTruthy();
    expect(res.user.name).toBe('Test Engineer');
  });

  it('should reject invalid password', async () => {
    await expect(
      authService.login({
        email: testEmail,
        password: 'WrongPassword999',
      })
    ).rejects.toThrow('Invalid email or password');
  });

  it('should create and verify 2FA TOTP configuration', async () => {
    const setup = await authService.generate2FA(createdUserId);
    expect(setup.secret).toBeTruthy();
    expect(setup.qrCodeDataUrl).toContain('data:image/png;base64');
  });

  afterAll(async () => {
    if (createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
  });
});
