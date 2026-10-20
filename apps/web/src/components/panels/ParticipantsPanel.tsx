import React from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Crown,
  ShieldCheck,
  UserMinus,
  Lock,
  Unlock,
  VolumeX,
  X,
} from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';

interface ParticipantsPanelProps {
  onMuteParticipant: (socketId: string) => void;
  onMuteAll: () => void;
  onKickParticipant: (socketId: string) => void;
  onPromoteCohost: (socketId: string) => void;
  onToggleLock: (locked: boolean) => void;
  onClose: () => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  onMuteParticipant,
  onMuteAll,
  onKickParticipant,
  onPromoteCohost,
  onToggleLock,
  onClose,
}) => {
  const { participants, myParticipant, roomState } = useRoomStore();

  const isHost = myParticipant?.isHost;
  const isCohost = myParticipant?.isCohost;
  const canModerate = isHost || isCohost;

  const participantList = [];
  if (myParticipant) {
    participantList.push(myParticipant);
  }
  Object.values(participants).forEach((p) => {
    if (p.id !== myParticipant?.id && !p.inWaitingRoom) {
      participantList.push(p);
    }
  });

  return (
    <div className="w-80 sm:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-30 shrink-0">
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-bold text-slate-100 text-sm">Participants</h3>
          <span className="text-xs text-slate-400">{participantList.length} in meeting</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Host Controls Bar */}
      {canModerate && (
        <div className="p-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <button
            onClick={onMuteAll}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <VolumeX className="w-3.5 h-3.5 text-red-400" />
            <span>Mute All</span>
          </button>

          {isHost && (
            <button
              onClick={() => onToggleLock(!roomState?.settings.isLocked)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                roomState?.settings.isLocked
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {roomState?.settings.isLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Room Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Lock Room</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {participantList.map((p) => {
          const isMe = p.id === myParticipant?.id;
          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700 transition-colors"
            >
              {/* User Avatar + Name */}
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    p.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="truncate">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {p.name} {isMe && '(You)'}
                    </span>
                    {p.isHost && (
                      <span title="Meeting Host">
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                      </span>
                    )}
                    {p.isCohost && (
                      <span title="Co-Host">
                        <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                      </span>
                    )}
                  </div>
                  {p.handRaised && (
                    <span className="text-[10px] text-amber-400 font-bold block">✋ Hand raised</span>
                  )}
                </div>
              </div>

              {/* Status Icons & Host Actions */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Media indicators */}
                <div className="p-1 rounded text-slate-400">
                  {p.audioEnabled ? <Mic className="w-3.5 h-3.5 text-slate-300" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
                </div>
                <div className="p-1 rounded text-slate-400">
                  {p.videoEnabled ? <Video className="w-3.5 h-3.5 text-slate-300" /> : <VideoOff className="w-3.5 h-3.5 text-red-400" />}
                </div>

                {/* Moderate Actions */}
                {canModerate && !isMe && (
                  <div className="flex items-center space-x-1 pl-1 border-l border-slate-800">
                    <button
                      onClick={() => onMuteParticipant(p.id)}
                      title="Mute participant"
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <VolumeX className="w-3.5 h-3.5" />
                    </button>
                    {isHost && !p.isCohost && (
                      <button
                        onClick={() => onPromoteCohost(p.id)}
                        title="Promote to Co-Host"
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onKickParticipant(p.id)}
                      title="Remove from meeting"
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
