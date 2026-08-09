import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Eye,
  IndianRupee,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';

import { Button, Card, ScoreBadge, Header, Sidebar } from '../components';
import { getApplicants } from '../services/api';

const PAGE_SIZE = 10;

function parseAmount(str) {
  if (!str) return 0;
  return parseInt(String(str).replace(/\D/g, ''), 10) || 0;
}

export const ApprovedLoans = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function fetchApplicants() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await getApplicants();
        if (isMounted) setApplicants(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('[ApprovedLoans] Failed to fetch /applicants:', error);
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

  const approvedLoans = useMemo(
    () => applicants.filter((a) => a.status === 'Approved'),
    [applicants]
  );

  const totalApprovedValue = useMemo(
    () => approvedLoans.reduce((s, a) => s + parseAmount(a.suggestedAmount || a.requestedAmount), 0),
    [approvedLoans]
  );

  const lenderNavItems = [
    { label: 'Applicant Queue', icon: Users, path: '/lender/queue', badge: `${applicants.length} New` },
    { label: 'Approved Loans', icon: CheckCircle2, path: '/lender/approved', badge: `${approvedLoans.length}` },
    { label: 'Rejected Loans', icon: XCircle, path: '/lender/rejected', badge: `${applicants.filter((a) => a.status === 'Rejected').length}` },
    { label: 'Portfolio Analytics', icon: TrendingUp, path: '/lender/analytics' },
    { label: 'Risk Parameters', icon: ShieldCheck, path: '/lender/parameters' },
  ];

  const totalPages = Math.max(1, Math.ceil(approvedLoans.length / PAGE_SIZE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return approvedLoans.slice(start, start + PAGE_SIZE);
  }, [approvedLoans, currentPage]);

  const goToPage = (page) => setCurrentPage(Math.min(Math.max(1, page), totalPages));

  return (
    <div className="min-h-screen bg-background text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex transition-colors">
      <Sidebar
        activePath="/lender/approved"
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
          title="Approved Loans"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Approved Loans
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Applicants whose loan decision was recorded as Approved.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Approved</p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {approvedLoans.length}
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
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Value Disbursed</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    ₹{totalApprovedValue.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">GigTrust ID & Applicant</th>
                    <th className="px-4 py-3.5">GRS Score & Band</th>
                    <th className="px-4 py-3.5">PD %</th>
                    <th className="px-4 py-3.5">Approved Amount</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                        Loading approved loans...
                      </td>
                    </tr>
                  ) : paginated.length > 0 ? (
                    paginated.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{app.name}</div>
                          <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                            {app.gigTrustId}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <ScoreBadge score={app.grsScore} band={app.grsBand} size="sm" showLabel={true} />
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {app.pdRate}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {app.suggestedAmount || app.requestedAmount}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/lender/applicant/${app.gigTrustId}`)}
                            icon={Eye}
                          >
                            View Profile
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                        No approved loans yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && approvedLoans.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Showing{' '}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {(currentPage - 1) * PAGE_SIZE + 1}
                  </span>
                  {'–'}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {Math.min(currentPage * PAGE_SIZE, approvedLoans.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-slate-700 dark:text-slate-200">{approvedLoans.length}</span>{' '}
                  approved loans
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
};

export default ApprovedLoans;
