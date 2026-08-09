import React from 'react';

/**
 * Surface background wrapper component with subtle borders, shadows, and header/footer options.
 */
export const Card = ({
  children,
  title,
  subtitle,
  action,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footer,
  variant = 'default',
  hoverable = false,
  ...props
}) => {
  const variants = {
    default: 'bg-surface text-slate-800 border border-slate-200 shadow-sm dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800',
    glass: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-md text-slate-800 dark:text-slate-100',
    bordered: 'bg-surface border-2 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100',
    flat: 'bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-100',
  };

  const hoverEffect = hoverable ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5' : '';

  return (
    <div
      className={`rounded-2xl overflow-hidden ${variants[variant] || variants.default} ${hoverEffect} ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className={`px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4 ${headerClassName}`}>
          <div>
            {title && <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`p-6 ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/80">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
