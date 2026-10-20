# Sangam: Production Scalability & High-Load Architecture

## 1. From Mesh to SFU (Selective Forwarding Unit)
The current architecture implements full **WebRTC Mesh** for low-latency peer-to-peer conferencing (optimal for 2 to 6 participants). When scaling to larger rooms (up to 50+ participants):
- Integrate **mediasoup** or **LiveKit** as a Selective Forwarding Unit (SFU).
- Each client sends 1 uplink audio + video stream (with simulcast: low, medium, high resolution).
- The SFU routes video layers adaptively based on each peer's screen real estate and bandwidth.
- E2EE can be preserved in SFUs using **WebRTC Insertable Streams / SFrame** (RFC 9605), where media payloads are encrypted client-to-client and the SFU only routes opaque encrypted frames.

## 2. Horizontal Server Scaling
- **Stateless API & Signaling**: Express servers run stateless behind an Nginx or AWS ALB reverse proxy with sticky sessions or Redis-backed session stores.
- **Socket.io Redis Streams Adapter**: Use `@socket.io/redis-adapter` or `@socket.io/redis-streams-adapter` to distribute room events, chat messages, and signaling across multiple Node.js nodes.
- **Coturn Cluster**: Deploy geo-distributed coturn instances close to user regions with round-robin DNS or Anycast IP to minimize ICE candidate gathering latency.

## 3. High-Throughput Collaborative Canvas
- For massive whiteboard collaboration, leverage **Yjs over WebSockets (y-websocket)** with Redis persistence and LevelDB/SQLite document history.
- Delta updates are debounced and batched to maintain 60 FPS while minimizing network packet frequency.

## 4. Storage & Media Recording
- Transition local uploads to **S3 / Cloudflare R2** with presigned upload and download URLs.
- For server-side meeting recordings without consuming user client resources, deploy a headless Chromium container (Puppeteer / Egress worker) that renders the composite meeting view directly into an FFmpeg HLS/MP4 stream stored in S3.
