import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  ShieldCheck,
  Share2,
  Lock,
  ArrowRight,
  Sparkles,
  Zap,
  Edit3,
  FolderLock,
  Users,
  CheckCircle,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

export const LandingPage: React.FC = () => {
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuthStore();
  const { t } = useThemeStore();
  const navigate = useNavigate();

  const handleStartInstant = async () => {
    setIsCreating(true);
    try {
      const token = localStorage.getItem('sangam_token');
      // If not logged in, login as guest first
      if (!token) {
        const guestRes = await fetch('/api/auth/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Meeting Host' }),
        });
        const guestData = await guestRes.json();
        localStorage.setItem('sangam_token', guestData.accessToken);
      }

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sangam_token')}`,
        },
        body: JSON.stringify({
          title: `${user?.name || 'Instant'} Meeting`,
        }),
      });

      const room = await res.json();
      navigate(`/room/${room.roomCode}/prejoin`);
    } catch (err: any) {
      alert(`Could not start meeting: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const cleanCode = joinCode.trim().toLowerCase().replace(/^https?:\/\/.*\/room\//, '');
    navigate(`/room/${cleanCode}/prejoin`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col items-center justify-center text-center">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-brand-600/20 via-cyan-500/15 to-transparent blur-[120px] pointer-events-none rounded-full" />

        {/* Security badge pill */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-300 mb-8 shadow-inner">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted WebRTC DTLS-SRTP & Client-Side AES-256</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-slate-100">
          Meet. Collaborate.{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-brand-400 to-cyan-400 bg-clip-text text-transparent">
            Stay secure.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed">
          Sangam unites video calling, screen sharing, collaborative whiteboarding, and client-side
          encrypted file transfers in a fast, privacy-first platform.
        </p>

        {/* Action Controls */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
          <button
            onClick={handleStartInstant}
            disabled={isCreating}
            className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2 group"
          >
            <Video className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{isCreating ? 'Creating Room...' : t('start_instant')}</span>
          </button>

          <form onSubmit={handleJoinByCode} className="w-full sm:w-auto flex-1 flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter room code"
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-slate-100 outline-none focus:border-brand-500 shadow-inner placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Demo Room Direct CTA */}
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Want a quick test?</span>
          <button
            onClick={() => navigate('/room/san-gam-demo/prejoin')}
            className="text-brand-400 hover:text-cyan-300 font-bold underline decoration-brand-400/50 underline-offset-4"
          >
            Join Demo Room (san-gam-demo)
          </button>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900 w-full">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Engineered for Modern Teams & Security
          </h2>
          <p className="mt-3 text-slate-400 text-sm max-w-xl mx-auto">
            Everything you need for seamless audio-visual meetings, real-time collaboration, and safe data exchange.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1: Multi-user video */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">High-Def WebRTC Mesh Video</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Crisp peer-to-peer video with active speaker highlights, speaker vs grid layouts, audio volume meter, and ICE auto-reconnect.
            </p>
          </div>

          {/* Feature 2: Screen Sharing */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Presenter Spotlight Sharing</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Share your screen, window, or specific tab with audio. Spotlight stage layout automatically highlights the active presenter.
            </p>
          </div>

          {/* Feature 3: Client-side Encrypted Files */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FolderLock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">AES-256-GCM File Sharing</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Files are encrypted client-side using Web Crypto before hitting the network. Auto-purged upon meeting termination.
            </p>
          </div>

          {/* Feature 4: Collaborative Whiteboard */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Edit3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Shared Canvas & Sticky Notes</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Draw with pens, highlighters, shapes, and sticky notes. Synchronized in real time with undo/redo and PNG export.
            </p>
          </div>

          {/* Feature 5: Security & Green Room */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Lobby, Passcodes & Fingerprint</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Waiting room admission, room locks, meeting passwords, and short verification security codes to compare with peers.
            </p>
          </div>

          {/* Feature 6: Advanced Meeting Experience */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-brand-500/50 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Captions, Recording & Polls</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Live Speech-to-Text transcription with transcript downloads, client-side meeting recording, and interactive polls.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <img src="/sangam-logo.svg" alt="Sangam Logo" className="w-5 h-5" />
            <span className="font-bold text-slate-300">Sangam</span>
            <span>— Meet. Collaborate. Stay secure.</span>
          </div>
          <div>Built with React, TypeScript, Node.js, WebRTC, and AES-256-GCM.</div>
        </div>
      </footer>
    </div>
  );
};
