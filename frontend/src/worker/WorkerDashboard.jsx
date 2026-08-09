import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Zap,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  FileText,
  Lightbulb,
  CreditCard,
} from 'lucide-react';
import {
  Button,
  Card,
  ScoreBadge,
  ProgressBar,
  StatusPill,
  ChartContainer,
  LoadingSkeleton,
  Header,
  BottomNav,
  showToast,
} from '../components';
import { getWorkerProfile, getScoreDetails } from '../services/api';

/**
 * WorkerDashboard component - Live Binding to locked v1.0 JSON contract & Demo Profile Event Listener.
 */
export const WorkerDashboard = () => {
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [scoreData, setScoreData] = useState(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [profileRes, scoreRes] = await Promise.all([
        getWorkerProfile(),
        getScoreDetails(),
      ]);
      setProfileData(profileRes);
      setScoreData(scoreRes);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard API:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleProfileChange = () => {
      loadDashboardData();
    };

    window.addEventListener('gigscore:profile-changed', handleProfileChange);
    return () => {
      window.removeEventListener('gigscore:profile-changed', handleProfileChange);
    };
  }, []);

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      const updatedScore = await getScoreDetails();
      setScoreData(updatedScore);
      showToast(`Platform Data Synced across Uber, Zomato & Swiggy`, 'success');
    } catch (err) {
      console.warn('Sync API error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', icon: Wallet, path: '/worker/dashboard' },
    { label: 'Loans', icon: CreditCard, path: '/worker/loans', badge: 'Active' },
    { label: 'AI Coach', icon: Lightbulb, path: '/worker/coach', badge: '+35 pts' },
    { label: 'Assessment', icon: FileText, path: '/worker/assessment' },
    { label: 'Profile', icon: ShieldCheck, path: '/worker/profile' },
  ];

  const worker = profileData || {
    name: 'Rahul Sharma',
    gigTrustId: 'GT-MHF-2305-YNKMX-G',
    linkedPlatforms: [
      { id: 'uber', name: 'Uber Rides', earnings: '₹14,200', syncStatus: 'Synced 2h ago', icon: '🚗' },
      { id: 'zomato', name: 'Zomato Delivery', earnings: '₹9,850', syncStatus: 'Synced 1h ago', icon: '🍕' },
      { id: 'swiggy', name: 'Swiggy Instamart', earnings: '₹7,400', syncStatus: 'Synced 4h ago', icon: '🛒' },
      { id: 'porter', name: 'Porter Logistics', earnings: '₹5,600', syncStatus: 'Synced 12h ago', icon: '📦' },
    ],
  };

  const score = {
    grs: scoreData?.grs ?? 758,
    grs_max: 900,
    grs_band: scoreData?.grs_band || 'RELIABLE',
    financial_assessment: scoreData?.financial_assessment || 'High',
    evidence_quality: scoreData?.evidence_quality || 'High',
    gigtrust_id: scoreData?.gigtrust_id || worker.gigTrustId || 'GT-MHF-2305-YNKMX-G',
  };

  const scorePercent = (score.grs / score.grs_max) * 100;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  return (
    <div className="min-h-screen bg-background text-slate-800 dark:bg-slate-950 dark:text-slate-100 pb-24 md:pb-8 transition-colors">
      <Header
        user={{ name: worker.name }}
        notificationsCount={2}
        portalType="Worker"
        title="GigScore"
      />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <LoadingSkeleton variant="card" />
            <div className="grid md:grid-cols-2 gap-6">
              <LoadingSkeleton variant="card" />
              <LoadingSkeleton variant="card" />
            </div>
          </div>
        ) : (
          <>
            {/* Worker Identity Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-primary/20 shrink-0">
                  {worker.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-bold text-lg text-slate-900 dark:text-white">{worker.name}</h1>
                    <StatusPill status={score.grs_band === 'HIGH_RISK' ? 'Rejected' : 'Verified'} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{score.gigtrust_id}</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncData}
                isLoading={isSyncing}
                icon={RefreshCw}
                className="w-full sm:w-auto"
              >
                Sync Platform Data
              </Button>
            </div>

            {/* Active Loan & AI Coach Teaser Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div
                onClick={() => navigate('/worker/loans')}
                className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border border-emerald-500/30 text-white flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/60 transition-all shadow-xl group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Loan</span>
                      <StatusPill status="Pending" customLabel="Due Soon" size="sm" />
                    </div>
                    <p className="text-xs text-slate-200 mt-0.5 font-bold">
                      ₹1,125 due in 4 days
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>

              <div
                onClick={() => navigate('/worker/coach')}
                className="p-4 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 border border-indigo-500/30 text-white flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-500/60 transition-all shadow-xl group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
                    <Lightbulb className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">AI Financial Coach</span>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                        +35 GRS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 font-medium">
                      5 priority actions to boost credit limit
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-indigo-300 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </div>

            {/* Hero Section: Circular GRS Score Gauge & Financial Stability */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border-slate-800 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Gig Reliability Score</span>
                    <h2 className="text-base font-semibold text-white">GRS Assessment</h2>
                  </div>
                  <ScoreBadge score={score.grs} band={score.grs_band} size="sm" showLabel={false} />
                </div>

                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="88"
                        cy="88"
                        r={radius}
                        className="stroke-slate-800"
                        strokeWidth="12"
                        fill="transparent"
                      />
                      <circle
                        cx="88"
                        cy="88"
                        r={radius}
                        className={`transition-all duration-1000 ease-out ${
                          score.grs_band === 'RELIABLE'
                            ? 'stroke-emerald-400'
                            : score.grs_band === 'MODERATE_RISK'
                            ? 'stroke-amber-400'
                            : 'stroke-red-500'
                        }`}
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-4xl font-extrabold text-white tracking-tight">{score.grs}</span>
                      <span className="text-xs text-slate-400 font-medium">out of 1000</span>
                      <span
                        className={`mt-1 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full border ${
                          score.grs_band === 'RELIABLE'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : score.grs_band === 'MODERATE_RISK'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}
                      >
                        {score.grs_band}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/worker/assessment')}
                  className="w-full py-2.5 px-4 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-200 flex items-center justify-between transition-all group"
                >
                  <span>View Full Score Breakdown & Drivers</span>
                  <ChevronRight className="w-4 h-4 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                </button>
              </Card>

              <Card className="flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stability Grade</span>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">Financial Assessment</h3>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{score.financial_assessment} Stability</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <ProgressBar
                      value={score.grs_band === 'RELIABLE' ? 84 : score.grs_band === 'MODERATE_RISK' ? 62 : 45}
                      label="Income Velocity Index"
                      showValue
                      color={score.grs_band === 'RELIABLE' ? 'success' : score.grs_band === 'MODERATE_RISK' ? 'warning' : 'danger'}
                    />
                    <ProgressBar
                      value={score.grs_band === 'RELIABLE' ? 78 : score.grs_band === 'MODERATE_RISK' ? 55 : 30}
                      label="Platform Multi-Homing Score"
                      showValue
                      color="primary"
                    />
                    <ProgressBar
                      value={score.grs_band === 'RELIABLE' ? 92 : score.grs_band === 'MODERATE_RISK' ? 70 : 42}
                      label="Repayment Discipline Probability"
                      showValue
                      color={score.grs_band === 'RELIABLE' ? 'success' : 'warning'}
                    />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Evidence Quality</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{score.evidence_quality} Quality</span>
                </div>
              </Card>
            </div>

            {/* Linked Platforms Section */}
            <Card
              title="Connected Gig Platforms"
              subtitle={`${worker.linkedPlatforms.length} Active API Integrations`}
              action={
                <Button variant="outline" size="sm" icon={ArrowUpRight}>
                  Add Platform
                </Button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {worker.linkedPlatforms.map((platform) => (
                  <div
                    key={platform.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl p-2 rounded-xl bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0">
                        {platform.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{platform.name}</h4>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{platform.earnings}</p>
                      </div>
                    </div>
                    <StatusPill status="Active" size="sm" customLabel="Synced" />
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </main>

      <BottomNav
        activePath="/worker/dashboard"
        navItems={navItems}
        onNavigate={(path) => navigate(path)}
      />
    </div>
  );
};

export default WorkerDashboard;
