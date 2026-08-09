import React from 'react';

/**
 * Animated ProgressBar component for scores and financial ratios.
 */
export const ProgressBar = ({
  value = 0,
  max = 100,
  color,
  height = 'md',
  showValue = false,
  label,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Determine color if not explicitly provided
  const getAutoColor = (val) => {
    if (val >= 75) return 'bg-success';
    if (val >= 50) return 'bg-primary';
    if (val >= 25) return 'bg-warning';
    return 'bg-danger';
  };

  const colors = {
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };

  const heights = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const selectedColor = color ? colors[color] || colors.primary : getAutoColor(percentage);
  const selectedHeight = heights[height] || heights.md;

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
          {label && <span>{label}</span>}
          {showValue && <span className="tabular-nums font-semibold">{Math.round(percentage)}%</span>}
        </div>
      )}

      <div className={`w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden ${selectedHeight}`}>
        <div
          className={`${selectedHeight} ${selectedColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
