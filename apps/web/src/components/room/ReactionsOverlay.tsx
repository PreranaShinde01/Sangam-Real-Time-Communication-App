import React from 'react';
import { EmojiReaction } from '@sangam/shared';

interface ReactionsOverlayProps {
  reactions: EmojiReaction[];
}

export const ReactionsOverlay: React.FC<ReactionsOverlayProps> = ({ reactions }) => {
  if (reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {reactions.map((r, idx) => {
        // Random horizontal position for natural burst
        const leftPercent = 20 + ((idx * 17) % 60);

        return (
          <div
            key={r.id}
            style={{ left: `${leftPercent}%`, bottom: '100px' }}
            className="absolute animate-float-up flex flex-col items-center select-none"
          >
            <span className="text-4xl filter drop-shadow-lg">{r.emoji}</span>
            <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-full mt-1 border border-slate-700/60 shadow">
              {r.senderName}
            </span>
          </div>
        );
      })}
    </div>
  );
};
