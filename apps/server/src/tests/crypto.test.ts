import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { generateRoomCode, generateRoomFingerprint, formatFingerprint } from '@sangam/shared';

describe('Cryptographic & Security Utilities', () => {
  it('should generate valid format room codes (e.g. san-gam-xyz)', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/);
  });

  it('should generate consistent security fingerprint codes', () => {
    const roomId = 'room-12345';
    const timestamp = 1700000000000;
    const fp1 = generateRoomFingerprint(roomId, timestamp);
    const fp2 = generateRoomFingerprint(roomId, timestamp);

    expect(fp1).toBe(fp2);
    expect(fp1).toMatch(/^\d{4} - \d{4} - \d{4}$/);
  });

  it('should encrypt and decrypt data with AES-256-GCM', () => {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    const plaintext = 'Sangam top secret meeting data payload';

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Decrypt
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    expect(decrypted).toBe(plaintext);
  });
});
