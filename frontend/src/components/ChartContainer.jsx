import React from 'react';
import { BarChart3 } from 'lucide-react';

/**
 * ChartContainer component wrapper for financial & risk trend charts.
 */
export const ChartContainer = ({
  title,
  subtitle,
  action,
  children,
  height = 'h-64',
  className = '',
  isEmpty = false,
  emptyMessage = 'No chart data available',
}) => {
  return (
    <div
      className={`bg-surface text-slate-800 border border-slate-200 shadow-sm dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800 rounded-2xl p-6 ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      {isEmpty ? (
        <div className={`w-full ${height} flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800`}>
          <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      ) : (
        <div className={`w-full ${height} relative flex items-center justify-center`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default ChartContainer;
