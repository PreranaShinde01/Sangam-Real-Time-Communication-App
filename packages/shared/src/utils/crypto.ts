/**
 * Cryptographic helper functions for Sangam (fingerprint generation, formatters)
 */

export function formatFingerprint(inputString: string): string {
  let hash = 0;
  for (let i = 0; i < inputString.length; i++) {
    const char = inputString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  const positiveHash = Math.abs(hash);
  const str = positiveHash.toString().padStart(12, '7');
  return `${str.slice(0, 4)} - ${str.slice(4, 8)} - ${str.slice(8, 12)}`;
}

export function generateRoomFingerprint(roomId: string, createdAt: number): string {
  return formatFingerprint(`${roomId}:${createdAt}:sangam-secure-v1`);
}

export function generateRoomCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${segment(3)}-${segment(4)}-${segment(3)}`;
}
