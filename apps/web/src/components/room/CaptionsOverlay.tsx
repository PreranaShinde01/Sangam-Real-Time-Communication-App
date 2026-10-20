import React from 'react';
import { Download, Subtitles } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';
import { SpeechManager } from '../../lib/speech';

export const CaptionsOverlay: React.FC = () => {
  const { captions, captionsEnabled, roomCode } = useRoomStore();

  if (!captionsEnabled || captions.length === 0) return null;

  const latestCaptions = captions.slice(-3);

  const handleDownloadTranscript = () => {
    const text = SpeechManager.exportTranscript(captions);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sangam-transcript-${roomCode || 'meeting'}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[90%] pointer-events-auto">
      <div className="bg-slate-950/85 backdrop-blur-xl border border-slate-800 rounded-2xl p-3 shadow-2xl text-slate-100 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800/60">
          <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
            <Subtitles className="w-3.5 h-3.5" />
            <span>Live Captions</span>
          </span>
          <button
            onClick={handleDownloadTranscript}
            title="Download Meeting Transcript"
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Transcript</span>
          </button>
        </div>

        <div className="space-y-1">
          {latestCaptions.map((cap) => (
            <div key={cap.id} className="text-xs leading-relaxed">
              <span className="font-bold text-brand-400 mr-2">{cap.speakerName}:</span>
              <span className="text-slate-200">{cap.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
