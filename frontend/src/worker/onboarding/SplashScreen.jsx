import React from 'react';
import { ShieldCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components';

/**
 * SplashScreen component for Worker Onboarding.
 */
export const SplashScreen = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col items-center justify-between min-h-[85vh] p-6 text-center max-w-md mx-auto">
      {/* Top Branding & Hero Graphic */}
      <div className="w-full flex flex-col items-center pt-8 space-y-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-primary/30 transform hover:scale-105 transition-transform duration-300">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <div className="absolute -top-2 -right-2 p-1.5 bg-emerald-500 text-white rounded-full shadow-md animate-bounce">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            GigScore
          </h1>
          <p className="text-sm font-semibold text-primary uppercase tracking-widest">
            Empowering Gig Workers
          </p>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xs leading-relaxed">
          Build your verified financial identity across gig platforms and unlock instant micro-credit & loans.
        </p>

        {/* Feature Highlights */}
        <div className="w-full bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 text-left shadow-sm">
          <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>Connect Uber, Zomato, Porter & Upwork earnings</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>Get your real-time Gig Reliability Score (GRS)</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <span>Access low-interest credit from partner lenders</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="w-full pt-6 pb-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full shadow-lg shadow-primary/25"
          onClick={onGetStarted}
          icon={ArrowRight}
          iconPosition="right"
        >
          Get Started
        </Button>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
          100% secure • Bank-grade encryption • Consent-based
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
