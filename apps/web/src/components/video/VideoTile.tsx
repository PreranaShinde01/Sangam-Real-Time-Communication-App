import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Pin, PinOff, PictureInPicture2, Signal, ShieldCheck, Crown } from 'lucide-react';
import { Participant } from '@sangam/shared';

interface VideoTileProps {
  participant: Participant;
  stream?: MediaStream | null;
  isLocal?: boolean;
  isSpeaking?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  className?: string;
}

export const VideoTile: React.FC<VideoTileProps> = ({
  participant,
  stream,
  isLocal = false,
  isSpeaking = false,
  isPinned = false,
  onTogglePin,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideoTrack, setHasVideoTrack] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      const vTrack = stream.getVideoTracks()[0];
      setHasVideoTrack(!!(vTrack && vTrack.enabled && participant.videoEnabled));

      const handleTrackChange = () => {
        setHasVideoTrack(!!(vTrack && vTrack.enabled && participant.videoEnabled));
      };

      if (vTrack) {
        vTrack.addEventListener('mute', handleTrackChange);
        vTrack.addEventListener('unmute', handleTrackChange);
      }

      return () => {
        if (vTrack) {
          vTrack.removeEventListener('mute', handleTrackChange);
          vTrack.removeEventListener('unmute', handleTrackChange);
        }
      };
    } else {
      setHasVideoTrack(false);
    }
  }, [stream, participant.videoEnabled]);

  const handlePiP = async () => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.warn('PiP failed', err);
      }
    }
  };

  return (
    <div
      className={`relative group bg-slate-900 rounded-2xl overflow-hidden border transition-all duration-300 flex items-center justify-center ${
        isSpeaking
          ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-950 border-brand-500 shadow-lg shadow-brand-500/20'
          : 'border-slate-800/80 hover:border-slate-700'
      } ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          hasVideoTrack ? 'opacity-100' : 'opacity-0'
        } ${isLocal ? 'scale-x-[-1]' : ''}`}
      />

      {/* Video Disabled / Avatar Fallback */}
      {!hasVideoTrack && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 p-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-brand-500/20">
            {participant.avatarUrl ? (
              <img
                src={participant.avatarUrl}
                alt={participant.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              participant.name.charAt(0).toUpperCase()
            )}
          </div>
          <span className="mt-3 text-sm font-medium text-slate-300">{participant.name}</span>
        </div>
      )}

      {/* Hand Raised Floating Badge */}
      {participant.handRaised && (
        <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg animate-bounce-short">
          <span>✋</span>
          <span>Hand Raised</span>
        </div>
      )}

      {/* Top Right Quick Controls (Hover) */}
      <div className="absolute top-3 right-3 flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-700/50">
        {onTogglePin && (
          <button
            onClick={onTogglePin}
            title={isPinned ? 'Unpin' : 'Pin to stage'}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5 text-brand-400" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        )}
        {hasVideoTrack && (
          <button
            onClick={handlePiP}
            title="Picture in Picture"
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
          >
            <PictureInPicture2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Name and Role */}
        <div className="flex items-center space-x-1.5 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800/80 text-xs font-medium text-slate-200">
          {participant.isHost && (
            <span title="Meeting Host">
              <Crown className="w-3 h-3 text-amber-400 shrink-0" />
            </span>
          )}
          {participant.isCohost && (
            <span title="Co-Host">
              <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
            </span>
          )}
          <span className="truncate max-w-[120px] sm:max-w-[160px]">
            {participant.name} {isLocal && '(You)'}
          </span>
          {participant.isGuest && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded">Guest</span>
          )}
        </div>

        {/* Audio State Icon */}
        <div
          className={`p-1.5 rounded-lg backdrop-blur-md border ${
            participant.audioEnabled
              ? 'bg-slate-950/70 border-slate-800/80 text-slate-300'
              : 'bg-red-500/20 border-red-500/40 text-red-400'
          }`}
        >
          {participant.audioEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );
};
