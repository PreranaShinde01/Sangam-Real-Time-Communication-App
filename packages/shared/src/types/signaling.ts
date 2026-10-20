export interface SignalOfferPayload {
  targetSocketId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface SignalAnswerPayload {
  targetSocketId: string;
  sdp: RTCSessionDescriptionInit;
}

export interface SignalCandidatePayload {
  targetSocketId: string;
  candidate: RTCIceCandidateInit;
}

export interface TrackStateChangePayload {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
}

export interface PeerConnectionQuality {
  socketId: string;
  rttMs: number;
  packetsLost: number;
  quality: 'excellent' | 'good' | 'poor';
}
