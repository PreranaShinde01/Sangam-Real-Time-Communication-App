import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { roomManager } from './roomManager';
import { registerSignalingHandlers } from './signalingHandler';
import { registerChatHandlers } from './chatHandler';
import { registerWhiteboardHandlers } from './whiteboardHandler';
import { registerPollsAndBreakoutHandlers } from './pollsHandler';
import {
  SOCKET_EVENTS,
  Participant,
  UserRole,
  JwtPayload,
  SharedFileMetadata,
} from '@sangam/shared';
import { prisma } from '../config/prisma';

export function initializeSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  // Socket authentication middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    const guestName = socket.handshake.auth.guestName || socket.handshake.query.guestName;

    if (token) {
      try {
        const decoded = jwt.verify(token as string, env.JWT_ACCESS_SECRET) as JwtPayload;
        (socket as any).user = decoded;
        return next();
      } catch {
        // Token invalid, fallback to guest if guestName present
      }
    }

    if (guestName) {
      (socket as any).user = {
        userId: `guest-${socket.id.substring(0, 6)}`,
        name: guestName as string,
        isGuest: true,
        role: UserRole.GUEST,
      };
      return next();
    }

    // Default guest identifier
    (socket as any).user = {
      userId: `guest-${socket.id.substring(0, 6)}`,
      name: 'Guest User',
      isGuest: true,
      role: UserRole.GUEST,
    };
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.info({ socketId: socket.id, userId: user.userId, name: user.name }, 'Peer connected to socket gateway');

    // Register modular feature handlers
    registerSignalingHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerWhiteboardHandlers(io, socket);
    registerPollsAndBreakoutHandlers(io, socket);

    // ==========================================
    // Room Join & Lobby Logic
    // ==========================================
    socket.on(
      SOCKET_EVENTS.ROOM_JOIN_REQUEST,
      async (data: {
        roomId: string;
        passcode?: string;
        audioEnabled?: boolean;
        videoEnabled?: boolean;
      }) => {
        try {
          const room = await roomManager.getOrCreateRoom(data.roomId);

          // Check if room is locked
          const isHost = user.userId === room.hostId;
          if (room.settings.isLocked && !isHost) {
            socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
              message: 'This room is currently locked by the host.',
            });
            return;
          }

          // Check passcode
          if (room.settings.passcode && room.settings.passcode !== data.passcode && !isHost) {
            socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
              message: 'Invalid meeting passcode.',
              requiresPasscode: true,
            });
            return;
          }

          // Check max participants limit
          const currentCount = Object.keys(room.participants).length;
          if (currentCount >= room.settings.maxParticipants && !isHost) {
            socket.emit(SOCKET_EVENTS.ROOM_ERROR, {
              message: 'Meeting has reached maximum capacity.',
            });
            return;
          }

          const participant: Participant = {
            id: socket.id,
            userId: user.userId,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: isHost ? UserRole.HOST : (user.role as UserRole),
            isHost,
            isCohost: false,
            isGuest: !!user.isGuest,
            joinedAt: Date.now(),
            inWaitingRoom: false,
            audioEnabled: data.audioEnabled ?? !room.settings.muteOnEntry,
            videoEnabled: data.videoEnabled ?? true,
            screenShareEnabled: false,
            handRaised: false,
            connectionQuality: 'excellent',
          };

          // Waiting room check: if enabled and user is not host
          if (room.settings.waitingRoomEnabled && !isHost) {
            participant.inWaitingRoom = true;
            roomManager.addWaitingParticipant(room.roomId, participant);
            socket.join(`lobby:${room.roomId}`);

            socket.emit(SOCKET_EVENTS.LOBBY_STATUS_UPDATE, {
              inWaitingRoom: true,
              message: 'Please wait, the meeting host will let you in soon.',
            });

            // Notify hosts/co-hosts
            io.to(room.roomId).emit(SOCKET_EVENTS.LOBBY_USER_WAITING, participant);
            return;
          }

          // User joins the room directly
          roomManager.addParticipant(room.roomId, participant);
          socket.join(room.roomId);

          // Send current state and existing participants to newcomer
          socket.emit(SOCKET_EVENTS.ROOM_JOIN_RESPONSE, {
            success: true,
            roomState: room,
            participant,
            polls: roomManager.getPolls(room.roomId),
            breakout: roomManager.getBreakoutSession(room.roomId),
          });

          // Notify existing participants in the room
          socket.to(room.roomId).emit(SOCKET_EVENTS.ROOM_USER_JOINED, participant);

          logger.info(
            { roomId: room.roomId, participantId: socket.id, name: participant.name },
            'Participant joined room'
          );
        } catch (err: any) {
          logger.error({ err }, 'Error during room:join-request');
          socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Failed to join meeting room' });
        }
      }
    );

    // Host admits user from waiting lobby
    socket.on(SOCKET_EVENTS.LOBBY_ADMIT_USER, (data: { socketId: string }) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const hostParticipant = room.participants[socket.id];
      if (!hostParticipant || (!hostParticipant.isHost && !hostParticipant.isCohost)) return;

      const admitted = roomManager.admitParticipant(room.roomId, data.socketId);
      if (!admitted) return;

      const targetSocket = io.sockets.sockets.get(data.socketId);
      if (targetSocket) {
        targetSocket.leave(`lobby:${room.roomId}`);
        targetSocket.join(room.roomId);

        targetSocket.emit(SOCKET_EVENTS.LOBBY_STATUS_UPDATE, { inWaitingRoom: false });
        targetSocket.emit(SOCKET_EVENTS.ROOM_JOIN_RESPONSE, {
          success: true,
          roomState: room,
          participant: admitted,
          polls: roomManager.getPolls(room.roomId),
          breakout: roomManager.getBreakoutSession(room.roomId),
        });

        io.to(room.roomId).emit(SOCKET_EVENTS.ROOM_USER_JOINED, admitted);
      }
    });

    // Host denies user from lobby
    socket.on(SOCKET_EVENTS.LOBBY_DENY_USER, (data: { socketId: string }) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const hostParticipant = room.participants[socket.id];
      if (!hostParticipant || (!hostParticipant.isHost && !hostParticipant.isCohost)) return;

      roomManager.denyParticipant(room.roomId, data.socketId);
      const targetSocket = io.sockets.sockets.get(data.socketId);
      if (targetSocket) {
        targetSocket.emit(SOCKET_EVENTS.ROOM_ERROR, {
          message: 'The meeting host has declined your request to join.',
        });
        targetSocket.disconnect(true);
      }
    });

    // Track state change (mic/cam/screen)
    socket.on(
      SOCKET_EVENTS.TRACK_STATE_CHANGE,
      (data: { audioEnabled?: boolean; videoEnabled?: boolean; screenShareEnabled?: boolean }) => {
        const room = roomManager.getRoomBySocketId(socket.id);
        if (!room) return;

        roomManager.updateTrackState(socket.id, data);
        io.to(room.roomId).emit(SOCKET_EVENTS.TRACK_STATE_CHANGE, {
          socketId: socket.id,
          ...data,
          activePresenterId: room.activePresenterId,
        });
      }
    );

    // Active speaker indication
    socket.on(SOCKET_EVENTS.ACTIVE_SPEAKER_CHANGE, (data: { isSpeaking: boolean }) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      socket.to(room.roomId).emit(SOCKET_EVENTS.ACTIVE_SPEAKER_CHANGE, {
        socketId: socket.id,
        isSpeaking: data.isSpeaking,
      });
    });

    // File broadcast announcement
    socket.on(SOCKET_EVENTS.FILE_SHARED_ANNOUNCE, (fileMetadata: SharedFileMetadata) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      if (fileMetadata.recipientId) {
        io.to(fileMetadata.recipientId).emit(SOCKET_EVENTS.FILE_SHARED_ANNOUNCE, fileMetadata);
        socket.emit(SOCKET_EVENTS.FILE_SHARED_ANNOUNCE, fileMetadata);
      } else {
        io.to(room.roomId).emit(SOCKET_EVENTS.FILE_SHARED_ANNOUNCE, fileMetadata);
      }
    });

    // ==========================================
    // Host Moderation Controls
    // ==========================================
    socket.on(SOCKET_EVENTS.ROOM_LOCK_TOGGLE, (data: { locked: boolean }) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const p = room.participants[socket.id];
      if (!p || (!p.isHost && !p.isCohost)) return;

      room.settings.isLocked = data.locked;
      io.to(room.roomId).emit(SOCKET_EVENTS.ROOM_LOCK_TOGGLE, { isLocked: data.locked });
    });

    socket.on(SOCKET_EVENTS.HOST_MUTE_PARTICIPANT, (data: { targetSocketId: string }) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const p = room.participants[socket.id];
      if (!p || (!p.isHost && !p.isCohost)) return;

      io.to(data.targetSocketId).emit(SOCKET_EVENTS.HOST_MUTE_PARTICIPANT);
    });

    socket.on(SOCKET_EVENTS.HOST_MUTE_ALL, () => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const p = room.participants[socket.id];
      if (!p || (!p.isHost && !p.isCohost)) return;

      socket.to(room.roomId).emit(SOCKET_EVENTS.HOST_MUTE_PARTICIPANT);
    });

    socket.on(SOCKET_EVENTS.HOST_KICK_PARTICIPANT, (data: { targetSocketId: string }) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const p = room.participants[socket.id];
      if (!p || (!p.isHost && !p.isCohost)) return;

      const target = io.sockets.sockets.get(data.targetSocketId);
      if (target) {
        target.emit(SOCKET_EVENTS.ROOM_ERROR, {
          message: 'You have been removed from the meeting by the host.',
        });
        target.disconnect(true);
      }
    });

    socket.on(SOCKET_EVENTS.HOST_PROMOTE_COHOST, (data: { targetSocketId: string }) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const p = room.participants[socket.id];
      if (!p || !p.isHost) return;

      const target = room.participants[data.targetSocketId];
      if (target) {
        target.isCohost = true;
        target.role = UserRole.COHOST;
        io.to(room.roomId).emit(SOCKET_EVENTS.ROOM_UPDATE_STATE, room);
      }
    });

    socket.on(SOCKET_EVENTS.ROOM_END_ALL, async () => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const p = room.participants[socket.id];
      if (!p || !p.isHost) return;

      io.to(room.roomId).emit(SOCKET_EVENTS.ROOM_END_ALL);

      // Mark room as ended in DB
      prisma.room
        .update({
          where: { id: room.roomId },
          data: { isEnded: true, endedAt: new Date() },
        })
        .catch(() => {});
    });

    // ==========================================
    // Disconnect Handling
    // ==========================================
    socket.on('disconnect', () => {
      const { roomId, participant } = roomManager.removeParticipant(socket.id);
      if (roomId && participant) {
        io.to(roomId).emit(SOCKET_EVENTS.ROOM_USER_LEFT, {
          socketId: socket.id,
          name: participant.name,
        });
        logger.info({ roomId, socketId: socket.id, name: participant.name }, 'Participant left room');
      }
    });
  });

  return io;
}
