import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, SignalOfferPayload, SignalAnswerPayload, SignalCandidatePayload } from '@sangam/shared';
import { roomManager } from './roomManager';
import { logger } from '../utils/logger';

export function registerSignalingHandlers(io: Server, socket: Socket) {
  // Relay WebRTC Offer
  socket.on(SOCKET_EVENTS.SIGNAL_OFFER, (data: SignalOfferPayload) => {
    const senderRoom = roomManager.getRoomBySocketId(socket.id);
    const targetRoom = roomManager.getRoomBySocketId(data.targetSocketId);

    if (!senderRoom || !targetRoom || senderRoom.roomId !== targetRoom.roomId) {
      logger.warn(
        { sender: socket.id, target: data.targetSocketId },
        'Rejected unauthorized signal:offer across different rooms'
      );
      return;
    }

    io.to(data.targetSocketId).emit(SOCKET_EVENTS.SIGNAL_OFFER, {
      senderSocketId: socket.id,
      sdp: data.sdp,
    });
  });

  // Relay WebRTC Answer
  socket.on(SOCKET_EVENTS.SIGNAL_ANSWER, (data: SignalAnswerPayload) => {
    const senderRoom = roomManager.getRoomBySocketId(socket.id);
    const targetRoom = roomManager.getRoomBySocketId(data.targetSocketId);

    if (!senderRoom || !targetRoom || senderRoom.roomId !== targetRoom.roomId) {
      logger.warn(
        { sender: socket.id, target: data.targetSocketId },
        'Rejected unauthorized signal:answer across different rooms'
      );
      return;
    }

    io.to(data.targetSocketId).emit(SOCKET_EVENTS.SIGNAL_ANSWER, {
      senderSocketId: socket.id,
      sdp: data.sdp,
    });
  });

  // Relay ICE Candidate
  socket.on(SOCKET_EVENTS.SIGNAL_ICE_CANDIDATE, (data: SignalCandidatePayload) => {
    const senderRoom = roomManager.getRoomBySocketId(socket.id);
    const targetRoom = roomManager.getRoomBySocketId(data.targetSocketId);

    if (!senderRoom || !targetRoom || senderRoom.roomId !== targetRoom.roomId) {
      return;
    }

    io.to(data.targetSocketId).emit(SOCKET_EVENTS.SIGNAL_ICE_CANDIDATE, {
      senderSocketId: socket.id,
      candidate: data.candidate,
    });
  });

  // ICE Restart request
  socket.on(SOCKET_EVENTS.SIGNAL_RESTART_ICE, (data: { targetSocketId: string }) => {
    const senderRoom = roomManager.getRoomBySocketId(socket.id);
    const targetRoom = roomManager.getRoomBySocketId(data.targetSocketId);

    if (senderRoom && targetRoom && senderRoom.roomId === targetRoom.roomId) {
      io.to(data.targetSocketId).emit(SOCKET_EVENTS.SIGNAL_RESTART_ICE, {
        senderSocketId: socket.id,
      });
    }
  });
}
