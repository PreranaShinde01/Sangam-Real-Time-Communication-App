import { create } from 'zustand';
import {
  ChatMessage,
  LiveCaption,
  Participant,
  Poll,
  RoomState,
  SharedFileMetadata,
} from '@sangam/shared';

export type ActiveSideTab = 'none' | 'chat' | 'participants' | 'files' | 'whiteboard' | 'polls';

interface RoomStoreState {
  roomId: string | null;
  roomCode: string | null;
  roomState: RoomState | null;
  myParticipant: Participant | null;
  participants: Record<string, Participant>;
  waitingParticipants: Record<string, Participant>;
  remoteStreams: Record<string, MediaStream>;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;

  // Media toggles
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  handRaised: boolean;
  virtualBackground: 'none' | 'blur';

  // Interaction
  activeSpeakerId: string | null;
  pinnedPeerId: string | null;
  viewMode: 'grid' | 'speaker';
  activeTab: ActiveSideTab;
  isRecording: boolean;
  captionsEnabled: boolean;
  securityModalOpen: boolean;

  // Collections
  chatMessages: ChatMessage[];
  unreadChatCount: number;
  sharedFiles: SharedFileMetadata[];
  polls: Poll[];
  captions: LiveCaption[];

  // Actions
  setRoomState: (state: RoomState) => void;
  setMyParticipant: (p: Participant) => void;
  setParticipants: (p: Record<string, Participant>) => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (socketId: string) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setScreenStream: (stream: MediaStream | null) => void;
  setRemoteStream: (peerId: string, stream: MediaStream) => void;
  removeRemoteStream: (peerId: string) => void;
  setAudioEnabled: (val: boolean) => void;
  setVideoEnabled: (val: boolean) => void;
  setScreenShareEnabled: (val: boolean) => void;
  setHandRaised: (val: boolean) => void;
  setVirtualBackground: (val: 'none' | 'blur') => void;
  setActiveSpeakerId: (id: string | null) => void;
  setPinnedPeerId: (id: string | null) => void;
  setViewMode: (mode: 'grid' | 'speaker') => void;
  setActiveTab: (tab: ActiveSideTab) => void;
  setIsRecording: (val: boolean) => void;
  setCaptionsEnabled: (val: boolean) => void;
  setSecurityModalOpen: (val: boolean) => void;
  addChatMessage: (msg: ChatMessage) => void;
  addSharedFile: (file: SharedFileMetadata) => void;
  setPolls: (polls: Poll[]) => void;
  addCaption: (caption: LiveCaption) => void;
  resetRoom: () => void;
}

export const useRoomStore = create<RoomStoreState>((set) => ({
  roomId: null,
  roomCode: null,
  roomState: null,
  myParticipant: null,
  participants: {},
  waitingParticipants: {},
  remoteStreams: {},
  localStream: null,
  screenStream: null,

  audioEnabled: true,
  videoEnabled: true,
  screenShareEnabled: false,
  handRaised: false,
  virtualBackground: 'none',

  activeSpeakerId: null,
  pinnedPeerId: null,
  viewMode: 'grid',
  activeTab: 'none',
  isRecording: false,
  captionsEnabled: false,
  securityModalOpen: false,

  chatMessages: [],
  unreadChatCount: 0,
  sharedFiles: [],
  polls: [],
  captions: [],

  setRoomState: (state) =>
    set({
      roomId: state.roomId,
      roomCode: state.roomCode,
      roomState: state,
      participants: state.participants,
      waitingParticipants: state.waitingParticipants,
    }),

  setMyParticipant: (p) => set({ myParticipant: p }),
  setParticipants: (participants) => set({ participants }),

  addParticipant: (p) =>
    set((s) => ({
      participants: { ...s.participants, [p.id]: p },
    })),

  removeParticipant: (socketId) =>
    set((s) => {
      const copy = { ...s.participants };
      delete copy[socketId];
      const streamsCopy = { ...s.remoteStreams };
      delete streamsCopy[socketId];
      return {
        participants: copy,
        remoteStreams: streamsCopy,
        pinnedPeerId: s.pinnedPeerId === socketId ? null : s.pinnedPeerId,
      };
    }),

  setLocalStream: (localStream) => set({ localStream }),
  setScreenStream: (screenStream) => set({ screenStream }),

  setRemoteStream: (peerId, stream) =>
    set((s) => ({
      remoteStreams: { ...s.remoteStreams, [peerId]: stream },
    })),

  removeRemoteStream: (peerId) =>
    set((s) => {
      const copy = { ...s.remoteStreams };
      delete copy[peerId];
      return { remoteStreams: copy };
    }),

  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setVideoEnabled: (videoEnabled) => set({ videoEnabled }),
  setScreenShareEnabled: (screenShareEnabled) => set({ screenShareEnabled }),
  setHandRaised: (handRaised) => set({ handRaised }),
  setVirtualBackground: (virtualBackground) => set({ virtualBackground }),
  setActiveSpeakerId: (activeSpeakerId) => set({ activeSpeakerId }),
  setPinnedPeerId: (pinnedPeerId) => set({ pinnedPeerId }),
  setViewMode: (viewMode) => set({ viewMode }),

  setActiveTab: (tab) =>
    set((s) => ({
      activeTab: tab,
      unreadChatCount: tab === 'chat' ? 0 : s.unreadChatCount,
    })),

  setIsRecording: (isRecording) => set({ isRecording }),
  setCaptionsEnabled: (captionsEnabled) => set({ captionsEnabled }),
  setSecurityModalOpen: (securityModalOpen) => set({ securityModalOpen }),

  addChatMessage: (msg) =>
    set((s) => ({
      chatMessages: [...s.chatMessages, msg],
      unreadChatCount: s.activeTab === 'chat' ? 0 : s.unreadChatCount + 1,
    })),

  addSharedFile: (file) =>
    set((s) => ({
      sharedFiles: [file, ...s.sharedFiles],
    })),

  setPolls: (polls) => set({ polls }),

  addCaption: (caption) =>
    set((s) => ({
      captions: [...s.captions.slice(-15), caption],
    })),

  resetRoom: () =>
    set({
      roomId: null,
      roomCode: null,
      roomState: null,
      myParticipant: null,
      participants: {},
      waitingParticipants: {},
      remoteStreams: {},
      localStream: null,
      screenStream: null,
      audioEnabled: true,
      videoEnabled: true,
      screenShareEnabled: false,
      handRaised: false,
      activeSpeakerId: null,
      pinnedPeerId: null,
      activeTab: 'none',
      isRecording: false,
      chatMessages: [],
      unreadChatCount: 0,
      sharedFiles: [],
      polls: [],
      captions: [],
    }),
}));
