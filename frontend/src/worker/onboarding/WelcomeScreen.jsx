import React from 'react';
import { ShieldCheck, CheckCircle2, Copy, ArrowRight, Award } from 'lucide-react';
import { Button, Card, StatusPill } from '../../components';

/**
 * WelcomeScreen component for Worker Onboarding success.
 */
export const WelcomeScreen = ({
  gigTrustId = 'GT-MHF-2305-YNKMX-G',
  workerName = 'Rahul Sharma',
  onGoToDashboard,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(gigTrustId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-[85vh] p-6 text-center max-w-md mx-auto">
      <div className="w-full space-y-6 pt-4">
        {/* Animated Check Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10 animate-bounce">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
        </div>

        <div>
          <StatusPill status="Verified" customLabel="Authentication Complete" size="md" className="mb-2" />
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome to GigScore!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Your decentralized financial identity has been established.
          </p>
        </div>

        {/* GigTrust ID Card */}
        <Card className="text-left bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">GigTrust ID</span>
            </div>
            <Award className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
            <code className="text-sm font-mono font-bold text-indigo-300 tracking-wider">
              {gigTrustId}
            </code>
            <button
              onClick={handleCopyId}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Copy GigTrust ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {copied && (
            <p className="text-[10px] text-emerald-400 mt-1.5 font-medium">Copied to clipboard!</p>
          )}

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Identity Status</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active & Encrypted
            </span>
          </div>
        </Card>

        {/* Next Steps Guide */}
        <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
          <h4 className="font-bold text-slate-800 dark:text-slate-200">What's Next?</h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            Connect your gig work platforms (Uber, Zomato, Swiggy, Porter) on your dashboard to calculate your first credit reliability score.
          </p>
        </div>
      </div>

      <div className="w-full pt-6 pb-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full shadow-lg shadow-primary/20"
          onClick={onGoToDashboard}
          icon={ArrowRight}
          iconPosition="right"
        >
          Go to Worker Dashboard
        </Button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
