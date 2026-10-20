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
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../store/useThemeStore';

export const LandingPage: React.FC = () => {
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuthStore();
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white transition-colors duration-200">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 pb-24 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col items-center justify-center text-center">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[600px] h-[300px] sm:h-[350px] bg-gradient-to-tr from-brand-600/15 via-cyan-500/10 to-transparent blur-[100px] pointer-events-none rounded-full" />

        {/* Security badge pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-8 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{t('hero_badge')}</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl text-slate-900 dark:text-slate-100 leading-tight">
          {t('hero_title_prefix')}{' '}
          <span className="bg-gradient-to-r from-indigo-500 via-brand-500 to-cyan-500 bg-clip-text text-transparent">
            {t('hero_title_suffix')}
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          {t('hero_desc')}
        </p>

        {/* Action Controls */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
          <button
            onClick={handleStartInstant}
            disabled={isCreating}
            className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transition-all flex items-center justify-center gap-2 group"
          >
            <Video className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>{isCreating ? t('creating_room') : t('start_instant')}</span>
          </button>

          <form onSubmit={handleJoinByCode} className="w-full sm:w-auto flex-1 flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder={t('enter_code')}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 shadow-sm placeholder-slate-400 dark:placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="px-4 py-3.5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-800 dark:text-white transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Demo Room Direct CTA */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{t('quick_test')}</span>
          <button
            onClick={() => navigate('/room/san-gam-demo/prejoin')}
            className="text-brand-600 dark:text-brand-400 hover:text-cyan-600 dark:hover:text-cyan-300 font-bold underline decoration-brand-400/50 underline-offset-4"
          >
            {t('join_demo_room')}
          </button>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-900 w-full">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {t('features_heading')}
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
            {t('features_subheading')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1: Multi-user video */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/50 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('feat_video_title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {t('feat_video_desc')}
            </p>
          </div>

          {/* Feature 2: Screen Sharing */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/50 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('feat_screen_title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {t('feat_screen_desc')}
            </p>
          </div>

          {/* Feature 3: Client-side Encrypted Files */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/50 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FolderLock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('feat_files_title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {t('feat_files_desc')}
            </p>
          </div>

          {/* Feature 4: Collaborative Whiteboard */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/50 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Edit3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('feat_board_title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {t('feat_board_desc')}
            </p>
          </div>

          {/* Feature 5: Security & Green Room */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/50 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('feat_security_title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {t('feat_security_desc')}
            </p>
          </div>

          {/* Feature 6: Advanced Meeting Experience */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/50 shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t('feat_advanced_title')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {t('feat_advanced_desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-900 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <img src="/sangam-logo.svg" alt="Sangam Logo" className="w-5 h-5" />
            <span className="font-bold text-slate-800 dark:text-slate-200">{t('app_name')}</span>
            <span>— {t('tagline')}</span>
          </div>
          <div>{t('footer_built_with')}</div>
        </div>
      </footer>
    </div>
  );
};
