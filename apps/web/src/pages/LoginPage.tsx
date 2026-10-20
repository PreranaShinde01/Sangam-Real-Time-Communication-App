import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, User, Key } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useAuthStore } from '../store/useAuthStore';
import { useTranslation } from '../store/useThemeStore';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'guest'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [guestName, setGuestName] = useState('');

  const { login, guestLogin, isLoading, error } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email, password, totpCode: requires2FA ? totpCode : undefined });
      if (res?.requires2FA) {
        setRequires2FA(true);
      } else {
        navigate('/dashboard');
      }
    } catch {}
  };

  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    try {
      await guestLogin(guestName.trim());
      navigate('/dashboard');
    } catch {}
  };

  const fillDemoAccount = (role: 'host' | 'participant' | 'cohost') => {
    if (role === 'host') {
      setEmail('alice@sangam.local');
      setPassword('Sangam@123');
    } else if (role === 'participant') {
      setEmail('bob@sangam.local');
      setPassword('Sangam@123');
    } else {
      setEmail('charlie@sangam.local');
      setPassword('Sangam@123');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl relative">
          {/* Tabs */}
          <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-950 p-1 mb-6 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                setActiveTab('login');
                setRequires2FA(false);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'login'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('sign_in_tab')}
            </button>
            <button
              onClick={() => setActiveTab('guest')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'guest'
                  ? 'bg-brand-600 text-white shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('guest_join_tab')}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
              {error}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {!requires2FA ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                      {t('email_label')}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                      {t('password_label')}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-bold">
                    <Key className="w-4 h-4" />
                    <span>{t('two_factor_auth')}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {t('enter_totp_code')}
                  </p>
                  <input
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="000000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-center py-2.5 text-lg font-mono tracking-widest text-brand-600 dark:text-brand-400 outline-none focus:border-brand-500"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? '...' : requires2FA ? t('confirm_2fa') : t('sign_in_title')}
              </button>

              {/* Demo autofill buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2 text-center">
                  {t('demo_accounts')}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('host')}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-200 font-medium transition-colors"
                  >
                    Alice (Host)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('participant')}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-200 font-medium transition-colors"
                  >
                    Bob (Peer)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('cohost')}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-200 font-medium transition-colors"
                  >
                    Charlie (Co-Host)
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleGuestJoin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                  {t('display_name_label')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Maya Patel"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">
                {t('guest_desc')}
              </p>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
              >
                {isLoading ? '...' : t('continue_as_guest')}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            {t('dont_have_account')}{' '}
            <Link to="/signup" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
              {t('create_one_now')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
