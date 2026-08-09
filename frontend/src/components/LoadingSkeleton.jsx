import React from 'react';

/**
 * LoadingSkeleton component for animated shimmer placeholders.
 */
export const LoadingSkeleton = ({
  variant = 'text',
  lines = 3,
  height,
  width,
  className = '',
}) => {
  const baseAnimation = 'animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg';

  if (variant === 'circle') {
    return (
      <div
        className={`${baseAnimation} rounded-full shrink-0 ${className}`}
        style={{ width: width || '40px', height: height || '40px' }}
      />
    );
  }

  if (variant === 'rect') {
    return (
      <div
        className={`${baseAnimation} ${className}`}
        style={{ width: width || '100%', height: height || '100px' }}
      />
    );
  }

  if (variant === 'card') {
    return (
      <div className={`p-6 bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className={`${baseAnimation} w-10 h-10 rounded-full`} />
          <div className="space-y-2 flex-1">
            <div className={`${baseAnimation} h-4 w-1/3`} />
            <div className={`${baseAnimation} h-3 w-1/4`} />
          </div>
        </div>
        <div className={`${baseAnimation} h-12 w-full`} />
        <div className="space-y-2">
          <div className={`${baseAnimation} h-3 w-full`} />
          <div className={`${baseAnimation} h-3 w-5/6`} />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-4 p-4 bg-surface dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className={`${baseAnimation} w-8 h-8 rounded-full`} />
            <div className={`${baseAnimation} h-4 flex-1`} />
            <div className={`${baseAnimation} h-4 w-24`} />
            <div className={`${baseAnimation} h-4 w-16`} />
          </div>
        ))}
      </div>
    );
  }

  // Default 'text' variant
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className={`${baseAnimation} h-4`}
          style={{
            width: idx === lines - 1 && lines > 1 ? '70%' : width || '100%',
            height: height || '16px',
          }}
        />
      ))}
    </div>
  );
};

export default LoadingSkeleton;
