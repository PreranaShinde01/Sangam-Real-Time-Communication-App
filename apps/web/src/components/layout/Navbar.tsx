import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Sun, Moon, Globe, LogOut, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore, Language } from '../../store/useThemeStore';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, lang, setLang } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-900/80 dark:bg-slate-950/80 border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <img src="/sangam-logo.svg" alt="Sangam Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-brand-400 to-cyan-400 bg-clip-text text-transparent">
              Sangam
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400 border border-slate-700/60 rounded-full px-2 py-0.5">
              Secure Meet
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Language Selector */}
          <div className="relative group">
            <button
              title="Change Language"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase text-xs">{lang}</span>
            </button>
            <div className="absolute right-0 mt-1 w-32 py-2 bg-slate-900 border border-slate-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
              <button
                onClick={() => setLang('en')}
                className={`w-full text-left px-4 py-1.5 text-xs hover:bg-slate-800 ${
                  lang === 'en' ? 'text-brand-400 font-semibold' : 'text-slate-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('hi')}
                className={`w-full text-left px-4 py-1.5 text-xs hover:bg-slate-800 ${
                  lang === 'hi' ? 'text-brand-400 font-semibold' : 'text-slate-300'
                }`}
              >
                हिन्दी (Hindi)
              </button>
              <button
                onClick={() => setLang('mr')}
                className={`w-full text-left px-4 py-1.5 text-xs hover:bg-slate-800 ${
                  lang === 'mr' ? 'text-brand-400 font-semibold' : 'text-slate-300'
                }`}
              >
                मराठी (Marathi)
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User state */}
          {user ? (
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-sm font-medium text-slate-200 hover:text-brand-400 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="hidden md:inline-block max-w-[120px] truncate">{user.name}</span>
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
                >
                  <Shield className="w-3 h-3 mr-1" /> Admin
                </Link>
              )}
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                to="/login"
                className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="px-3.5 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white shadow-md shadow-brand-500/20 transition-all hover:shadow-brand-500/40"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
