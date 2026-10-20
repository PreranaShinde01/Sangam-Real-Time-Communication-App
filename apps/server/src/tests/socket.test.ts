import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { io as Client, Socket } from 'socket.io-client';
import { app } from '../app';
import { initializeSocket } from '../socket';
import { SOCKET_EVENTS } from '@sangam/shared';

describe('Real-Time Gateway & Multi-Peer E2E Signaling', () => {
  let server: http.Server;
  let serverPort: number;
  let clientAlice: Socket;
  let clientBob: Socket;
  const testRoomId = 'test-e2e-room';

  beforeAll(async () => {
    server = http.createServer(app);
    initializeSocket(server);

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        serverPort = addr.port;
        resolve();
      });
    });
  });

  it('should allow Alice and Bob to connect and join room', async () => {
    const url = `http://127.0.0.1:${serverPort}`;

    clientAlice = Client(url, { auth: { guestName: 'Alice' } });
    clientBob = Client(url, { auth: { guestName: 'Bob' } });

    // Join room for Alice
    const aliceJoinedPromise = new Promise<void>((resolve) => {
      clientAlice.on(SOCKET_EVENTS.ROOM_JOIN_RESPONSE, (data) => {
        expect(data.success).toBe(true);
        resolve();
      });
    });

    clientAlice.emit(SOCKET_EVENTS.ROOM_JOIN_REQUEST, { roomId: testRoomId });
    await aliceJoinedPromise;

    // Join room for Bob & check Alice receives user-joined
    const bobJoinedPromise = new Promise<void>((resolve) => {
      clientAlice.on(SOCKET_EVENTS.ROOM_USER_JOINED, (participant) => {
        expect(participant.name).toBe('Bob');
        resolve();
      });
    });

    clientBob.emit(SOCKET_EVENTS.ROOM_JOIN_REQUEST, { roomId: testRoomId });
    await bobJoinedPromise;
  });

  it('should relay WebRTC offer/answer between Alice and Bob', async () => {
    const sdpOffer = { type: 'offer' as const, sdp: 'fake-offer-sdp' };
    const sdpAnswer = { type: 'answer' as const, sdp: 'fake-answer-sdp' };

    // Alice sends offer to Bob
    const offerReceivedPromise = new Promise<void>((resolve) => {
      clientBob.on(SOCKET_EVENTS.SIGNAL_OFFER, (data) => {
        expect(data.sdp.sdp).toBe('fake-offer-sdp');
        expect(data.senderSocketId).toBe(clientAlice.id);
        resolve();
      });
    });

    clientAlice.emit(SOCKET_EVENTS.SIGNAL_OFFER, {
      targetSocketId: clientBob.id,
      sdp: sdpOffer,
    });
    await offerReceivedPromise;

    // Bob sends answer back to Alice
    const answerReceivedPromise = new Promise<void>((resolve) => {
      clientAlice.on(SOCKET_EVENTS.SIGNAL_ANSWER, (data) => {
        expect(data.sdp.sdp).toBe('fake-answer-sdp');
        expect(data.senderSocketId).toBe(clientBob.id);
        resolve();
      });
    });

    clientBob.emit(SOCKET_EVENTS.SIGNAL_ANSWER, {
      targetSocketId: clientAlice.id,
      sdp: sdpAnswer,
    });
    await answerReceivedPromise;
  });

  it('should send and broadcast chat messages', async () => {
    const messagePromise = new Promise<void>((resolve) => {
      clientBob.on(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, (msg) => {
        expect(msg.text).toBe('Hello from Alice!');
        expect(msg.senderName).toBe('Alice');
        resolve();
      });
    });

    clientAlice.emit(SOCKET_EVENTS.CHAT_MESSAGE_SEND, {
      text: 'Hello from Alice!',
    });
    await messagePromise;
  });

  it('should sync whiteboard drawing actions across peers', async () => {
    const whiteboardPromise = new Promise<void>((resolve) => {
      clientBob.on(SOCKET_EVENTS.WHITEBOARD_UPDATE, (data) => {
        expect(data.page).toBe(0);
        expect(data.elements[0].tool).toBe('pen');
        resolve();
      });
    });

    clientAlice.emit(SOCKET_EVENTS.WHITEBOARD_UPDATE, {
      page: 0,
      elements: [
        {
          id: '1',
          tool: 'pen',
          color: '#4F46E5',
          strokeWidth: 4,
          opacity: 1,
          x: 10,
          y: 20,
          page: 0,
          createdBy: 'Alice',
          updatedAt: Date.now(),
        },
      ],
    });
    await whiteboardPromise;
  });

  it('should create poll and record live votes', async () => {
    const pollPromise = new Promise<void>((resolve) => {
      clientBob.on(SOCKET_EVENTS.POLL_UPDATE, (polls) => {
        const poll = polls[0];
        if (poll && poll.question === 'Should we release Sangam v1.0 today?') {
          resolve();
        }
      });
    });

    clientAlice.emit(SOCKET_EVENTS.POLL_CREATE, {
      question: 'Should we release Sangam v1.0 today?',
      options: ['Yes, absolutely!', 'Need 1 more review'],
    });
    await pollPromise;
  });

  afterAll(() => {
    clientAlice?.disconnect();
    clientBob?.disconnect();
    server?.close();
  });
});
