import React from 'react';
import { UserCheck, UserX, Clock } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';

interface WaitingRoomModalProps {
  onAdmit: (socketId: string) => void;
  onDeny: (socketId: string) => void;
}

export const WaitingRoomModal: React.FC<WaitingRoomModalProps> = ({ onAdmit, onDeny }) => {
  const { waitingParticipants, myParticipant } = useRoomStore();

  const waitingList = Object.values(waitingParticipants);
  if (waitingList.length === 0 || (!myParticipant?.isHost && !myParticipant?.isCohost)) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 z-40 w-80 bg-slate-900/95 backdrop-blur-xl border border-brand-500/40 rounded-2xl p-4 shadow-2xl text-slate-100">
      <div className="flex items-center space-x-2 text-sm font-bold text-brand-400 mb-3">
        <Clock className="w-4 h-4 animate-spin" />
        <span>Waiting Room ({waitingList.length})</span>
      </div>

      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {waitingList.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800"
          >
            <div className="truncate pr-2">
              <span className="text-xs font-semibold block truncate">{p.name}</span>
              <span className="text-[10px] text-slate-400">Waiting to join</span>
            </div>
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={() => onAdmit(p.id)}
                title="Admit to meeting"
                className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDeny(p.id)}
                title="Deny"
                className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                <UserX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
