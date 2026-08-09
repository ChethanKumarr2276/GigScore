import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  PieChart,
  Activity,
  ArrowUpRight,
  Zap,
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
import { getScoreDetails } from '../services/api';

const PILLAR_META = [
  { key: 'earning', label: 'Earning Power & Stability', weight: 25, desc: 'Income level, growth trend, and consistency across linked gig platforms' },
  { key: 'continuity', label: 'Work Volume & Continuity', weight: 20, desc: 'Active working days and consistency of gig engagement over time' },
  { key: 'service', label: 'Service Quality', weight: 20, desc: 'Ratings, cancellations, and customer feedback across platforms' },
  { key: 'financial', label: 'Financial Health & Debt Burden', weight: 20, desc: 'Existing debt load relative to income and savings behavior' },
  { key: 'integrity', label: 'Integrity & Verification', weight: 15, desc: 'Fraud indicators, KYC verification status, and platform discrepancies' },
];

/**
 * AssessmentDetail component - Live Binding to locked v1.0 JSON contract.
 */
export const AssessmentDetail = () => {
  const navigate = useNavigate();
  const [scoreData, setScoreData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadScoreData() {
      try {
        const res = await getScoreDetails('GT-MHF-2305-YNKMX-G');
        if (isMounted) {
          setScoreData(res);
        }
      } catch (err) {
        console.warn('API error in AssessmentDetail:', err);
      }
    }
    loadScoreData();
    return () => {
      isMounted = false;
    };
  }, []);

  const contract = {
    gigtrust_id: scoreData?.gigtrust_id || 'GT-MHF-2305-YNKMX-G',
    grs: scoreData?.grs ?? 758,
    grs_max: 1000,
    grs_band: scoreData?.grs_band || 'RELIABLE',
    financial_assessment: scoreData?.financial_assessment || 'High',
    fraud_flag: scoreData?.fraud_flag ?? false,
    pillar_scores: scoreData?.pillar_scores || {
      earning: 0.84,
      continuity: 0.78,
      service: 0.88,
      financial: 0.82,
      integrity: 1.0,
    },
    top_5_reasons: scoreData?.top_5_reasons || [
      'Stable monthly income aggregate',
      'Low income volatility across linked platforms',
      'Strong historical repayment discipline',
      'High active-day ratio (>82%)',
      'Zero fraud flags or platform discrepancies',
    ],
  };

  const scoreDetails = {
    workerName: 'Rahul Sharma',
    improvementTips: [
      { title: 'Maintain 3+ Active Platforms', desc: 'Keep Swiggy and Porter active to maximize your multi-homing buffer.' },
      { title: 'Keep Debt Ratio Under 25%', desc: 'Ensure monthly loan EMIs do not exceed ₹9,200.' },
      { title: 'Regular API Syncs', desc: 'Open the app weekly to trigger real-time earning verification.' },
    ],
  };

  const pillarIndicators = PILLAR_META.map((p) => {
    const raw = contract.pillar_scores[p.key] ?? 0;
    const score = Math.round(raw * 100);
    const color = score >= 70 ? 'success' : score >= 50 ? 'primary' : 'danger';
    return { ...p, score, max: 100, color };
  });

  const navItems = [
    { label: 'Dashboard', icon: Activity, path: '/worker/dashboard' },
    { label: 'Assessment', icon: ShieldCheck, path: '/worker/assessment' },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-800 dark:bg-slate-950 dark:text-slate-100 pb-24 md:pb-8 transition-colors">
      <Header
        user={{ name: scoreDetails.workerName }}
        notificationsCount={2}
        portalType="Assessment Breakdown"
        title="GigScore"
      />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Back Button Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/worker/dashboard')}
            icon={ArrowLeft}
          >
            Back to Dashboard
          </Button>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            GigTrust ID: {contract.gigtrust_id}
          </span>
        </div>

        {/* Financial Assessment Banner */}
        <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border-slate-800 shadow-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Financial Stability Assessment: {contract.financial_assessment}</span>
              </div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                  contract.fraud_flag
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {contract.fraud_flag ? <AlertCircle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{contract.fraud_flag ? 'Fraud Indicators Detected' : 'Fraud Check: Clear'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Detailed Credit Risk Assessment
              </h1>
              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                Comprehensive algorithmic evaluation based on 90-day platform earnings velocity, cash flow consistency, and multi-homing stability.
              </p>
            </div>

            <ScoreBadge
              score={contract.grs}
              maxScore={contract.grs_max}
              band={contract.grs_band}
              size="lg"
              className="shrink-0 self-start sm:self-center"
            />
          </div>
        </Card>

        {/* Score Pillar Breakdown — real weighted factors behind the GRS */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <span>Score Pillar Breakdown</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
            The five weighted factors that make up your GRS — this is the real scoring model, not a simplified summary.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pillarIndicators.map((ind, idx) => (
              <Card key={idx} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ind.label}</span>
                  <span className="text-xs font-bold text-slate-400">weight {ind.weight}%</span>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-primary">{ind.score} / {ind.max}</span>
                </div>
                <ProgressBar value={ind.score} max={ind.max} color={ind.color} height="md" />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5">{ind.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Top 5 Scoring Drivers Panel (Bound to top_5_reasons array) */}
        <Card
          title="Top 5 Positive Scoring Drivers (v1.0 Contract Payload)"
          subtitle="Key positive factors contributing to your high GRS rating"
          className="p-6"
        >
          <div className="space-y-3">
            {contract.top_5_reasons.map((reasonText, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5"
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{reasonText}</h4>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Improvement Suggestions Card */}
        <Card
          title="Score Enhancement Recommendations"
          subtitle="Actionable steps to reach the 800+ Tier-1 Excellent credit band"
          className="p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {scoreDetails.improvementTips.map((tip, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/50 space-y-2"
              >
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <Zap className="w-4 h-4 shrink-0" />
                  <span>Tip #{idx + 1}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{tip.title}</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <BottomNav
        activePath="/worker/assessment"
        navItems={navItems}
        onNavigate={(path) => navigate(path)}
      />
    </div>
  );
};

export default AssessmentDetail;
