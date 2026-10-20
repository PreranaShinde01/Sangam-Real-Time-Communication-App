import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@sangam/shared';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export interface WebRTCCallbacks {
  onRemoteStream: (peerId: string, stream: MediaStream) => void;
  onRemoteStreamRemoved: (peerId: string) => void;
  onActiveSpeaker: (peerId: string, isSpeaking: boolean) => void;
  onConnectionStateChange: (peerId: string, state: RTCPeerConnectionState) => void;
}

export class WebRTCManager {
  private peers: Map<string, RTCPeerConnection> = new Map();
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private localStream: MediaStream | null = null;
  private localScreenStream: MediaStream | null = null;
  private socket: Socket;
  private callbacks: WebRTCCallbacks;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  constructor(socket: Socket, callbacks: WebRTCCallbacks) {
    this.socket = socket;
    this.callbacks = callbacks;
    this.setupSocketListeners();
  }

  public setLocalStream(stream: MediaStream) {
    this.localStream = stream;
    this.setupAudioMeter(stream);

    // Add or replace tracks on all existing peer connections
    this.peers.forEach((pc) => {
      const senders = pc.getSenders();
      stream.getTracks().forEach((track) => {
        const existingSender =
          senders.find((s) => s.track && s.track.kind === track.kind) ||
          senders.find((s) => !s.track);
        if (existingSender) {
          existingSender.replaceTrack(track).catch((err) => console.warn('replaceTrack failed:', err));
        } else {
          try {
            pc.addTrack(track, stream);
          } catch (e) {
            console.warn('addTrack failed:', e);
          }
        }
      });
    });
  }

  public replaceVideoTrack(track: MediaStreamTrack | null) {
    if (this.localStream && track) {
      this.localStream.getVideoTracks().forEach((t) => {
        if (t !== track) {
          t.stop();
          this.localStream?.removeTrack(t);
        }
      });
      if (!this.localStream.getVideoTracks().includes(track)) {
        this.localStream.addTrack(track);
      }
    }

    this.peers.forEach((pc, peerId) => {
      const senders = pc.getSenders();
      const videoSender =
        senders.find((s) => s.track && s.track.kind === 'video') ||
        senders.find((s) => !s.track);

      if (videoSender) {
        videoSender.replaceTrack(track).catch((err) => console.warn('replaceVideoTrack failed:', err));
      } else if (track && this.localStream) {
        try {
          pc.addTrack(track, this.localStream);
          this.createOffer(peerId);
        } catch (e) {
          console.warn('addTrack video failed:', e);
        }
      }
    });
  }

  public replaceAudioTrack(track: MediaStreamTrack | null) {
    if (this.localStream && track) {
      this.localStream.getAudioTracks().forEach((t) => {
        if (t !== track) {
          t.stop();
          this.localStream?.removeTrack(t);
        }
      });
      if (!this.localStream.getAudioTracks().includes(track)) {
        this.localStream.addTrack(track);
      }
      this.setupAudioMeter(this.localStream);
    }

    this.peers.forEach((pc, peerId) => {
      const senders = pc.getSenders();
      const audioSender =
        senders.find((s) => s.track && s.track.kind === 'audio') ||
        senders.find((s) => !s.track);

      if (audioSender) {
        audioSender.replaceTrack(track).catch((err) => console.warn('replaceAudioTrack failed:', err));
      } else if (track && this.localStream) {
        try {
          pc.addTrack(track, this.localStream);
          this.createOffer(peerId);
        } catch (e) {
          console.warn('addTrack audio failed:', e);
        }
      }
    });
  }

  public setScreenStream(stream: MediaStream | null) {
    this.localScreenStream = stream;
    this.peers.forEach((pc) => {
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');

      if (stream) {
        const screenTrack = stream.getVideoTracks()[0];
        if (screenTrack && videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      } else if (this.localStream) {
        const camTrack = this.localStream.getVideoTracks()[0];
        if (camTrack && videoSender) {
          videoSender.replaceTrack(camTrack);
        }
      }
    });
  }

  /**
   * Create an offer to a new peer that joined
   */
  public async createOffer(targetSocketId: string) {
    const pc = this.getOrCreatePeerConnection(targetSocketId);
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      this.socket.emit(SOCKET_EVENTS.SIGNAL_OFFER, {
        targetSocketId,
        sdp: offer,
      });
    } catch (err) {
      console.error(`Failed to create offer for ${targetSocketId}`, err);
    }
  }

