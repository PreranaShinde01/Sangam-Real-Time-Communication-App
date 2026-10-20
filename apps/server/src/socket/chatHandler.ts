import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, ChatMessage, EmojiReaction, LiveCaption } from '@sangam/shared';
import { roomManager } from './roomManager';
import { prisma } from '../config/prisma';

export function registerChatHandlers(io: Server, socket: Socket) {
  // Send chat message
  socket.on(SOCKET_EVENTS.CHAT_MESSAGE_SEND, async (data: { text: string; recipientId?: string }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    if (!room.settings.allowChat) {
      socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Chat is currently disabled by host' });
      return;
    }

    const participant = room.participants[socket.id];
    if (!participant) return;

    const isPrivate = !!data.recipientId;
    let recipientName: string | null = null;

    if (isPrivate && data.recipientId) {
      const recipient = room.participants[data.recipientId];
      if (recipient) {
        recipientName = recipient.name;
      }
    }

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      roomId: room.roomId,
      senderId: socket.id,
      senderName: participant.name,
      senderAvatar: participant.avatarUrl,
      recipientId: data.recipientId || null,
      recipientName,
      text: data.text,
      timestamp: Date.now(),
      isPrivate,
    };

    // Save message asynchronously to DB if room is persisted in database
    prisma.room
      .findUnique({ where: { id: room.roomId } })
      .then((existing) => {
        if (existing) {
          return prisma.chatMessage.create({
            data: {
              roomId: room.roomId,
              senderId: participant.userId,
              senderName: participant.name,
              recipientId: data.recipientId || null,
              text: data.text,
              isPrivate,
            },
          });
        }
      })
      .catch(() => {});

    if (isPrivate && data.recipientId) {
      // Send only to sender and recipient
      socket.emit(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, message);
      io.to(data.recipientId).emit(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, message);
    } else {
      // Broadcast to all participants in the room
      io.to(room.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, message);
    }
  });

  // Floating emoji reaction
  socket.on(SOCKET_EVENTS.EMOJI_REACTION_SEND, (data: { emoji: string }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const participant = room.participants[socket.id];
    if (!participant) return;

    const reaction: EmojiReaction = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      emoji: data.emoji,
      senderId: socket.id,
      senderName: participant.name,
      timestamp: Date.now(),
    };

    io.to(room.roomId).emit(SOCKET_EVENTS.EMOJI_REACTION_SEND, reaction);
  });

  // Hand raise toggle
  socket.on(SOCKET_EVENTS.HAND_RAISE_TOGGLE, () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const isRaised = roomManager.toggleHandRaise(socket.id);
    const participant = room.participants[socket.id];

    io.to(room.roomId).emit(SOCKET_EVENTS.HAND_RAISE_TOGGLE, {
      socketId: socket.id,
      name: participant?.name || 'Participant',
      handRaised: isRaised,
    });
  });

  // Live Speech-to-Text caption broadcast
  socket.on(SOCKET_EVENTS.CAPTION_BROADCAST, (data: { text: string; isFinal: boolean }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const participant = room.participants[socket.id];
    if (!participant) return;

    const caption: LiveCaption = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      speakerId: socket.id,
      speakerName: participant.name,
      text: data.text,
      timestamp: Date.now(),
      isFinal: data.isFinal,
    };

    io.to(room.roomId).emit(SOCKET_EVENTS.CAPTION_BROADCAST, caption);
  });
}
