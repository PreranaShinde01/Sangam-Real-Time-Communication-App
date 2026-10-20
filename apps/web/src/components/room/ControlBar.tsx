import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  Hand,
  Smile,
  MessageSquare,
  Users,
  FolderLock,
  Edit3,
  BarChart2,
  CircleDot,
  Subtitles,
  LayoutGrid,
  ShieldAlert,
  PhoneOff,
  Sparkles,
} from 'lucide-react';
import { useRoomStore, ActiveSideTab } from '../../store/useRoomStore';
import { useTranslation } from '../../store/useThemeStore';

interface ControlBarProps {
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleHandRaise: () => void;
  onSendReaction: (emoji: string) => void;
  onToggleRecording: () => void;
  onLeaveMeeting: () => void;
  onEndMeetingForAll?: () => void;
}

const EMOJI_LIST = ['👍', '👏', '🎉', '❤️', '😂', '😮', '🔥', '🚀'];

export const ControlBar: React.FC<ControlBarProps> = ({
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleHandRaise,
  onSendReaction,
  onToggleRecording,
  onLeaveMeeting,
  onEndMeetingForAll,
}) => {
  const {
    myParticipant,
    participants,
    audioEnabled,
    videoEnabled,
    screenShareEnabled,
    handRaised,
    virtualBackground,
    setVirtualBackground,
    activeTab,
    setActiveTab,
    unreadChatCount,
    isRecording,
    captionsEnabled,
    setCaptionsEnabled,
    viewMode,
    setViewMode,
    setSecurityModalOpen,
  } = useRoomStore();

  const { t } = useTranslation();
  const [showReactions, setShowReactions] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Recording timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Global Keyboard shortcuts: M (mute), V (video), S (share), H (hand), C (chat)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        onToggleAudio();
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        onToggleVideo();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onToggleScreenShare();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        onToggleHandRaise();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setActiveTab(activeTab === 'chat' ? 'none' : 'chat');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleAudio, onToggleVideo, onToggleScreenShare, onToggleHandRaise, activeTab, setActiveTab]);

  const toggleTab = (tab: ActiveSideTab) => {
    setActiveTab(activeTab === tab ? 'none' : tab);
  };

  const participantCount =
    Object.keys(participants).length + (myParticipant ? 1 : 0);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="h-20 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Left section: Recording status & View switcher */}
      <div className="flex items-center space-x-2 w-1/4">
        {isRecording && (
          <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-full text-xs font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>REC {formatTimer(recordingSeconds)}</span>
          </div>
        )}

        <button
          onClick={() => setViewMode(viewMode === 'grid' ? 'speaker' : 'grid')}
          title="Toggle Grid / Speaker View"
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        <button
          onClick={() => setSecurityModalOpen(true)}
          title="E2EE Security & Fingerprint"
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Encrypted</span>
        </button>
      </div>

      {/* Middle section: Primary AV & Interaction Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Mic Toggle */}
        <button
          onClick={onToggleAudio}
          title={audioEnabled ? 'Mute Mic (M)' : 'Unmute Mic (M)'}
          className={`p-3.5 rounded-2xl font-semibold transition-all shadow-md ${
            audioEnabled
              ? 'bg-slate-800 text-white hover:bg-slate-700'
              : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
          }`}
        >
          {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Video Toggle */}
        <div className="relative group flex items-center">
          <button
            onClick={onToggleVideo}
            title={videoEnabled ? 'Turn Off Camera (V)' : 'Turn On Camera (V)'}
            className={`p-3.5 rounded-2xl font-semibold transition-all shadow-md ${
              videoEnabled
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
            }`}
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
          {/* Virtual blur toggle pill */}
          <button
            onClick={() => setVirtualBackground(virtualBackground === 'blur' ? 'none' : 'blur')}
            title="Toggle Background Blur"
            className={`absolute -top-2 -right-2 p-1 rounded-full text-[10px] border shadow transition-colors ${
              virtualBackground === 'blur'
                ? 'bg-brand-500 text-white border-brand-400'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
          </button>
        </div>

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          title={screenShareEnabled ? 'Stop Sharing (S)' : 'Share Screen (S)'}
          className={`p-3.5 rounded-2xl font-semibold transition-all shadow-md ${
            screenShareEnabled
              ? 'bg-brand-600 text-white shadow-brand-500/30'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Hand Raise */}
        <button
          onClick={onToggleHandRaise}
          title={handRaised ? 'Lower Hand (H)' : 'Raise Hand (H)'}
          className={`p-3.5 rounded-2xl font-semibold transition-all ${
            handRaised
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Hand className="w-5 h-5" />
        </button>

        {/* Reactions Button + Popover */}
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            title="Reactions"
            className="p-3.5 rounded-2xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>

          {showReactions && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl flex space-x-1.5 z-50">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSendReaction(emoji);
                    setShowReactions(false);
                  }}
                  className="w-9 h-9 rounded-xl hover:bg-slate-800 hover:scale-125 transition-transform flex items-center justify-center text-xl"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Client Recorder */}
        <button
          onClick={onToggleRecording}
          title={isRecording ? 'Stop Recording' : 'Record Meeting'}
          className={`p-3.5 rounded-2xl font-semibold transition-all ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          <CircleDot className="w-5 h-5" />
        </button>

        {/* Live Captions Toggle */}
        <button
          onClick={() => setCaptionsEnabled(!captionsEnabled)}
          title="Live Captions (Speech to Text)"
          className={`p-3.5 rounded-2xl font-semibold transition-all ${
            captionsEnabled
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Subtitles className="w-5 h-5" />
        </button>

        {/* Leave / End Call */}
        <div className="flex items-center space-x-1 pl-2">
          <button
            onClick={onLeaveMeeting}
            title={t('leave')}
            className="px-4 py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="hidden md:inline-block text-sm">{t('leave')}</span>
          </button>

          {myParticipant?.isHost && onEndMeetingForAll && (
            <button
              onClick={onEndMeetingForAll}
              title="End Meeting for Everyone"
              className="px-3 py-3.5 rounded-2xl bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-semibold transition-colors"
            >
              End All
            </button>
          )}
        </div>
      </div>

      {/* Right section: Side Panel Toggles */}
      <div className="flex items-center space-x-2 w-1/4 justify-end">
        {/* Chat Toggle with unread badge */}
        <button
          onClick={() => toggleTab('chat')}
          title="Meeting Chat (C)"
          className={`relative p-2.5 rounded-xl transition-colors ${
            activeTab === 'chat'
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold">
              {unreadChatCount}
            </span>
          )}
        </button>

        {/* Participants Toggle with count */}
        <button
          onClick={() => toggleTab('participants')}
          title="Participants"
          className={`relative p-2.5 rounded-xl transition-colors ${
            activeTab === 'participants'
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
            {participantCount}
          </span>
        </button>

        {/* Whiteboard Toggle */}
        <button
          onClick={() => toggleTab('whiteboard')}
          title="Collaborative Whiteboard"
          className={`p-2.5 rounded-xl transition-colors ${
            activeTab === 'whiteboard'
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Edit3 className="w-5 h-5" />
        </button>

        {/* Encrypted Files Toggle */}
        <button
          onClick={() => toggleTab('files')}
          title="End-to-End Encrypted File Sharing"
          className={`p-2.5 rounded-xl transition-colors ${
            activeTab === 'files'
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <FolderLock className="w-5 h-5" />
        </button>

        {/* Polls Toggle */}
        <button
          onClick={() => toggleTab('polls')}
          title="Polls & Voting"
          className={`p-2.5 rounded-xl transition-colors ${
            activeTab === 'polls'
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
        </button>
      </div>
    </footer>
  );
};
