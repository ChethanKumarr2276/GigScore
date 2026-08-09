import React from 'react';

/**
 * BottomNav component for Mobile Worker Navigation Bar.
 */
export const BottomNav = ({
  activePath = '/',
  navItems = [],
  onNavigate,
  className = '',
}) => {
  if (!navItems || navItems.length === 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-surface/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 md:hidden transition-all ${className}`}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;

          return (
            <button
              key={item.path || item.label}
              onClick={() => onNavigate && onNavigate(item.path)}
              className={`flex flex-col items-center justify-center w-full py-1.5 px-2 rounded-xl transition-all duration-150 relative ${
                isActive
                  ? 'text-primary font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {Icon && <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />}
              <span className="text-[10px] tracking-tight truncate max-w-full">{item.label}</span>

              {item.badge && (
                <span className="absolute top-1 right-3 w-2 h-2 bg-danger rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
