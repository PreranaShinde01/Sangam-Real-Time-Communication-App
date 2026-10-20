# Sangam: Security Model & Threat Assessment

## 1. Core Principles
Sangam is built around "Zero Trust Real-Time Collaboration". No participant or server has implicit trust beyond their cryptographic assertions and role authorization.

## 2. Threat Vector Mitigations

| Threat | Risk Level | Mitigation in Sangam |
|---|---|---|
| **Man-in-the-Middle (MitM) Media Snooping** | Critical | Media streams rely strictly on **DTLS-SRTP**. Keys are negotiated point-to-point and verified through the room SAS (Short Authentication String) fingerprint displayed in the UI and QR code. |
| **Server-Side File Snooping / Cloud Compromise** | Critical | Files are encrypted client-side using **AES-256-GCM** before upload using Web Crypto API. The server only ever handles encrypted ciphertext with randomized storage names. |
| **Meeting "Zoombombing" / Unauthorized Access** | High | Room codes are randomized (`san-gam-xyz`). Host can enforce meeting passcodes, waiting rooms (lobby approval), and room locks. |
| **Token Theft & Session Hijacking** | High | Refresh tokens are stored in `httpOnly` secure cookies with strict rotation and automatic family revocation upon replay detection. Access tokens are short-lived (15 minutes). |
| **Brute-Force & Credential Stuffing** | Medium | Multi-tiered express rate limiters on `/api/auth/*` (20 attempts/15m) and room join endpoints. Passwords hashed using bcrypt with salt rounds of 12. |
| **Malicious Executable Uploads** | Medium | Server rejects dangerous file extensions (`.exe`, `.bat`, `.cmd`, `.sh`, `.msi`, `.vbs`, etc.), enforces a 50MB size limit, and prevents arbitrary execution. |
| **Unauthorized Media Signaling Interception** | Medium | The Socket.io signaling gateway verifies that both the source and destination socket IDs belong to the same active room before forwarding SDP offers, answers, or ICE candidates. |

## 3. Cryptographic Primitives
- **Symmetric Cipher**: AES-256-GCM (12-byte cryptographically secure random IV generated per file/stream via `window.crypto.getRandomValues`).
- **Key Derivation**: PBKDF2 with SHA-256, 100,000 iterations.
- **Two-Factor Authentication**: TOTP (Time-based One-Time Password, RFC 6238) with `otplib` and QR code provisioning.
- **Password Hashing**: bcrypt with salt rounds of 12.
