import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Award,
  IndianRupee,
  AlertCircle,
  XCircle,
} from 'lucide-react';

import { Card, Header, Sidebar, ChartContainer } from '../components';
import { getApplicants } from '../services/api';

const BAND_COLORS = {
  Exceptional: '#10b981',
  STRONG: '#10b981',
  'Very High': '#10b981',
  RELIABLE: '#6366f1',
  High: '#6366f1',
  EMERGING: '#f59e0b',
  Medium: '#f59e0b',
  MODERATE_RISK: '#f59e0b',
  Low: '#ef4444',
  HIGH_RISK: '#ef4444',
};

function parseAmount(str) {
  if (!str) return 0;
  return parseInt(String(str).replace(/\D/g, ''), 10) || 0;
}

/**
 * Simple vertical bar chart built with raw SVG — no charting library
 * dependency required. Renders (label, count) pairs proportionally.
 */
function BarChart({ data, height = 200 }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const barWidth = 100 / data.length;

  return (
    <svg viewBox={`0 0 100 ${height / 10}`} className="w-full h-full" preserveAspectRatio="none">
      {data.map((d, i) => {
        const barHeight = (d.count / max) * (height / 10 - 3);
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

export const PortfolioAnalytics = () => {
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
        console.error('[PortfolioAnalytics] Failed to fetch /applicants:', error);
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

  const stats = useMemo(() => {
    const total = applicants.length;
    const approved = applicants.filter((a) => a.status === 'Approved');
    const approvalRate = total > 0 ? Math.round((approved.length / total) * 100) : 0;
    const avgGrs = total > 0 ? Math.round(applicants.reduce((s, a) => s + (a.grsScore || 0), 0) / total) : 0;
    const totalApprovedValue = approved.reduce((s, a) => s + parseAmount(a.suggestedAmount || a.requestedAmount), 0);

    return { total, approvedCount: approved.length, approvalRate, avgGrs, totalApprovedValue };
  }, [applicants]);

  const bandData = useMemo(() => {
    const counts = {};
    applicants.forEach((a) => {
      const band = a.grsBand || 'Unknown';
      counts[band] = (counts[band] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count, color: BAND_COLORS[label] || '#6366f1' }))
      .sort((a, b) => b.count - a.count);
  }, [applicants]);

  const assessmentData = useMemo(() => {
    const counts = {};
    applicants.forEach((a) => {
      const grade = a.financialAssessment || 'Unknown';
      counts[grade] = (counts[grade] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count, color: BAND_COLORS[label] || '#6366f1' }))
      .sort((a, b) => b.count - a.count);
  }, [applicants]);

  const statusData = useMemo(() => {
    const counts = { Approved: 0, Pending: 0, Rejected: 0 };
    applicants.forEach((a) => {
      if (counts[a.status] !== undefined) counts[a.status] += 1;
      else counts[a.status] = (counts[a.status] || 0) + 1;
    });
    const total = applicants.length || 1;
    return Object.entries(counts).map(([label, count]) => ({
      label,
      count,
      pct: Math.round((count / total) * 100),
    }));
  }, [applicants]);

  return (
    <div className="min-h-screen bg-background text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex transition-colors">
      <Sidebar
        activePath="/lender/analytics"
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
          title="Portfolio Analytics"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Portfolio Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Aggregate view of the current applicant pool — computed live from the applicant queue.
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
            <Card className="p-8 text-center text-slate-400 text-xs">Loading portfolio data...</Card>
          ) : (
            <>
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Applicants</p>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.total}</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Approval Rate</p>
                      <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                        {stats.approvalRate}%
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average GRS</p>
                      <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                        {stats.avgGrs}
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Approved Value</p>
                      <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                        ₹{stats.totalApprovedValue.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartContainer
                  title="GRS Band Distribution"
                  subtitle="Number of applicants per credit risk band"
                  height="h-56"
                  isEmpty={bandData.length === 0}
                >
                  <div className="w-full h-full flex flex-col">
                    <div className="flex-1">
                      <BarChart data={bandData} />
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                      {bandData.map((d) => (
                        <div key={d.label} className="text-center flex-1">
                          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">
                            {d.label}
                          </p>
                          <p className="text-[10px] text-slate-400">{d.count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartContainer>

                <ChartContainer
                  title="Financial Assessment Distribution"
                  subtitle="Number of applicants per stability grade"
                  height="h-56"
                  isEmpty={assessmentData.length === 0}
                >
                  <div className="w-full h-full flex flex-col">
                    <div className="flex-1">
                      <BarChart data={assessmentData} />
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                      {assessmentData.map((d) => (
                        <div key={d.label} className="text-center flex-1">
                          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate">
                            {d.label}
                          </p>
                          <p className="text-[10px] text-slate-400">{d.count}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </ChartContainer>
              </div>

              {/* Status Breakdown */}
              <Card className="p-6">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
                  Decision Status Breakdown
                </h3>
                <div className="space-y-3">
                  {statusData.map((s) => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{s.label}</span>
                        <span className="text-xs text-slate-400">{s.count} ({s.pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            s.label === 'Approved'
                              ? 'bg-emerald-500'
                              : s.label === 'Rejected'
                              ? 'bg-red-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${s.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default PortfolioAnalytics;
