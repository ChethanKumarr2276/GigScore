import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';
import {
  Button,
  Card,
  ScoreBadge,
  ProgressBar,
  StatusPill,
  Header,
  BottomNav,
} from '../components';

/**
 * FinancialCoach component - AI-powered actionable recommendations for Gig Workers.
 */
export const FinancialCoach = () => {
  const navigate = useNavigate();

  const [actionsState, setActionsState] = useState([
    {
      id: 1,
      title: 'Increase Active Working Days',
      priority: 'High',
      impact: '+15 GRS',
      category: 'Income Velocity',
      description: 'Work at least 22 days this month across Uber or Zomato to demonstrate stable income consistency.',
      actionText: 'View Shift Recommendations',
      completed: false,
      icon: Calendar,
    },
    {
      id: 2,
      title: 'Complete Full Biometric KYC',
      priority: 'High',
      impact: '+10 GRS',
      category: 'Identity Trust',
      description: 'Verify your Aadhaar and facial biometrics to unlock tier-1 lender confidence.',
      actionText: 'Start Biometric KYC',
      completed: true,
      icon: ShieldCheck,
    },
    {
      id: 3,
      title: 'Link Additional Gig Platform (e.g., Rapido / Dunzo)',
      priority: 'Medium',
      impact: '+8 GRS',
      category: 'Multi-Homing',
      description: 'Connecting a 5th active platform improves your multi-homing buffer index.',
      actionText: 'Connect Account',
      completed: false,
      icon: Layers,
    },
    {
      id: 4,
      title: 'Reduce Current Debt Burden',
      priority: 'Medium',
      impact: '+5 GRS',
      category: 'Credit Utilization',
      description: 'Pay down your active micro-credit balance to keep debt obligations below 20% of monthly earnings.',
      actionText: 'Pay Early',
      completed: false,
      icon: CreditCard,
    },
    {
      id: 5,
      title: 'Maintain 100% On-Time Payment Consistency',
      priority: 'High',
      impact: '+12 GRS',
      category: 'Repayment History',
      description: 'Set up auto-debit for micro-loan EMIs to guarantee zero late-payment penalties.',
      actionText: 'Set Auto-Debit',
      completed: true,
      icon: CheckCircle2,
    },
  ]);

  const toggleActionComplete = (id) => {
    setActionsState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const navItems = [
    { label: 'Dashboard', icon: TrendingUp, path: '/worker/dashboard' },
    { label: 'Coach', icon: Lightbulb, path: '/worker/coach', badge: 'AI' },
    { label: 'Credit Offer', icon: Zap, path: '/worker/credit' },
    { label: 'Profile', icon: ShieldCheck, path: '/worker/profile' },
  ];

  // Calculate potential score boost
  const pendingPotential = actionsState
    .filter((a) => !a.completed)
    .reduce((acc, curr) => acc + parseInt(curr.impact.replace(/\D/g, ''), 10), 0);

  return (
    <div className="min-h-screen bg-background text-slate-800 dark:bg-slate-950 dark:text-slate-100 pb-24 md:pb-8 transition-colors">
      <Header
        user={{ name: 'Rahul Sharma' }}
        notificationsCount={2}
        portalType="AI Financial Coach"
        title="GigScore"
      />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Page Header Banner */}
        <Card className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white border-slate-800 shadow-2xl p-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI Recommendation Engine Active</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                GigScore AI Financial Coach
              </h1>

              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                Personalized roadmap to boost your Gig Reliability Score (GRS) and unlock higher credit limits with lower interest rates.
              </p>
            </div>

            {/* Target Potential Score Gauge Card */}
            <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center shrink-0 min-w-[170px] shadow-lg">
              <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Score Boost Potential</span>
              <div className="flex items-baseline gap-1 my-1">
                <span className="text-3xl font-extrabold text-emerald-400">+{pendingPotential}</span>
                <span className="text-xs font-bold text-emerald-400">pts</span>
              </div>
              <span className="text-[11px] text-slate-400">758 → {758 + pendingPotential} GRS</span>
            </div>
          </div>
        </Card>

        {/* Priority Filter / Summary Bar */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
          <span>Priority Action Checklist ({actionsState.filter((a) => !a.completed).length} Pending)</span>
          <span className="text-emerald-500">{actionsState.filter((a) => a.completed).length} Completed</span>
        </div>

        {/* Priority Action Cards List */}
        <div className="space-y-4">
          {actionsState.map((card) => {
            const Icon = card.icon;
            const isHighPriority = card.priority === 'High';

            return (
              <Card
                key={card.id}
                className={`p-5 transition-all duration-200 ${
                  card.completed
                    ? 'opacity-75 bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-2xl shrink-0 mt-0.5 border ${
                        card.completed
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : isHighPriority
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}
                    >
                      <Icon className="w-6 h-6 stroke-[2]" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-base font-bold ${card.completed ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {card.title}
                        </h3>

                        {/* Priority Badge */}
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full border ${
                            card.completed
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : isHighPriority
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {card.priority} Priority
                        </span>

                        {/* Impact Tag */}
                        <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                          {card.impact} Impact
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </div>

                  {/* Card Trigger & Checkmark Controls */}
                  <div className="flex items-center sm:flex-col items-end gap-2 shrink-0 pt-2 sm:pt-0">
                    <Button
                      variant={card.completed ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => toggleActionComplete(card.id)}
                      icon={card.completed ? CheckCircle2 : ArrowUpRight}
                      className="w-full sm:w-auto"
                    >
                      {card.completed ? 'Completed' : card.actionText}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      <BottomNav
        activePath="/worker/coach"
        navItems={navItems}
        onNavigate={(path) => navigate(path)}
      />
    </div>
  );
};

export default FinancialCoach;
