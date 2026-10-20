import React from 'react';
import { ShieldCheck, Lock, Key, X, Check, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useRoomStore } from '../../store/useRoomStore';

export const SecurityModal: React.FC = () => {
  const { roomState, securityModalOpen, setSecurityModalOpen } = useRoomStore();
  const [copied, setCopied] = React.useState(false);

  if (!securityModalOpen || !roomState) return null;

  const fingerprint = roomState.securityFingerprint;
  const qrData = `sangam://verify?room=${roomState.roomCode}&fp=${fingerprint}`;

  const copyFingerprint = () => {
    navigator.clipboard.writeText(fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={() => setSecurityModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">End-to-End Encryption</h3>
            <p className="text-xs text-slate-400">Verified WebRTC DTLS-SRTP & AES-256-GCM</p>
          </div>
        </div>

        {/* Security Fingerprint Display */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Meeting Security Code
          </span>
          <div className="text-xl font-mono font-bold tracking-widest text-emerald-400 mb-3 select-all">
            {fingerprint}
          </div>
          <button
            onClick={copyFingerprint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Security Code'}</span>
          </button>
        </div>

        {/* QR Code Verification */}
        <div className="mt-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="p-3 bg-white rounded-xl shadow-md">
            <QRCodeSVG value={qrData} size={130} />
          </div>
          <span className="mt-2 text-xs text-slate-400">
            Scan with your mobile device or peer to compare
          </span>
        </div>

        {/* Guarantees */}
        <div className="mt-4 space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Audio, video, and screen shares are encrypted point-to-point.</span>
          </div>
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Shared files are encrypted client-side before upload with AES-256-GCM.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
