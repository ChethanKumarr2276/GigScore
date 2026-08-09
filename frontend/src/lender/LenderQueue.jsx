import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  ShieldCheck,
  Building2,
  Award,
  Layers,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';

import {
  Button,
  Card,
  ScoreBadge,
  StatusPill,
  Header,
  Sidebar,
} from '../components';
import { getApplicants } from '../services/api';

const PAGE_SIZE = 10;

/**
 * LenderQueue component - Underwriting Applicant Queue for Lenders.
 */
export const LenderQueue = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBand, setSelectedBand] = useState('ALL');
  const [selectedAssessment, setSelectedAssessment] = useState('ALL');
  const [sortBy, setSortBy] = useState('score_desc');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Real applicant data, fetched from the backend on mount.
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
        if (isMounted) {
          setApplicants(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('[LenderQueue] Failed to fetch /applicants:', error);
        if (isMounted) {
          setLoadError(
            'Could not load applicants from the backend. Check that the backend server is running and reachable.'
          );
          setApplicants([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchApplicants();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sidebar navigation items for Lender Portal
  const lenderNavItems = [
    { label: 'Applicant Queue', icon: Users, path: '/lender/queue', badge: `${applicants.length} New` },
    { label: 'Approved Loans', icon: CheckCircle2, path: '/lender/approved', badge: `${applicants.filter((a) => a.status === 'Approved').length}` },
    { label: 'Rejected Loans', icon: XCircle, path: '/lender/rejected', badge: `${applicants.filter((a) => a.status === 'Rejected').length}` },
    { label: 'Portfolio Analytics', icon: TrendingUp, path: '/lender/analytics' },
    { label: 'Risk Parameters', icon: ShieldCheck, path: '/lender/parameters' },
  ];

  // Build the GRS Band filter options dynamically from whatever bands
  // actually appear in the real data, instead of hardcoding band names
  // that may not match the backend's taxonomy (e.g. PRIME, STRONG).
  const availableBands = useMemo(() => {
    const bands = new Set(applicants.map((app) => app.grsBand).filter(Boolean));
    return Array.from(bands).sort();
  }, [applicants]);

  // Filtering & Sorting Logic
  const filteredApplicants = useMemo(() => {
    return applicants
      .filter((app) => {
        const matchesSearch =
          app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.gigTrustId.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesBand = selectedBand === 'ALL' || app.grsBand === selectedBand;
        const matchesAssessment =
          selectedAssessment === 'ALL' || app.financialAssessment === selectedAssessment;

        return matchesSearch && matchesBand && matchesAssessment;
      })
      .sort((a, b) => {
        if (sortBy === 'score_desc') return b.grsScore - a.grsScore;
        if (sortBy === 'score_asc') return a.grsScore - b.grsScore;
        if (sortBy === 'pd_asc') return parseFloat(a.pdRate) - parseFloat(b.pdRate);
        if (sortBy === 'amount_desc')
          return (
            parseInt(b.requestedAmount.replace(/\D/g, ''), 10) -
            parseInt(a.requestedAmount.replace(/\D/g, ''), 10)
          );
        return 0;
      });
  }, [applicants, searchTerm, selectedBand, selectedAssessment, sortBy]);

  // Reset to page 1 whenever the filtered result set changes
  // (new search term, new filter, new sort) so the user doesn't
  // get stranded on an empty page.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBand, selectedAssessment, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / PAGE_SIZE));

  const paginatedApplicants = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredApplicants.slice(start, start + PAGE_SIZE);
  }, [filteredApplicants, currentPage]);

  const goToPage = (page) => {
    const clamped = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(clamped);
  };

  return (
    <div className="min-h-screen bg-background text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex transition-colors">
      {/* Desktop Sidebar Navigation */}
      <Sidebar
        activePath="/lender/queue"
        navItems={lenderNavItems}
        user={{ name: 'KreditBee Underwriting Team', email: 'underwriting@kreditbee.in' }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigate={(path) => navigate(path)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar with Dark Mode Switcher */}
        <Header
          user={{ name: 'KreditBee Admin' }}
          notificationsCount={5}
          portalType="Lender Portal"
          title="GigScore Underwriting"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Page Title & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
                <span>Lender Underwriting Portal</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                  Queue Active
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Assess real-time GRS scores, alternative credit indicators, and risk profiles for gig worker loan applications.
              </p>
            </div>
          </div>

          {/* Load error banner */}
          {loadError && (
            <Card className="p-4 border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                {loadError}
              </div>
            </Card>
          )}

          {/* Key Metrics Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Applicants</p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {applicants.length}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/20">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Live from backend</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Approval Rate</p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {applicants.length > 0
                      ? `${Math.round(
                          (applicants.filter((a) => a.status === 'Approved').length / applicants.length) * 100
                        )}%`
                      : '—'}
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Of decisioned applicants</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average GRS Score</p>
                  <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                    {applicants.length > 0
                      ? Math.round(
                          applicants.reduce((sum, a) => sum + (a.grsScore || 0), 0) / applicants.length
                        )
                      : '—'}
                  </p>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Across current queue</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Review</p>
                  <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                    {applicants.filter((a) => a.status === 'Pending').length}
                  </p>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Requires underwriter decision</p>
            </Card>
          </div>

          {/* Filter & Search Toolbar */}
          <Card className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by GigTrust ID or Applicant Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              {/* Filters & Sorting Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* GRS Band Filter - options built dynamically from real data */}
                <select
                  value={selectedBand}
                  onChange={(e) => setSelectedBand(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="ALL">All GRS Bands</option>
                  {availableBands.map((band) => (
                    <option key={band} value={band}>
                      {band}
                    </option>
                  ))}
                </select>

                {/* Financial Assessment Filter */}
                <select
                  value={selectedAssessment}
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="ALL">All Stability Grades</option>
                  <option value="Exceptional">Exceptional Stability</option>
                  <option value="Very High">Very High Stability</option>
                  <option value="High">High Stability</option>
                  <option value="Medium">Medium Stability</option>
                  <option value="Low">Low Stability</option>
                </select>

                {/* Sort Selector */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="score_desc">Sort: Highest GRS Score</option>
                  <option value="score_asc">Sort: Lowest GRS Score</option>
                  <option value="pd_asc">Sort: Lowest PD %</option>
                  <option value="amount_desc">Sort: Highest Loan Amount</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Applicant Queue Table */}
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">GigTrust ID & Applicant</th>
                    <th className="px-4 py-3.5">Platforms</th>
                    <th className="px-4 py-3.5">GRS Score & Band</th>
                    <th className="px-4 py-3.5">Assessment</th>
                    <th className="px-4 py-3.5">PD %</th>
                    <th className="px-4 py-3.5">Requested / Suggested</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                        Loading applicants...
                      </td>
                    </tr>
                  ) : paginatedApplicants.length > 0 ? (
                    paginatedApplicants.map((app) => (
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* GigTrust ID & Applicant */}
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {app.name}
                          </div>
                          <div className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                            {app.gigTrustId}
                          </div>
                        </td>

                        {/* Primary Platform */}
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {app.primaryPlatform}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {app.platformsCount} connected platform{app.platformsCount > 1 ? 's' : ''}
                          </div>
                        </td>

                        {/* GRS Score & Band Badge */}
                        <td className="px-4 py-4">
                          <ScoreBadge score={app.grsScore} band={app.grsBand} size="sm" showLabel={true} />
                        </td>

                        {/* Financial Assessment Grade */}
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              app.financialAssessment === 'Exceptional' || app.financialAssessment === 'Very High' || app.financialAssessment === 'High'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                : app.financialAssessment === 'Medium'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                            }`}
                          >
                            {app.financialAssessment} Stability
                          </span>
                        </td>

                        {/* Probability of Default (PD %) */}
                        <td className="px-4 py-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {app.pdRate}
                        </td>

                        {/* Requested vs Suggested Amount */}
                        <td className="px-4 py-4">
                          <div className="font-extrabold text-slate-900 dark:text-white">
                            {app.requestedAmount}
                          </div>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Limit: {app.suggestedAmount}
                          </div>
                        </td>

                        {/* Status Pill */}
                        <td className="px-4 py-4">
                          <StatusPill status={app.status} size="sm" />
                        </td>

                        {/* Action Trigger */}
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/lender/applicant/${app.gigTrustId}`)}
                            icon={Eye}
                          >
                            Review Profile
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                        No applicants match the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!isLoading && filteredApplicants.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Showing{' '}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {(currentPage - 1) * PAGE_SIZE + 1}
                  </span>
                  {'–'}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {Math.min(currentPage * PAGE_SIZE, filteredApplicants.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {filteredApplicants.length}
                  </span>{' '}
                  applicants
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Previous page"
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
                    aria-label="Next page"
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

export default LenderQueue;
