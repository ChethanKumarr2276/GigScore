import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import WorkerOnboarding from './worker/WorkerOnboarding';
import WorkerDashboard from './worker/WorkerDashboard';
import AssessmentDetail from './worker/AssessmentDetail';
import FinancialCoach from './worker/FinancialCoach';
import LoanTracker from './worker/LoanTracker';
import LenderQueue from './lender/LenderQueue';
import ApplicantDetail from './lender/ApplicantDetail';
import PortfolioAnalytics from './lender/PortfolioAnalytics';
import ApprovedLoans from './lender/ApprovedLoans';
import RejectedLoans from './lender/RejectedLoans';
import RiskParameters from './lender/RiskParameters';
import {
  Button,
  Card,
  Header,
  Sidebar,
  BottomNav,
  DemoToolbar,
  Toast,
} from './components';
import { LayoutDashboard, Users, Wallet, Smartphone, FileText, Lightbulb, CreditCard, Building2, Eye } from 'lucide-react';

function DesignSystemShowcase() {
  const [activeTab, setActiveTab] = useState('/showcase');
  const navigate = useNavigate();

  const navItems = [
    { label: 'Landing Hub', icon: LayoutDashboard, path: '/' },
    { label: 'Lender Queue', icon: Building2, path: '/lender/queue', badge: 'Underwriting' },
    { label: 'SHAP Review', icon: Eye, path: '/lender/applicant/GT-MHF-2305-YNKMX-G' },
    { label: 'Worker Dashboard', icon: Wallet, path: '/worker/dashboard', badge: 'Active' },
    { label: 'Loan Tracker', icon: CreditCard, path: '/worker/loans', badge: 'Due Soon' },
    { label: 'AI Financial Coach', icon: Lightbulb, path: '/worker/coach', badge: '+35 pts' },
    { label: 'Score Assessment', icon: FileText, path: '/worker/assessment' },
    { label: 'Onboarding', icon: Smartphone, path: '/worker/onboarding' },
  ];

  return (
    <div className="min-h-screen bg-background text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col md:flex-row transition-colors">
      <Sidebar
        activePath={activeTab}
        navItems={navItems}
        user={{ name: 'KreditBee Team', email: 'underwriting@kreditbee.in' }}
        onNavigate={(path) => {
          if (path.startsWith('/worker/') || path.startsWith('/lender/') || path === '/') {
            navigate(path);
          } else {
            setActiveTab(path);
          }
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <Header
          user={{ name: 'KreditBee Admin' }}
          notificationsCount={5}
          portalType="GigScore Hub"
        />

        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                GigScore Component Showcase
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Design System & Component Library Overview.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                icon={Eye}
                onClick={() => navigate('/lender/applicant/GT-MHF-2305-YNKMX-G')}
              >
                SHAP Underwriting Review
              </Button>
              <Button
                variant="outline"
                icon={Building2}
                onClick={() => navigate('/lender/queue')}
              >
                Lender Queue
              </Button>
            </div>
          </div>
        </main>
      </div>

      <BottomNav
        activePath={activeTab}
        navItems={navItems}
        onNavigate={(path) => {
          if (path.startsWith('/worker/') || path.startsWith('/lender/') || path === '/') {
            navigate(path);
          } else {
            setActiveTab(path);
          }
        }}
      />
    </div>
  );
}

function OnboardingWrapper() {
  const navigate = useNavigate();
  return (
    <WorkerOnboarding
      onCompleteOnboarding={(data) => {
        console.log('Onboarding Complete:', data);
        navigate('/worker/dashboard');
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toast />
      <DemoToolbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/showcase" element={<DesignSystemShowcase />} />
        <Route path="/worker/onboarding" element={<OnboardingWrapper />} />
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/worker/assessment" element={<AssessmentDetail />} />
        <Route path="/worker/coach" element={<FinancialCoach />} />
        <Route path="/worker/loans" element={<LoanTracker />} />
        <Route path="/lender" element={<LenderQueue />} />
        <Route path="/lender/queue" element={<LenderQueue />} />
        <Route path="/lender/approved" element={<ApprovedLoans />} />
        <Route path="/lender/rejected" element={<RejectedLoans />} />
        <Route path="/lender/analytics" element={<PortfolioAnalytics />} />
        <Route path="/lender/parameters" element={<RiskParameters />} />
        <Route path="/lender/applicant" element={<ApplicantDetail />} />
        <Route path="/lender/applicant/:id" element={<ApplicantDetail />} />
        <Route path="/lender/review/:id" element={<ApplicantDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
