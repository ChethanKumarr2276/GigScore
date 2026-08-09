import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  IndianRupee,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Layers,
} from 'lucide-react';

import { Card, Header, Sidebar, ChartContainer } from '../components';
import { getApplicants } from '../services/api';

const BAND_COLORS = {
  PRIME: '#10b981',
  STRONG: '#10b981',
  Exceptional: '#10b981',
  RELIABLE: '#6366f1',
  MODERATE_RISK: '#f59e0b',
  HIGH_RISK: '#ef4444',
};

const HIGH_RISK_BANDS = ['MODERATE_RISK', 'HIGH_RISK'];
const FLAGGED_PD_THRESHOLD = 10; // percent

function parseAmount(str) {
  if (!str) return 0;
  return parseInt(String(str).replace(/\D/g, ''), 10) || 0;
}

function parsePd(str) {
  if (!str) return 0;
  const n = parseFloat(String(str).replace('%', ''));
  return Number.isNaN(n) ? 0 : n;
}

function formatINR(n) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/**
 * Simple vertical bar chart built with raw SVG — no charting library
 * dependency required. Renders (label, value) pairs proportionally.
 */
function BarChart({ data, height = 200 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <svg viewBox={`0 0 100 ${height / 10}`} className="w-full h-full" preserveAspectRatio="none">
      {data.map((d, i) => {
        const barHeight = (d.value / max) * (height / 10 - 3);
        const x = i * barWidth + barWidth * 0.15;
        const w = barWidth * 0.7;
        const y = height / 10 - barHeight - 1.5;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={w}
              height={barHeight}
              rx="0.6"
              fill={d.color || '#6366f1'}
              opacity="0.9"
            />
          </g>
        );
      })}
    </svg>
  );
}

