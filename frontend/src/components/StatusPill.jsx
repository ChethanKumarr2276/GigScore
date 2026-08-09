import React from 'react';

/**
 * StatusPill component displays status badges (Active, Pending, Approved, Rejected, etc.)
 */
export const StatusPill = ({
  status = 'Active',
  size = 'md',
  customLabel,
  className = '',
}) => {
  const normalizedStatus = String(status).toLowerCase();

  const statusConfigs = {
    active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    verified: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',

    pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    processing: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    under_review: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',

    rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    expired: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    failed: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',

    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  };

  const dots = {
    active: 'bg-emerald-500',
    approved: 'bg-emerald-500',
    verified: 'bg-emerald-500',

    pending: 'bg-amber-500',
    processing: 'bg-amber-500 animate-pulse',
    under_review: 'bg-amber-500',

    rejected: 'bg-red-500',
    expired: 'bg-red-500',
    failed: 'bg-red-500',

    info: 'bg-blue-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
  };

  const config = statusConfigs[normalizedStatus] || statusConfigs.info;
  const dotColor = dots[normalizedStatus] || dots.info;
  const sizeStyle = sizes[size] || sizes.md;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config} ${sizeStyle} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{customLabel || status}</span>
    </span>
  );
};

export default StatusPill;