  private getOrCreatePeerConnection(peerId: string): RTCPeerConnection {
    let pc = this.peers.get(peerId);
    if (!pc) {
      pc = new RTCPeerConnection(RTC_CONFIG);

      // Add local media tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          pc!.addTrack(track, this.localStream!);
        });
      }

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit(SOCKET_EVENTS.SIGNAL_ICE_CANDIDATE, {
            targetSocketId: peerId,
            candidate: event.candidate,
          });
        }
      };

      // Handle remote tracks
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          this.callbacks.onRemoteStream(peerId, remoteStream);
        }
      };

      pc.onconnectionstatechange = () => {
        this.callbacks.onConnectionStateChange(peerId, pc!.connectionState);
        if (pc!.connectionState === 'failed') {
          this.restartIce(peerId);
        }
      };

      this.peers.set(peerId, pc);
    }
    return pc;
  }

  private setupSocketListeners() {
    // Receive WebRTC Offer
    this.socket.on(
      SOCKET_EVENTS.SIGNAL_OFFER,
      async (data: { senderSocketId: string; sdp: RTCSessionDescriptionInit }) => {
        const pc = this.getOrCreatePeerConnection(data.senderSocketId);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

          // Flush queued ICE candidates
          const queued = this.pendingCandidates.get(data.senderSocketId) || [];
          for (const cand of queued) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          this.pendingCandidates.delete(data.senderSocketId);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          this.socket.emit(SOCKET_EVENTS.SIGNAL_ANSWER, {
            targetSocketId: data.senderSocketId,
            sdp: answer,
          });
        } catch (err) {
          console.error(`Error handling offer from ${data.senderSocketId}`, err);
        }
      }
    );

    // Receive WebRTC Answer
    this.socket.on(
      SOCKET_EVENTS.SIGNAL_ANSWER,
      async (data: { senderSocketId: string; sdp: RTCSessionDescriptionInit }) => {
        const pc = this.peers.get(data.senderSocketId);
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

            // Flush queued candidates
            const queued = this.pendingCandidates.get(data.senderSocketId) || [];
            for (const cand of queued) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
            this.pendingCandidates.delete(data.senderSocketId);
          } catch (err) {
            console.error(`Error handling answer from ${data.senderSocketId}`, err);
          }
        }
      }
    );

    // Receive ICE candidate
    this.socket.on(
      SOCKET_EVENTS.SIGNAL_ICE_CANDIDATE,
      async (data: { senderSocketId: string; candidate: RTCIceCandidateInit }) => {
        const pc = this.peers.get(data.senderSocketId);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (err) {
            console.error(`Error adding ICE candidate from ${data.senderSocketId}`, err);
          }
        } else {
          // Queue candidate until remote description is set
          const queued = this.pendingCandidates.get(data.senderSocketId) || [];
          queued.push(data.candidate);
          this.pendingCandidates.set(data.senderSocketId, queued);
        }
      }
    );

    // Receive ICE restart request
    this.socket.on(SOCKET_EVENTS.SIGNAL_RESTART_ICE, async (data: { senderSocketId: string }) => {
      this.restartIce(data.senderSocketId);
    });
  }

  public async restartIce(peerId: string) {
    const pc = this.peers.get(peerId);
    if (!pc) return;
    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      this.socket.emit(SOCKET_EVENTS.SIGNAL_OFFER, {
        targetSocketId: peerId,
        sdp: offer,
      });
    } catch (e) {
      console.error(`ICE restart failed for ${peerId}`, e);
    }
  }

  public removePeer(peerId: string) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
    this.pendingCandidates.delete(peerId);
    this.callbacks.onRemoteStreamRemoved(peerId);
  }

  private setupAudioMeter(stream: MediaStream) {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let isSpeakingPrevious = false;

      const checkVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const isSpeaking = avg > 20 && audioTrack.enabled;

        if (isSpeaking !== isSpeakingPrevious) {
          isSpeakingPrevious = isSpeaking;
          this.socket.emit(SOCKET_EVENTS.ACTIVE_SPEAKER_CHANGE, { isSpeaking });
          this.callbacks.onActiveSpeaker('local', isSpeaking);
        }

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch {
      // AudioContext may be restricted until user gesture
    }
  }

  public destroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.audioContext) this.audioContext.close();

    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.pendingCandidates.clear();
  }
}
