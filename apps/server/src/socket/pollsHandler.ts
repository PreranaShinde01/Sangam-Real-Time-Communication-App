import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, Poll, BreakoutSession } from '@sangam/shared';
import { roomManager } from './roomManager';

export function registerPollsAndBreakoutHandlers(io: Server, socket: Socket) {
  // Poll creation
  socket.on(
    SOCKET_EVENTS.POLL_CREATE,
    (data: { question: string; options: string[]; isAnonymous?: boolean }) => {
      const room = roomManager.getRoomBySocketId(socket.id);
      if (!room) return;

      const participant = room.participants[socket.id];
      if (!participant) return;

      const newPoll: Poll = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        roomId: room.roomId,
        question: data.question,
        options: data.options.map((opt, i) => ({
          id: `opt-${i}`,
          text: opt,
          voterIds: [],
        })),
        createdBy: socket.id,
        creatorName: participant.name,
        isAnonymous: !!data.isAnonymous,
        status: 'active',
        createdAt: Date.now(),
      };

      roomManager.addPoll(room.roomId, newPoll);
      io.to(room.roomId).emit(SOCKET_EVENTS.POLL_UPDATE, roomManager.getPolls(room.roomId));
    }
  );

  // Poll voting
  socket.on(SOCKET_EVENTS.POLL_VOTE, (data: { pollId: string; optionId: string }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.votePoll(room.roomId, data.pollId, data.optionId, socket.id);
    io.to(room.roomId).emit(SOCKET_EVENTS.POLL_UPDATE, roomManager.getPolls(room.roomId));
  });

  // Poll end
  socket.on(SOCKET_EVENTS.POLL_END, (data: { pollId: string }) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    roomManager.endPoll(room.roomId, data.pollId);
    io.to(room.roomId).emit(SOCKET_EVENTS.POLL_UPDATE, roomManager.getPolls(room.roomId));
  });

  // Breakout Rooms: Start
  socket.on(SOCKET_EVENTS.BREAKOUT_START, (session: BreakoutSession) => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const participant = room.participants[socket.id];
    if (!participant || (!participant.isHost && !participant.isCohost)) return;

    roomManager.setBreakoutSession(room.roomId, session);
    io.to(room.roomId).emit(SOCKET_EVENTS.BREAKOUT_START, session);
  });

  // Breakout Rooms: End / Recall All
  socket.on(SOCKET_EVENTS.BREAKOUT_END, () => {
    const room = roomManager.getRoomBySocketId(socket.id);
    if (!room) return;

    const participant = room.participants[socket.id];
    if (!participant || (!participant.isHost && !participant.isCohost)) return;

    roomManager.clearBreakoutSession(room.roomId);
    io.to(room.roomId).emit(SOCKET_EVENTS.BREAKOUT_END);
  });
}
