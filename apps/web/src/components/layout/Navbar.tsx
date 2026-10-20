import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Sun, Moon, Globe, LogOut, Check } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTranslation, Language } from '../../store/useThemeStore';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { t, lang, setLang, theme, toggleTheme } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSelectLang = (selectedLang: Language) => {
    setLang(selectedLang);
    setShowLangMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-slate-950/85 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <img src="/sangam-logo.svg" alt="Sangam Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-brand-500 to-cyan-500 bg-clip-text text-transparent">
              {t('app_name')}
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700/60 rounded-full px-2 py-0.5">
              {t('secure_meet')}
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Interactive Language Selector */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              title={t('change_lang')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <Globe className="w-4 h-4 text-brand-500" />
              <span className="uppercase">{lang}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-44 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 animate-fade-in text-xs">
                <div className="px-3 py-1 font-semibold text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
                  Select Language
                </div>
                <button
                  onClick={() => handleSelectLang('en')}
                  className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    lang === 'en' ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>English (EN)</span>
                  {lang === 'en' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleSelectLang('hi')}
                  className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    lang === 'hi' ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>हिन्दी (Hindi)</span>
                  {lang === 'hi' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleSelectLang('mr')}
                  className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                    lang === 'mr' ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>मराठी (Marathi)</span>
                  {lang === 'mr' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle (Dark / Light) */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? t('switch_light') : t('switch_dark')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {/* User state */}
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
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
                  className="hidden sm:inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
                >
                  <Shield className="w-3 h-3 mr-1" /> {t('admin')}
                </Link>
              )}
              <button
                onClick={handleLogout}
                title={t('logout')}
                className="p-2 rounded-xl text-slate-500 hover:text-red-500 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {t('sign_in')}
              </Link>
              <Link
                to="/signup"
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white shadow-md shadow-brand-500/20 transition-all hover:shadow-brand-500/40"
              >
                {t('sign_up')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
