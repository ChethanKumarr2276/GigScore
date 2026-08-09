import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Users,
  Building2,
  TrendingUp,
  Award,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  PieChart,
  Sliders,
  PlayCircle,
} from 'lucide-react';
import { Button, Card, Header, StatusPill, ScoreBadge } from '../components';

/**
 * LandingPage component - Unified Demo Hub & Portal Switcher Landing Page.
 */
export const LandingPage = () => {
  const navigate = useNavigate();

  const handleLaunchScenario = (profileType) => {
    if (profileType === 'high') {
      navigate('/lender/applicant/GT-MHF-2305-YNKMX-G');
    } else {
      navigate('/lender/applicant/GT-MHF-8821-MOD-G');
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-800 dark:bg-slate-950 dark:text-slate-100 transition-colors flex flex-col">
      <Header portalType="Demo Hub" />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:px-6 space-y-12">
        {/* Hero Banner */}
        <section className="text-center space-y-6 pt-4 sm:pt-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-extrabold tracking-wide uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Next-Gen Gig Economy Underwriting</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
            AI-Powered Micro-Credit Assessment for India's Gig Economy
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            GigScore bridges the credit gap for ride-hailing drivers and delivery workers by evaluating cross-platform income velocity, multi-homing stability, and real-time behavioral evidence.
          </p>

          {/* Active Platform Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-4">
            <div className="p-4 rounded-2xl bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-md">
              <p className="text-2xl font-black text-primary">4 Connected</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gig Platforms (Uber, Zomato...)</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-md">
              <p className="text-2xl font-black text-emerald-500">91%</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Approval Probability Accuracy</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-md">
              <p className="text-2xl font-black text-indigo-500">0.083 PD</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Risk Engine Benchmark</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-md">
              <p className="text-2xl font-black text-amber-500">100% API</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Verified Data Evidence</p>
            </div>
          </div>
        </section>

        {/* Dual Portal Cards */}
        <section className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Choose Your Portal View</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Select an interactive application flow to test</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Card 1: Gig Worker Portal */}
            <Card className="p-6 bg-gradient-to-br from-surface to-slate-50 dark:from-slate-900 dark:to-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 shadow-xl hover:shadow-2xl transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                    <Users className="w-6 h-6" />
                  </div>
                  <StatusPill status="Active" customLabel="Mobile-First View" size="sm" />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Gig Worker Portal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Designed for ride-hailing drivers and delivery partners to track GRS score, manage connected platform feeds, access financial coaching, and track micro-loans.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>5-Step OTP & GigTrust ID Onboarding Flow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Interactive Circular GRS Score Gauge (758 / 1000)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>AI Financial Coach with Priority Action Cards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Active Loan Tracker & One-Tap EMI Payment Modal</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  onClick={() => navigate('/worker/dashboard')}
                  className="w-full justify-center shadow-lg shadow-primary/20"
                >
                  Open Worker Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/worker/onboarding')}
                  className="w-full justify-center"
                >
                  Start Onboarding Flow
                </Button>
              </div>
            </Card>

            {/* Card 2: Lender Underwriting Portal */}
            <Card className="p-6 bg-gradient-to-br from-surface to-slate-50 dark:from-slate-900 dark:to-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 shadow-xl hover:shadow-2xl transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <StatusPill status="Active" customLabel="Desktop-First Underwriting" size="sm" />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Lender Underwriting Portal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Designed for risk underwriters and financial institutions to evaluate applicant queues, inspect SHAP model explainability, and execute decision overrides.
                  </p>
                </div>

                <div className="space-y-2 pt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span>Live Applicant Queue with Filtering & Search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span>SHAP Force Plot Machine Learning Explainability</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span>5/5 Automated Policy Rules Engine Checks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span>Interactive Underwriter Decision Panel & Audit Log</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  icon={ArrowRight}
                  onClick={() => navigate('/lender/queue')}
                  className="w-full justify-center shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700"
                >
                  Open Lender Queue
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/lender/applicant/GT-MHF-2305-YNKMX-G')}
                  className="w-full justify-center"
                >
                  View Underwriting Review
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Traditional Credit Scoring vs GigScore */}
        <section className="space-y-4 pt-4">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Why Traditional Credit Scoring Falls Short</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Most gig workers are creditworthy but invisible to bureau-based underwriting. GigScore closes that gap with alternative data.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 border border-red-500/20 bg-red-50/30 dark:bg-red-950/10 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                Traditional Credit Bureau Scoring
              </h3>
              <div className="space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Requires 6+ months of formal payslips tied to a single employer</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Needs consistent statements from one primary bank account</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Assumes fixed monthly salary, not variable daily gig earnings</span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>Leans on existing loan/credit card history most gig workers don't have</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">
                GigScore Alternative Data Model
              </h3>
              <div className="space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Uses real-time cross-platform earnings velocity instead of payslips</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Evaluates multi-homing stability across linked gig platforms</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Scores behavioral evidence: active days, ratings, service quality</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>No single-employer or fixed-salary requirement</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 text-center">
            <p className="text-3xl sm:text-4xl font-black text-primary">1,000+ Gig Workers Assessed</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-lg mx-auto">
              A segment of India's workforce that traditional bureau-based underwriting typically can't reach — now scoreable with GigScore.
            </p>
          </div>
        </section>


        {/* Interactive Quick Demo Scenario Launchers */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                <span>Quick Underwriting Demo Scenarios</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Launch preset worker credit risk profiles to test automated underwriting decisions
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div
              onClick={() => handleLaunchScenario('high')}
              className="p-5 rounded-2xl bg-surface dark:bg-slate-900 border border-emerald-500/30 hover:border-emerald-500 flex items-center justify-between gap-4 cursor-pointer transition-all shadow-md group"
            >
              <div className="flex items-center gap-4">
                <ScoreBadge score={758} band="RELIABLE" size="sm" showLabel={false} />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Rahul Sharma</h4>
                    <StatusPill status="Approved" customLabel="High Stability" size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    GRS 758 • 4 Platforms • PD 2.8% • Approval Prob 91%
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" icon={ArrowRight} className="shrink-0">
                Test Profile
              </Button>
            </div>

            <div
              onClick={() => handleLaunchScenario('moderate')}
              className="p-5 rounded-2xl bg-surface dark:bg-slate-900 border border-amber-500/30 hover:border-amber-500 flex items-center justify-between gap-4 cursor-pointer transition-all shadow-md group"
            >
              <div className="flex items-center gap-4">
                <ScoreBadge score={612} band="MODERATE_RISK" size="sm" showLabel={false} />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Vikram Patel</h4>
                    <StatusPill status="Pending" customLabel="Moderate Risk" size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    GRS 612 • 2 Platforms • PD 8.5% • Approval Prob 64%
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" icon={ArrowRight} className="shrink-0">
                Test Profile
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-500 dark:text-slate-400 mt-12">
        <p>GigScore AI Micro-Credit Assessment System • Roadmap v1.0 Production Release</p>
      </footer>
    </div>
  );
};

export default LandingPage;
