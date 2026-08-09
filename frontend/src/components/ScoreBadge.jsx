import React from 'react';
import { Award, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

/**
 * ScoreBadge displays the Gig Reliability Score (GRS) and Risk Band.
 */
export const ScoreBadge = ({
  score,
  maxScore = 1000,
  band,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  // Determine risk band if not explicitly provided
  const getBandFromScore = (s) => {
    if (s >= 750) return 'EXCELLENT';
    if (s >= 680) return 'RELIABLE';
    if (s >= 580) return 'MODERATE_RISK';
    return 'HIGH_RISK';
  };

  const currentBand = band || getBandFromScore(score);

  const bandConfigs = {
    EXCELLENT: {
      label: 'Excellent Credit',
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      badgeBg: 'bg-emerald-500 text-white',
      icon: ShieldCheck,
    },
    RELIABLE: {
      label: 'Reliable',
      bg: 'bg-success/10 text-success border-success/20',
      badgeBg: 'bg-success text-white',
      icon: ShieldCheck,
    },
    MODERATE_RISK: {
      label: 'Moderate Risk',
      bg: 'bg-warning/10 text-amber-600 dark:text-warning border-warning/20',
      badgeBg: 'bg-warning text-white',
      icon: AlertTriangle,
    },
    HIGH_RISK: {
      label: 'High Risk',
      bg: 'bg-danger/10 text-danger border-danger/20',
      badgeBg: 'bg-danger text-white',
      icon: ShieldAlert,
    },
  };

  const config = bandConfigs[currentBand] || bandConfigs.RELIABLE;
  const Icon = config.icon;

  const sizes = {
    sm: {
      wrapper: 'p-2 text-xs gap-2',
      scoreText: 'text-base font-bold',
      iconSize: 'w-4 h-4',
    },
    md: {
      wrapper: 'p-3.5 text-sm gap-3',
      scoreText: 'text-xl font-bold',
      iconSize: 'w-5 h-5',
    },
    lg: {
      wrapper: 'p-5 text-base gap-4',
      scoreText: 'text-3xl font-extrabold',
      iconSize: 'w-7 h-7',
    },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div
      className={`inline-flex items-center rounded-2xl border ${config.bg} ${currentSize.wrapper} ${className}`}
    >
      <div className={`p-2 rounded-xl ${config.badgeBg} shrink-0`}>
        <Icon className={currentSize.iconSize} />
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className={`${currentSize.scoreText} tracking-tight`}>{score}</span>
          {maxScore && (
            <span className="text-xs opacity-75 font-normal">/ {maxScore}</span>
          )}
        </div>
        {showLabel && (
          <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
            {config.label}
          </span>
        )}
      </div>
    </div>
  );
};

export default ScoreBadge;
