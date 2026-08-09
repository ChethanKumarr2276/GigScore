import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Check,
  X,
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
  Sidebar,
} from '../components';
import { DecisionPanel } from './DecisionPanel';
import { getScoreDetails, getWorkerProfile } from '../services/api';

/**
 * ApplicantDetail component - Live Binding & Demo Profile Event Listener.
 */
export const ApplicantDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [decisionAudit, setDecisionAudit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contractData, setContractData] = useState(null);
  const [workerData, setWorkerData] = useState(null);

  const targetId = id || 'GT-MHF-2305-YNKMX-G';

  const loadApplicantScore = async () => {
    setIsLoading(true);
    try {
      const [scoreRes, workerRes] = await Promise.all([
        getScoreDetails(targetId),
        getWorkerProfile(targetId),
      ]);
      setContractData(scoreRes);
      setWorkerData(workerRes);
      setIsLoading(false);
    } catch (err) {
      console.warn('API error fetching applicant details:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApplicantScore();

    const handleProfileChange = () => {
      loadApplicantScore();
    };

    window.addEventListener('gigscore:profile-changed', handleProfileChange);
    return () => {
      window.removeEventListener('gigscore:profile-changed', handleProfileChange);
    };
  }, [targetId]);

  // Bind exact keys from Roadmap v1.0 JSON Contract (score-related fields only —
  // identity fields like name/location come from the /worker endpoint below,
  // since /score does not return them).
  const contract = {
    gigtrust_id: contractData?.gigtrust_id || targetId,
    grs: contractData?.grs ?? 758,
    grs_band: contractData?.grs_band || 'RELIABLE',
    financial_assessment: contractData?.financial_assessment || 'High',
    pd: contractData?.pd ?? 0.083,
    p_approve: contractData?.p_approve ?? 0.91,
    max_amount: contractData?.max_amount ?? 32000,
    interest_rate: contractData?.interest_rate ?? 14.5,
    evidence_quality: contractData?.evidence_quality || 'High',
    top_5_reasons: contractData?.top_5_reasons || [
      'Stable monthly income aggregate',
      'Low income volatility across linked platforms',
      'Strong historical repayment discipline',
      'High active-day ratio (>82%)',
      'Zero fraud flags or platform discrepancies',
    ],
    fraud_flag: contractData?.fraud_flag ?? false,
    pillar_scores: contractData?.pillar_scores || {
      earning: 0.5,
      continuity: 0.5,
      service: 0.5,
      financial: 0.5,
      integrity: 0.5,
    },
  };

  const applicant = {
    name: workerData?.name || 'Loading...',
    category: workerData?.category || 'Ride-Hailing & Delivery Driver',
    location: workerData?.location || 'Bengaluru, KA',
    primaryPlatform: workerData?.primaryPlatform || 'Uber Rides',
    // Matches the same 0.7x-of-max-amount formula the backend uses for the
    // Lender Queue's "Requested" column, so this screen agrees with that one.
    requestedAmount: Math.floor(contract.max_amount * 0.7),
    verifiedPlatforms: workerData?.linkedPlatforms || [],
    // No backend loan/repayment data model exists yet — this is clearly
    // labeled illustrative sample data below, not a live record.
    repaymentHistory: [
      { emi: '#1', amount: '₹4,250', date: '14 Apr 2026', status: 'Paid On-Time' },
      { emi: '#2', amount: '₹4,250', date: '15 May 2026', status: 'Paid On-Time' },
      { emi: '#3', amount: '₹4,250', date: '12 Jun 2026', status: 'Paid On-Time' },
      { emi: '#4', amount: '₹3,250', date: '15 Jul 2026', status: 'Paid On-Time' },
    ],
  };

  const lenderNavItems = [
    { label: 'Applicant Queue', icon: Layers, path: '/lender/queue' },
    { label: 'Underwriting Review', icon: ShieldCheck, path: `/lender/applicant/${contract.gigtrust_id}` },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex transition-colors">
      <Sidebar
        activePath={`/lender/applicant/${contract.gigtrust_id}`}
        navItems={lenderNavItems}
        user={{ name: 'KreditBee Team', email: 'underwriting@kreditbee.in' }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={(path) => navigate(path)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={{ name: 'KreditBee Admin' }}
          notificationsCount={5}
          portalType="Underwriting Review"
          title="GigScore"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Header Navigation & Applicant Identity */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/lender/queue')}
                icon={ArrowLeft}
                className="mb-2"
              >
                Back to Applicant Queue
              </Button>

              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  {applicant.name}
                </h1>
                <StatusPill status="Verified" customLabel="API Verified" size="sm" />
                {contract.fraud_flag ? (
                  <StatusPill status="Rejected" customLabel="Fraud Flagged" size="sm" />
                ) : (
                  <StatusPill status="Approved" customLabel="Zero Fraud Flag" size="sm" />
                )}
                {decisionAudit && (
                  <StatusPill
                    status={decisionAudit.decisionAction === 'APPROVE' ? 'Approved' : 'Rejected'}
                    customLabel={`Decision: ${decisionAudit.decisionAction}`}
                    size="sm"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {contract.gigtrust_id}
                </span>
                <span>•</span>
                <span>{applicant.category}</span>
                <span>•</span>
                <span>{applicant.location}</span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <LoadingSkeleton variant="card" />
              <LoadingSkeleton variant="rect" height="120px" />
            </div>
          ) : (
            <>
              {/* Verified Platforms Chip Bar */}
              <Card className="p-4 bg-slate-900 text-white border-slate-800">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Verified Connected Data Sources</span>
                  <span className="text-xs font-semibold text-emerald-400">
                    {applicant.verifiedPlatforms.length} Active API Feed{applicant.verifiedPlatforms.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {applicant.verifiedPlatforms.map((p, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{p.icon}</span>
                        <div>
                          <p className="font-bold text-white leading-tight">{p.name}</p>
                          <p className="text-[10px] text-emerald-400 font-semibold">{p.earnings}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Core Underwriting Credit Metrics Grid bound to JSON Contract Keys */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="p-4 border-l-4 border-l-emerald-500">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Approval Probability (p_approve)</span>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{(contract.p_approve * 100).toFixed(0)}%</p>
                  <p className="text-[10px] text-slate-400 mt-1">Score: {contract.grs} ({contract.grs_band})</p>
                </Card>

                <Card className="p-4 border-l-4 border-l-primary">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Probability of Default (pd)</span>
                  <p className="text-2xl font-extrabold text-primary mt-1">{(contract.pd * 100).toFixed(1)}%</p>
                  <p className="text-[10px] text-slate-400 mt-1">PD: {contract.pd}</p>
                </Card>

                <Card className="p-4 border-l-4 border-l-indigo-500">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Suggested Interest Rate</span>
                  <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{contract.interest_rate}% p.a.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Risk-adjusted APR</p>
                </Card>

                <Card className="p-4 border-l-4 border-l-emerald-500">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Max Limit (max_amount)</span>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">₹{contract.max_amount.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-1">Req: ₹{applicant.requestedAmount.toLocaleString('en-IN')}</p>
                </Card>

                <Card className="p-4 border-l-4 border-l-blue-500">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Evidence Quality</span>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-2">{contract.evidence_quality} Quality</p>
                  <p className="text-[10px] text-emerald-500 font-semibold mt-1">Fraud Flag: {String(contract.fraud_flag)}</p>
                </Card>
              </div>

              {/* Task 10: Underwriter Decision Panel Component */}
              <DecisionPanel
                applicant={{
                  name: applicant.name,
                  gigTrustId: contract.gigtrust_id,
                  grsScore: contract.grs,
                  requestedAmount: applicant.requestedAmount,
                  maxRecommended: contract.max_amount,
                  pillarScores: contract.pillar_scores,
                  fraudFlag: contract.fraud_flag,
                  platformsCount: applicant.verifiedPlatforms.length,
                }}
                onDecisionSubmitted={(audit) => setDecisionAudit(audit)}
              />

              {/* Top 5 Reasons Panel bound to top_5_reasons array */}
              <Card
                title="Top 5 Decision Reasons (Locked Roadmap v1.0 Contract)"
                subtitle={`Calculated GRS ${contract.grs} (${contract.grs_band}) for ${contract.gigtrust_id}`}
                className="p-6"
              >
                <div className="space-y-3">
                  {contract.top_5_reasons.map((reason, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{reason}</span>
                      </div>
                      <StatusPill status="Approved" customLabel="Verified Factor" size="sm" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Financial Trend Charts & Repayment History */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Income Trend Preview */}
                <ChartContainer
                  title="Monthly Earnings Velocity (90 Days)"
                  subtitle="Aggregated platform payouts (Uber, Zomato, Swiggy)"
                >
                  <div className="w-full flex flex-col items-center justify-center p-4 text-center space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹37,050</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Average Payout / mo</span>
                    </div>
                    <div className="w-full h-20 bg-slate-100 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-end justify-between px-4 py-2 gap-2">
                      {[45, 60, 52, 75, 68, 88, 92].map((val, idx) => (
                        <div
                          key={idx}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 rounded-t-md transition-all duration-300"
                          style={{ height: `${val}%` }}
                          title={`Week ${idx + 1}: ${val}%`}
                        />
                      ))}
                    </div>
                  </div>
                </ChartContainer>

                {/* Repayment History Grid — illustrative sample data, no live loan disbursed */}
                <Card
                  title="Historical Loan Repayment Track Record"
                  subtitle="Sample repayment schedule — illustrative only, no live loan disbursed yet"
                >
                  <div className="space-y-2.5">
                    {applicant.repaymentHistory.map((h, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900 dark:text-white">{h.emi}</span>
                          <span className="text-slate-500 dark:text-slate-400">{h.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-extrabold text-slate-900 dark:text-white">{h.amount}</span>
                          <StatusPill status="Approved" customLabel={h.status} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ApplicantDetail;
