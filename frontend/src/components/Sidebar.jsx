import React from 'react';
import { ShieldCheck, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';

/**
 * Sidebar component for Lender & Admin Desktop Navigation.
 */
export const Sidebar = ({
  activePath = '/',
  navItems = [],
  user,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onLogout,
  className = '',
}) => {
  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300 z-40 ${
        collapsed ? 'w-20' : 'w-64'
      } ${className}`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2.5 bg-primary/20 text-primary rounded-xl shrink-0 border border-primary/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-bold text-base tracking-tight text-white">GigScore</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Lender Portal</p>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;

          return (
            <button
              key={item.path || item.label}
              onClick={() => onNavigate && onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {Icon && <Icon className="w-5 h-5 shrink-0" />}
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span
                  className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile Section */}
      <div className="p-3 border-t border-slate-800">
        {user && !collapsed && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : 'L'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.name || 'Lender Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email || 'lender@gigscore.io'}</p>
              </div>
            </div>
          </div>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-danger hover:bg-danger/10 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Log Out</span>}
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
