import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, WhiteboardCursor, WhiteboardElement } from '@sangam/shared';
import { roomManager } from './roomManager';
import { prisma } from '../config/prisma';

export function registerWhiteboardHandlers(io: Server, socket: Socket) {
  // Elements update / draw action
  socket.on(
    SOCKET_EVENTS.WHITEBOARD_UPDATE,
    (data: { element?: WhiteboardElement; elements?: WhiteboardElement[]; page?: number }) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      if (!room.settings.allowWhiteboard) {
        socket.emit(SOCKET_EVENTS.ROOM_ERROR, { message: 'Whiteboard is currently locked by host' });
        return;
      }

      // Broadcast update to all other room members
      socket.to(room.roomId).emit(SOCKET_EVENTS.WHITEBOARD_UPDATE, data);

      // Asynchronously store snapshot if array of elements is sent and room exists in DB
      if (data.elements && data.elements.length > 0) {
        const page = data.page ?? 0;
        prisma.room
          .findUnique({ where: { id: room.roomId } })
          .then((existing) => {
            if (existing) {
              return prisma.whiteboardSnapshot.upsert({
                where: { id: `${room.roomId}-${page}` },
                update: { dataJson: JSON.stringify(data.elements) },
                create: {
                  id: `${room.roomId}-${page}`,
                  roomId: room.roomId,
                  page,
                  dataJson: JSON.stringify(data.elements),
                },
              });
            }
          })
          .catch(() => {});
      }
    }
  );

  // Live multiplayer pointer / cursor position
  socket.on(SOCKET_EVENTS.WHITEBOARD_CURSOR, (data: Omit<WhiteboardCursor, 'userId' | 'userName'>) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const participant = room.participants[socket.id];
    if (!participant) return;

    const cursor: WhiteboardCursor = {
      userId: socket.id,
      userName: participant.name,
      color: data.color || '#4f46e5',
      x: data.x,
      y: data.y,
      page: data.page || 0,
    };

    socket.to(room.roomId).emit(SOCKET_EVENTS.WHITEBOARD_CURSOR, cursor);
  });

  // Clear whiteboard canvas
  socket.on(SOCKET_EVENTS.WHITEBOARD_CLEAR, (data: { page: number }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const participant = room.participants[socket.id];
    // Allow clear if host, co-host, or if whiteboard is unlocked
    if (participant && (participant.isHost || participant.isCohost || room.settings.allowWhiteboard)) {
      io.to(room.roomId).emit(SOCKET_EVENTS.WHITEBOARD_CLEAR, data);

      prisma.whiteboardSnapshot
        .deleteMany({
          where: { roomId: room.roomId, page: data.page ?? 0 },
        })
        .catch(() => {});
    }
  });

  // Host lock toggle
  socket.on(SOCKET_EVENTS.WHITEBOARD_LOCK_TOGGLE, (data: { locked: boolean }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const participant = room.participants[socket.id];
    if (!participant || (!participant.isHost && !participant.isCohost)) return;

    room.settings.allowWhiteboard = !data.locked;
    io.to(room.roomId).emit(SOCKET_EVENTS.WHITEBOARD_LOCK_TOGGLE, { locked: data.locked });
  });
}
