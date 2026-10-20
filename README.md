# Sangam 🌐🔒

<div align="center">
  <img src="sangam-logo.svg" alt="Sangam Logo" width="120" height="120" />
  <h3>Meet. Collaborate. Stay secure.</h3>
  <p>Next-generation encrypted video conferencing, collaborative whiteboard, and real-time document sharing.</p>
</div>

---

## 📖 Overview

**"Sangam"** (Hindi/Sanskrit) means a confluence or meeting point where people come together. 
Sangam is a secure, real-time video conferencing and collaboration platform featuring peer-to-peer WebRTC video calling, presenter screen sharing, collaborative whiteboarding, client-side AES-256-GCM file sharing, and robust authentication with 2FA.

---

## 🚀 Key Features

### 1. Multi-User Video Calling
- **Mesh WebRTC (DTLS-SRTP)**: Direct low-latency peer connections.
- **Smart Video Grid**: Dynamic grid layouts supporting 1 to 12 participants.
- **Speaker vs Grid View**: Automatic spotlight on active speaker or presenter.
- **Active-Speaker Highlighting**: Real-time voice activity detection (VAD) with audio level indicators.
- **Green Room (Preview Screen)**: Test camera, microphone, and speaker before joining.
- **Auto-Reconnect & ICE Restart**: Network adaptation with reconnection handling.

### 2. Screen Sharing
- Share full screen, application windows, or browser tabs with system audio.
- Automatic presenter spotlight stage layout.
- Stop-sharing detection and host override capability.

### 3. Client-Side Encrypted File Sharing
- Files are encrypted **in the browser memory using AES-256-GCM** before upload.
- Encrypted file transmission with 12-byte cryptographically random IVs.
- Instant client-side decryption on download.
- Dangerous executable blocking (`.exe`, `.bat`, `.cmd`, `.sh`) and 50MB file size limit.
- Automatic room cleanup when meetings end.

### 4. Collaborative Shared Whiteboard
- Real-time shared canvas: Pen, Highlighter, Eraser, Shapes (Rect, Circle, Triangle), Arrows, Text, Sticky Notes.
- Color palette, stroke widths, undo/redo history stacks, and multi-page boards.
- Host permission control: toggle between collaborative and view-only lock.
- Export board to high-resolution PNG.

### 5. Authentication & Security
- Email + password registration and login with bcrypt hashing.
- Short-lived JWT Access Tokens + rotated Refresh Tokens stored in secure `httpOnly` cookies.
- Optional **Two-Factor Authentication (TOTP)** with QR code setup.
- Guest Join with instant temporary session.
- Role-based Access Control (RBAC): Host, Co-host, Participant, Guest, Admin.
- In-meeting security fingerprint code (SAS) and verification QR code.
- Multi-tier express rate limiters for auth and room join.

### 6. Meeting Experience & Moderation
- **In-Meeting Chat**: Public broadcast & 1:1 direct private messages with unread badge.
- **Reactions & Hand Raise**: Floating emoji bursts (🎉, ❤️, 👏, 😂, etc.) and hand raise queue.
- **Waiting Room / Lobby**: Host admits or denies participants from the waiting queue.
- **Room Lock & Passcodes**: Protect sensitive meetings.
- **Host Moderation**: Mute participant, mute all, kick participant, promote co-host, end meeting for all.
- **Polls & Live Voting**: Create instant polls with live tally percentage bars.
- **Live Captions & Transcripts**: Web Speech API speech-to-text with transcript (.txt) export.
- **Client-Side Meeting Recorder**: In-browser composite WebM/MP4 recording and automatic download.
- **Virtual Backgrounds**: Instant background blur mode.
- **Picture-in-Picture & Fullscreen**: Multi-tasking support.
- **Keyboard Shortcuts**: `M` (mute), `V` (camera), `S` (screen share), `H` (hand raise), `C` (chat).
- **Internationalization (i18n)**: English, Hindi (हिन्दी), and Marathi (मराठी) interface strings.

---

## 🛠️ Architecture

```mermaid
graph TD
    ClientA["Browser Client A (React + Vite + TS)"]
    ClientB["Browser Client B (React + Vite + TS)"]
    
    subgraph Sangam Monorepo
        SharedPkg["packages/shared (Zod Schemas, Event Types, Crypto)"]
        Server["apps/server (Node.js + Express + Socket.io)"]
        DB[(Prisma ORM / SQLite / PostgreSQL)]
        Storage[(Local / S3 Encrypted Storage)]
    end
    
    ClientA <-->|HTTP REST Auth, Rooms, Files| Server
    ClientB <-->|HTTP REST Auth, Rooms, Files| Server
    ClientA <-->|Socket.io Signaling & Events| Server
    ClientB <-->|Socket.io Signaling & Events| Server
    Server <--> DB
    Server <--> Storage
    ClientA <===>|WebRTC P2P Mesh (DTLS-SRTP)| ClientB
```

---

## 🏁 Quick Start

### Prerequisites
- Node.js >= 18.x (tested on v24.13.1)
- npm >= 9.x

### 1. Installation
Clone the repository and install dependencies across the monorepo workspaces:
```bash
npm install
```

### 2. Initialize Database & Demo Seed Data
```bash
# Push database schema to local SQLite
npm --workspace=@sangam/server run db:push

# Seed demo users and pre-configured room
npm --workspace=@sangam/server run seed
```

### 3. Start Development Servers
Start both the backend server and frontend development server concurrently:
```bash
# In terminal 1 (Backend API & Socket.io server on port 4000)
npm run dev:server

# In terminal 2 (Vite Frontend on port 5173)
npm run dev:web
```

Open your browser at **`http://localhost:5173`**.

---

## 🔑 Pre-Seeded Demo Accounts

You can log in immediately or click the **Autofill Demo Accounts** buttons on the login page:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin / Host** | `alice@sangam.local` | `Sangam@123` | Host controls, admin console, room lock |
| **Participant** | `bob@sangam.local` | `Sangam@123` | Collaboration, whiteboard, encrypted files |
| **Co-Host** | `charlie@sangam.local` | `Sangam@123` | Moderation, mute all, admit from lobby |

**Pre-Configured Demo Room:**
- Room Code: `san-gam-demo`
- Passcode: `123456`

---

## 🐳 Running with Docker

Sangam includes full Docker and `docker-compose` configurations:
```bash
cd infra
docker-compose up --build
```
This launches:
- `sangam-postgres`: PostgreSQL 16 database
- `sangam-redis`: Redis 7 instance
- `sangam-server`: Node.js backend container
- `sangam-web`: Nginx serving production frontend assets

---

## 🧪 Testing

Run the automated test suite covering unit, integration, and multi-peer socket signaling:
```bash
npm --workspace=@sangam/server test
```

### Test Results Summary:
- ✅ **Cryptographic & Security Suite**: Room code generator, SAS security fingerprint, and AES-256-GCM cipher checks.
- ✅ **Auth Service Suite**: User signup, login verification, password hashing, and 2FA TOTP configuration.
- ✅ **Room Service Suite**: Room creation, passcode validation, and iCalendar (.ics) generation.
- ✅ **Socket & Multi-Peer E2E Suite**: Multi-user room join, WebRTC Offer/Answer/ICE candidate relay, chat broadcast, whiteboard delta sync, and live poll tallying.

---

## 📚 Documentation
- [OpenAPI Specification](docs/openapi.yaml)
- [Socket.io Event Reference](docs/socket-events.md)
- [Security Model & Threat Assessment](docs/security-model.md)
- [Production Scalability Guide](docs/scaling.md)
