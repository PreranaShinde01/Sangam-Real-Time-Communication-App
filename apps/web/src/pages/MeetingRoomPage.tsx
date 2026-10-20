import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  ShieldAlert,
  Copy,
  Check,
  Maximize,
  Minimize,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';
import { WebRTCManager } from '../lib/webrtc';
import { SpeechManager } from '../lib/speech';
import { MeetingRecorder } from '../lib/recorder';
import { VideoGrid } from '../components/video/VideoGrid';
import { ControlBar } from '../components/room/ControlBar';
import { ChatPanel } from '../components/panels/ChatPanel';
import { ParticipantsPanel } from '../components/panels/ParticipantsPanel';
import { FilesPanel } from '../components/panels/FilesPanel';
import { WhiteboardPanel } from '../components/panels/WhiteboardPanel';
import { PollsPanel } from '../components/panels/PollsPanel';
import { SecurityModal } from '../components/room/SecurityModal';
import { WaitingRoomModal } from '../components/room/WaitingRoomModal';
import { ReactionsOverlay } from '../components/room/ReactionsOverlay';
import { CaptionsOverlay } from '../components/room/CaptionsOverlay';
import { SOCKET_EVENTS, EmojiReaction, SharedFileMetadata } from '@sangam/shared';

export const MeetingRoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    roomState,
    setRoomState,
    myParticipant,
    setMyParticipant,
    addParticipant,
    removeParticipant,
    setRemoteStream,
    removeRemoteStream,
    localStream,
    setLocalStream,
    screenStream,
    setScreenStream,
    audioEnabled,
    setAudioEnabled,
    videoEnabled,
    setVideoEnabled,
    screenShareEnabled,
    setScreenShareEnabled,
    handRaised,
    setHandRaised,
    activeTab,
    setActiveTab,
    isRecording,
    setIsRecording,
    addChatMessage,
    addSharedFile,
    setPolls,
    addCaption,
    setActiveSpeakerId,
    setSecurityModalOpen,
    resetRoom,
    updateParticipantTrackState,
  } = useRoomStore();

  const [inLobby, setInLobby] = useState(false);
  const [lobbyMessage, setLobbyMessage] = useState('Please wait for the host to admit you.');
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const rtcManagerRef = useRef<WebRTCManager | null>(null);
  const speechManagerRef = useRef<SpeechManager | null>(null);
  const recorderRef = useRef<MeetingRecorder>(new MeetingRecorder());

  useEffect(() => {
    initMeeting();
    return () => {
      cleanupMeeting();
    };
  }, [roomCode]);

  // Initialize Room, Media & Socket Connection
  const initMeeting = async () => {
    try {
      const token = localStorage.getItem('sangam_token');
      const paramName = searchParams.get('name') || user?.name || 'Guest User';
      const initialAudio = searchParams.get('audio') !== '0';
      const initialVideo = searchParams.get('video') !== '0';
      const passcode = searchParams.get('passcode') || undefined;

      // 1. Acquire Local Camera and Mic
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
          } catch {
            stream = new MediaStream();
          }
        }
      }

      // Apply initial toggle settings
      stream.getAudioTracks().forEach((t) => (t.enabled = initialAudio));
      stream.getVideoTracks().forEach((t) => (t.enabled = initialVideo));
      setAudioEnabled(initialAudio);
      setVideoEnabled(initialVideo);
      setLocalStream(stream);

      // 2. Connect to Socket.io Gateway
      const socket = io('/', {
        auth: { token, guestName: paramName },
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      // 3. Initialize WebRTC Manager
      const rtcManager = new WebRTCManager(socket, {
        onRemoteStream: (peerId, remoteStream) => {
          setRemoteStream(peerId, remoteStream);
        },
        onRemoteStreamRemoved: (peerId) => {
          removeRemoteStream(peerId);
        },
        onActiveSpeaker: (peerId, isSpeaking) => {
          setActiveSpeakerId(isSpeaking ? peerId : null);
        },
        onConnectionStateChange: (peerId, state) => {
          console.log(`Connection with ${peerId} changed to: ${state}`);
        },
      });
      rtcManager.setLocalStream(stream);
      rtcManagerRef.current = rtcManager;

      // 4. Initialize Live Speech-to-Text Captions
      const speechManager = new SpeechManager((text, isFinal) => {
        socket.emit(SOCKET_EVENTS.CAPTION_BROADCAST, { text, isFinal });
      });
      speechManagerRef.current = speechManager;

      // 5. Socket Listeners
      setupSocketHandlers(socket, rtcManager);

      // 6. Send Join Request
      socket.emit(SOCKET_EVENTS.ROOM_JOIN_REQUEST, {
        roomId: roomCode,
        passcode,
        audioEnabled: initialAudio,
        videoEnabled: initialVideo,
      });
    } catch (err: any) {
      alert(`Could not initialize meeting: ${err.message}`);
      navigate('/dashboard');
    }
  };

  const setupSocketHandlers = (socket: Socket, rtcManager: WebRTCManager) => {
    // Join Response
    socket.on(
      SOCKET_EVENTS.ROOM_JOIN_RESPONSE,
      (data: { success: boolean; roomState: any; participant: any; polls?: any[] }) => {
        setInLobby(false);
        setRoomState(data.roomState);
        setMyParticipant(data.participant);
        if (data.polls) setPolls(data.polls);

        // Initiate WebRTC mesh offers to all existing participants
        Object.keys(data.roomState.participants).forEach((peerSocketId) => {
          if (peerSocketId !== socket.id) {
            rtcManager.createOffer(peerSocketId);
          }
        });
      }
    );

    // Waiting Lobby Notification
    socket.on(SOCKET_EVENTS.LOBBY_STATUS_UPDATE, (data: { inWaitingRoom: boolean; message?: string }) => {
      setInLobby(data.inWaitingRoom);
      if (data.message) setLobbyMessage(data.message);
    });

    // New User Joined
    socket.on(SOCKET_EVENTS.ROOM_USER_JOINED, (participant: any) => {
      addParticipant(participant);
    });

    // User Left
    socket.on(SOCKET_EVENTS.ROOM_USER_LEFT, (data: { socketId: string }) => {
      rtcManager.removePeer(data.socketId);
      removeParticipant(data.socketId);
    });

    // Chat Message Received
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, (message: any) => {
      addChatMessage(message);
    });

    // Emoji Reaction Received
    socket.on(SOCKET_EVENTS.EMOJI_REACTION_SEND, (reaction: EmojiReaction) => {
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2500);
    });

    // Track State Change (Mic / Cam / Screen)
    socket.on(
      SOCKET_EVENTS.TRACK_STATE_CHANGE,
      (data: {
        socketId: string;
        audioEnabled?: boolean;
        videoEnabled?: boolean;
        screenShareEnabled?: boolean;
        handRaised?: boolean;
      }) => {
        updateParticipantTrackState(data.socketId, data);
      }
    );

    // Hand Raise Toggle
    socket.on(SOCKET_EVENTS.HAND_RAISE_TOGGLE, (data: { socketId: string; handRaised: boolean }) => {
      if (data.socketId === socket.id) {
        setHandRaised(data.handRaised);
      }
      updateParticipantTrackState(data.socketId, { handRaised: data.handRaised });
    });

    // File Shared
    socket.on(SOCKET_EVENTS.FILE_SHARED_ANNOUNCE, (file: SharedFileMetadata) => {
      addSharedFile(file);
    });

    // Polls Update
    socket.on(SOCKET_EVENTS.POLL_UPDATE, (polls: any[]) => {
      setPolls(polls);
    });

    // Captions Broadcast
    socket.on(SOCKET_EVENTS.CAPTION_BROADCAST, (caption: any) => {
      addCaption(caption);
    });

    // Host Mute
    socket.on(SOCKET_EVENTS.HOST_MUTE_PARTICIPANT, () => {
      handleToggleAudio(false);
      alert('You have been muted by the host.');
    });

    // Host Ended Room
    socket.on(SOCKET_EVENTS.ROOM_END_ALL, () => {
      alert('The meeting has been ended by the host.');
      cleanupMeeting();
      navigate('/dashboard');
    });

    // Room Error
    socket.on(SOCKET_EVENTS.ROOM_ERROR, (err: { message: string }) => {
      alert(err.message);
      cleanupMeeting();
      navigate('/dashboard');
    });
  };

  const handleToggleAudio = async (forcedVal?: boolean) => {
    const next = forcedVal !== undefined ? forcedVal : !audioEnabled;
    let stream = localStream;
    const audioTracks = stream?.getAudioTracks() || [];

    if (next && (audioTracks.length === 0 || audioTracks.every((t) => t.readyState === 'ended'))) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = newStream.getAudioTracks()[0];
        if (newTrack) {
          if (!stream) {
            stream = new MediaStream([newTrack]);
            setLocalStream(stream);
            rtcManagerRef.current?.setLocalStream(stream);
          } else {
            stream.addTrack(newTrack);
          }
          rtcManagerRef.current?.replaceAudioTrack(newTrack);
        }
      } catch (err) {
        console.warn('Microphone permission or acquisition failed:', err);
      }
    } else {
      audioTracks.forEach((t) => (t.enabled = next));
    }

    setAudioEnabled(next);
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.TRACK_STATE_CHANGE, { audioEnabled: next });
      if (socketRef.current.id) {
        updateParticipantTrackState(socketRef.current.id, { audioEnabled: next });
      }
    }
  };

  const handleToggleVideo = async () => {
    const next = !videoEnabled;
    let stream = localStream;
    const videoTracks = stream?.getVideoTracks() || [];

    if (next && (videoTracks.length === 0 || videoTracks.every((t) => t.readyState === 'ended'))) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = newStream.getVideoTracks()[0];
        if (newTrack) {
          if (!stream) {
            stream = new MediaStream([newTrack]);
            setLocalStream(stream);
            rtcManagerRef.current?.setLocalStream(stream);
          } else {
            stream.addTrack(newTrack);
          }
          rtcManagerRef.current?.replaceVideoTrack(newTrack);
        }
      } catch (err) {
        console.warn('Camera permission or acquisition failed:', err);
      }
    } else {
      videoTracks.forEach((t) => (t.enabled = next));
    }

    setVideoEnabled(next);
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.TRACK_STATE_CHANGE, { videoEnabled: next });
      if (socketRef.current.id) {
        updateParticipantTrackState(socketRef.current.id, { videoEnabled: next });
      }
    }
  };

  const handleToggleScreenShare = async () => {
    if (screenShareEnabled) {
      // Stop screen share
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
      }
      rtcManagerRef.current?.setScreenStream(null);
      setScreenShareEnabled(false);
      socketRef.current?.emit(SOCKET_EVENTS.TRACK_STATE_CHANGE, { screenShareEnabled: false });
      if (socketRef.current?.id) {
        updateParticipantTrackState(socketRef.current.id, { screenShareEnabled: false });
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        setScreenStream(stream);
        rtcManagerRef.current?.setScreenStream(stream);
        setScreenShareEnabled(true);
        socketRef.current?.emit(SOCKET_EVENTS.TRACK_STATE_CHANGE, { screenShareEnabled: true });
        if (socketRef.current?.id) {
          updateParticipantTrackState(socketRef.current.id, { screenShareEnabled: true });
        }

        // Listen for user stopping share from browser UI
        stream.getVideoTracks()[0].onended = () => {
          handleToggleScreenShare();
        };
      } catch {
        // User cancelled picker
      }
    }
  };

  const handleToggleHandRaise = () => {
    const next = !handRaised;
    setHandRaised(next);
    if (socketRef.current?.id) {
      updateParticipantTrackState(socketRef.current.id, { handRaised: next });
    }
    socketRef.current?.emit(SOCKET_EVENTS.HAND_RAISE_TOGGLE);
  };

  const handleSendReaction = (emoji: string) => {
    socketRef.current?.emit(SOCKET_EVENTS.EMOJI_REACTION_SEND, { emoji });
    if (emoji === '🎉') {
      confetti({ particleCount: 75, spread: 80, origin: { y: 0.85 } });
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      await recorderRef.current.stopRecording(roomState?.title || 'Sangam-Meeting');
      setIsRecording(false);
    } else {
      const recordStream = screenStream || localStream;
      if (recordStream) {
        const ok = recorderRef.current.startRecording(recordStream);
        if (ok) setIsRecording(true);
      }
    }
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const cleanupMeeting = () => {
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    rtcManagerRef.current?.destroy();
    speechManagerRef.current?.stop();
    socketRef.current?.disconnect();
    resetRoom();
  };

  // If in Waiting Lobby
  if (inLobby) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
        <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-6 animate-pulse">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">You're in the Waiting Room</h2>
        <p className="text-slate-400 text-sm max-w-sm mb-8">{lobbyMessage}</p>
        <button
          onClick={() => {
            cleanupMeeting();
            navigate('/dashboard');
          }}
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Leave Waiting Room</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative select-none">
      {/* Top Meeting Header */}
      <header className="h-14 px-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between shrink-0 z-20">
        {/* Room Title & Code */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow">
            <img src="/sangam-logo.svg" alt="Sangam Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-100 truncate block max-w-[200px] sm:max-w-xs">
              {roomState?.title || 'Sangam Meeting'}
            </span>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
              <span className="font-mono text-brand-400">{roomCode}</span>
              <button
                onClick={copyRoomLink}
                title="Copy Meeting Invite Link"
                className="hover:text-white"
              >
                {copiedLink ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security Fingerprint & Window Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSecurityModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[11px]">
              {roomState?.securityFingerprint.slice(0, 9)}...
            </span>
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Center Body: Video Grid or Whiteboard + Side Panels */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Main Stage (Video Grid or Whiteboard) */}
        <div className="flex-1 h-full relative overflow-hidden flex flex-col">
          {activeTab === 'whiteboard' ? (
            <WhiteboardPanel
              onSyncElements={(elements, page) => {
                socketRef.current?.emit(SOCKET_EVENTS.WHITEBOARD_UPDATE, { elements, page });
              }}
              onClearBoard={(page) => {
                socketRef.current?.emit(SOCKET_EVENTS.WHITEBOARD_CLEAR, { page });
              }}
              onClose={() => setActiveTab('none')}
            />
          ) : (
            <VideoGrid />
          )}

          {/* Floating Live Reactions Overlays */}
          <ReactionsOverlay reactions={reactions} />

          {/* Floating Live Captions Overlay */}
          <CaptionsOverlay />
        </div>

        {/* Side Panels */}
        {activeTab === 'chat' && (
          <ChatPanel
            onSendMessage={(text, recipientId) => {
              socketRef.current?.emit(SOCKET_EVENTS.CHAT_MESSAGE_SEND, { text, recipientId });
            }}
            onClose={() => setActiveTab('none')}
          />
        )}

        {activeTab === 'participants' && (
          <ParticipantsPanel
            onMuteParticipant={(targetSocketId) => {
              socketRef.current?.emit(SOCKET_EVENTS.HOST_MUTE_PARTICIPANT, { targetSocketId });
            }}
            onMuteAll={() => {
              socketRef.current?.emit(SOCKET_EVENTS.HOST_MUTE_ALL);
            }}
            onKickParticipant={(targetSocketId) => {
              socketRef.current?.emit(SOCKET_EVENTS.HOST_KICK_PARTICIPANT, { targetSocketId });
            }}
            onPromoteCohost={(targetSocketId) => {
              socketRef.current?.emit(SOCKET_EVENTS.HOST_PROMOTE_COHOST, { targetSocketId });
            }}
            onToggleLock={(locked) => {
              socketRef.current?.emit(SOCKET_EVENTS.ROOM_LOCK_TOGGLE, { locked });
            }}
            onClose={() => setActiveTab('none')}
          />
        )}

        {activeTab === 'files' && (
          <FilesPanel
            onAnnounceFile={(metadata) => {
              socketRef.current?.emit(SOCKET_EVENTS.FILE_SHARED_ANNOUNCE, metadata);
            }}
            onClose={() => setActiveTab('none')}
          />
        )}

        {activeTab === 'polls' && (
          <PollsPanel
            onCreatePoll={(question, options, isAnonymous) => {
              socketRef.current?.emit(SOCKET_EVENTS.POLL_CREATE, {
                question,
                options,
                isAnonymous,
              });
            }}
            onVote={(pollId, optionId) => {
              socketRef.current?.emit(SOCKET_EVENTS.POLL_VOTE, { pollId, optionId });
            }}
            onEndPoll={(pollId) => {
              socketRef.current?.emit(SOCKET_EVENTS.POLL_END, { pollId });
            }}
            onClose={() => setActiveTab('none')}
          />
        )}
      </main>

      {/* Bottom Meeting Control Bar */}
      <ControlBar
        onToggleAudio={() => handleToggleAudio()}
        onToggleVideo={handleToggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onToggleHandRaise={handleToggleHandRaise}
        onSendReaction={handleSendReaction}
        onToggleRecording={handleToggleRecording}
        onLeaveMeeting={() => {
          cleanupMeeting();
          navigate('/dashboard');
        }}
        onEndMeetingForAll={
          myParticipant?.isHost
            ? () => {
                if (confirm('End this meeting for everyone?')) {
                  socketRef.current?.emit(SOCKET_EVENTS.ROOM_END_ALL);
                }
              }
            : undefined
        }
      />

      {/* Host Waiting Room Admissions Popup */}
      <WaitingRoomModal
        onAdmit={(socketId) => {
          socketRef.current?.emit(SOCKET_EVENTS.LOBBY_ADMIT_USER, { socketId });
        }}
        onDeny={(socketId) => {
          socketRef.current?.emit(SOCKET_EVENTS.LOBBY_DENY_USER, { socketId });
        }}
      />

      {/* Security Verification Fingerprint Modal */}
      <SecurityModal />
    </div>
  );
};