export const RiskParameters = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchApplicants() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getApplicants();
        if (isMounted) setApplicants(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('[RiskParameters] Failed to fetch /applicants:', error);
        if (isMounted) {
          setLoadError('Could not load applicant data from the backend.');
          setApplicants([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchApplicants();
    return () => {
      isMounted = false;
    };
  }, []);

  const lenderNavItems = [
    { label: 'Applicant Queue', icon: Users, path: '/lender/queue', badge: `${applicants.length} New` },
    {
      label: 'Approved Loans',
      icon: CheckCircle2,
      path: '/lender/approved',
      badge: `${applicants.filter((a) => a.status === 'Approved').length}`,
    },
    { label: 'Rejected Loans', icon: XCircle, path: '/lender/rejected', badge: `${applicants.filter((a) => a.status === 'Rejected').length}` },
    { label: 'Portfolio Analytics', icon: TrendingUp, path: '/lender/analytics' },
    { label: 'Risk Parameters', icon: ShieldCheck, path: '/lender/parameters' },
  ];

  // Active exposure = everything not already rejected (Approved + Pending)
  const activeApplicants = useMemo(
    () => applicants.filter((a) => a.status !== 'Rejected'),
    [applicants]
  );

  const stats = useMemo(() => {
    const totalExposure = activeApplicants.reduce((s, a) => s + parseAmount(a.suggestedAmount), 0);
    const expectedLoss = activeApplicants.reduce(
      (s, a) => s + parseAmount(a.suggestedAmount) * (parsePd(a.pdRate) / 100),
      0
    );
    const highRiskExposure = activeApplicants
      .filter((a) => HIGH_RISK_BANDS.includes(a.grsBand))
      .reduce((s, a) => s + parseAmount(a.suggestedAmount), 0);
    const highRiskPct = totalExposure > 0 ? Math.round((highRiskExposure / totalExposure) * 100) : 0;
    const flaggedCount = activeApplicants.filter((a) => parsePd(a.pdRate) > FLAGGED_PD_THRESHOLD).length;

    return { totalExposure, expectedLoss, highRiskPct, flaggedCount };
  }, [activeApplicants]);

  const bandExposureData = useMemo(() => {
    const totals = {};
    activeApplicants.forEach((a) => {
      const band = a.grsBand || 'Unknown';
      totals[band] = (totals[band] || 0) + parseAmount(a.suggestedAmount);
    });
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value, color: BAND_COLORS[label] || '#6366f1' }))
      .sort((a, b) => b.value - a.value);
  }, [activeApplicants]);

  const platformConcentration = useMemo(() => {
    let single = 0;
    let multi = 0;
    activeApplicants.forEach((a) => {
      const amt = parseAmount(a.suggestedAmount);
      if ((a.platformsCount || 1) <= 1) single += amt;
      else multi += amt;
    });
    const total = single + multi || 1;
    return {
      single,
      multi,
      singlePct: Math.round((single / total) * 100),
      multiPct: Math.round((multi / total) * 100),
    };
  }, [activeApplicants]);

  const topFlagged = useMemo(() => {
    return [...activeApplicants]
      .sort((a, b) => parsePd(b.pdRate) - parsePd(a.pdRate))
      .slice(0, 10);
  }, [activeApplicants]);

  return (
    <div className="min-h-screen bg-background text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex transition-colors">
      <Sidebar
        activePath="/lender/parameters"
        navItems={lenderNavItems}
        user={{ name: 'KreditBee Underwriting Team', email: 'underwriting@kreditbee.in' }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={(path) => navigate(path)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={{ name: 'KreditBee Admin' }}
          notificationsCount={5}
          portalType="Lender Portal"
          title="Risk Parameters"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Portfolio Risk Exposure
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Aggregate risk exposure across active applicants — computed live from the applicant queue.
            </p>
          </div>

          {loadError && (
            <Card className="p-4 border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                {loadError}
              </div>
            </Card>
          )}

          {isLoading ? (
            <Card className="p-8 text-center text-slate-400 text-xs">Loading risk data...</Card>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Portfolio Exposure</p>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {formatINR(stats.totalExposure)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Expected Loss (PD-weighted)</p>
                      <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                        {formatINR(stats.expectedLoss)}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Exposure in Risk Bands</p>
                      <p className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">
                        {stats.highRiskPct}%
                      </p>
                    </div>
                    <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl border border-red-500/20">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Flagged Applicants</p>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                        {stats.flaggedCount}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">PD &gt; {FLAGGED_PD_THRESHOLD}%</p>
                    </div>
                    <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartContainer
                  title="Risk Concentration by Band"
                  subtitle="₹ exposure per credit risk band (not applicant count)"
                  height="h-56"
                  isEmpty={bandExposureData.length === 0}
                >
                  <div className="w-full h-full flex flex-col">
                    <div className="flex-1">
                      <BarChart data={bandExposureData} />
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                      {bandExposureData.map((d) => (
                        <div key={d.label} className="text-center flex-1">
                          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">
                            {d.label}
                          </p>
                          <p className="text-[10px] text-slate-400">{formatINR(d.value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartContainer>

                <Card className="p-6">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-400" />
                    Platform Concentration Risk
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Exposure held by single-platform vs. multi-platform workers
                  </p>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Single-platform (higher risk)
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatINR(platformConcentration.single)} ({platformConcentration.singlePct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500"
                          style={{ width: `${platformConcentration.singlePct}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          Multi-platform (diversified)
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatINR(platformConcentration.multi)} ({platformConcentration.multiPct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${platformConcentration.multiPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Top Flagged Applicants */}
              <Card className="p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Top Flagged Applicants
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Highest probability-of-default applicants in the active queue
                </p>

                {topFlagged.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No active applicants to display.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <th className="py-2 pr-4 font-semibold">Name</th>
                          <th className="py-2 pr-4 font-semibold">GigTrust ID</th>
                          <th className="py-2 pr-4 font-semibold">GRS</th>
                          <th className="py-2 pr-4 font-semibold">Band</th>
                          <th className="py-2 pr-4 font-semibold">PD</th>
                          <th className="py-2 pr-4 font-semibold">Exposure</th>
                          <th className="py-2 pr-4 font-semibold">Platform</th>
                          <th className="py-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topFlagged.map((a) => (
                          <tr
                            key={a.id}
                            className="border-b border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300"
                          >
                            <td className="py-2 pr-4 font-medium text-slate-900 dark:text-white">{a.name}</td>
                            <td className="py-2 pr-4 text-slate-400">{a.gigTrustId}</td>
                            <td className="py-2 pr-4">{a.grsScore}</td>
                            <td className="py-2 pr-4">
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                style={{
                                  color: BAND_COLORS[a.grsBand] || '#6366f1',
                                  backgroundColor: `${BAND_COLORS[a.grsBand] || '#6366f1'}1a`,
                                }}
                              >
                                {a.grsBand}
                              </span>
                            </td>
                            <td className="py-2 pr-4 font-semibold text-red-500 dark:text-red-400">{a.pdRate}</td>
                            <td className="py-2 pr-4">{a.suggestedAmount}</td>
                            <td className="py-2 pr-4">{a.primaryPlatform}</td>
                            <td className="py-2">{a.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default RiskParameters;
