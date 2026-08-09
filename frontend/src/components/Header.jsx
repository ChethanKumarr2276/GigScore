import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Bell, Menu, User, Sun, Moon, Users, Building2 } from 'lucide-react';

/**
 * Header component with Dark Mode Toggle and Portal Switcher (Worker vs Lender).
 */
export const Header = ({
  user,
  notificationsCount = 0,
  onMenuToggle,
  onNotificationClick,
  title = 'GigScore',
  portalType,
  actions,
  className = '',
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isLenderActive = location.pathname.startsWith('/lender');
  const isWorkerActive = location.pathname.startsWith('/worker');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
        localStorage.getItem('theme') === 'dark' ||
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <header
      className={`sticky top-0 z-30 w-full bg-surface/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6 transition-colors ${className}`}
    >
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                {title}
                {portalType && (
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {portalType}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Center Portal Switcher Segmented Pill */}
        <div className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-inner">
          <button
            onClick={() => navigate('/worker/dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isWorkerActive
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Worker Portal</span>
          </button>
          <button
            onClick={() => navigate('/lender/queue')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isLenderActive
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Lender Portal</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {actions}

          {/* Top-Right Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-amber-500 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 active:scale-90"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 stroke-[2.2]" />
            ) : (
              <Moon className="w-5 h-5 stroke-[2.2]" />
            )}
          </button>

          {/* Notifications Button */}
          <button
            onClick={onNotificationClick}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {notificationsCount > 9 ? '9+' : notificationsCount}
              </span>
            )}
          </button>

          {user && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User avatar'}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
              )}
              {user.name && (
                <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {user.name}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
