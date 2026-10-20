/**
 * Client-Side AES-256-GCM File and Data Encryption using Web Crypto API
 */

export class ClientCrypto {
  /**
   * Derive a 256-bit AES-GCM CryptoKey from a passphrase (e.g. room code or secret)
   */
  static async deriveKey(passphrase: string, saltStr = 'sangam-secure-salt'): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(saltStr),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt an ArrayBuffer with AES-256-GCM
   */
  static async encryptBuffer(
    buffer: ArrayBuffer,
    key: CryptoKey
  ): Promise<{ ciphertext: ArrayBuffer; iv: string }> {
    // Generate a secure random 12-byte IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      buffer
    );

    // Convert IV to base64
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return {
      ciphertext,
      iv: ivBase64,
    };
  }

  /**
   * Decrypt an ArrayBuffer with AES-256-GCM
   */
  static async decryptBuffer(
    ciphertext: ArrayBuffer,
    ivBase64: string,
    key: CryptoKey
  ): Promise<ArrayBuffer> {
    const ivBinary = atob(ivBase64);
    const iv = new Uint8Array(ivBinary.length);
    for (let i = 0; i < ivBinary.length; i++) {
      iv[i] = ivBinary.charCodeAt(i);
    }

    return window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );
  }

  /**
   * Encrypt a File object and return an encrypted Blob + IV
   */
  static async encryptFile(
    file: File,
    passphrase: string
  ): Promise<{ encryptedBlob: Blob; iv: string }> {
    const key = await this.deriveKey(passphrase);
    const arrayBuffer = await file.arrayBuffer();
    const { ciphertext, iv } = await this.encryptBuffer(arrayBuffer, key);
    return {
      encryptedBlob: new Blob([ciphertext], { type: 'application/octet-stream' }),
      iv,
    };
  }

  /**
   * Decrypt an encrypted Blob and return a decrypted Blob with the original mimeType
   */
  static async decryptFile(
    blob: Blob,
    iv: string,
    passphrase: string,
    mimeType: string
  ): Promise<Blob> {
    const key = await this.deriveKey(passphrase);
    const arrayBuffer = await blob.arrayBuffer();
    const decryptedBuffer = await this.decryptBuffer(arrayBuffer, iv, key);
    return new Blob([decryptedBuffer], { type: mimeType });
  }
}
