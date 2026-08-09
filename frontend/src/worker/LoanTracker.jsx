import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Sparkles,
  DollarSign,
  AlertCircle,
  X,
  Check,
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
 * LoanTracker component - Active Loan Tracker & Repayment Management for Gig Workers.
 */
export const LoanTracker = () => {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const loanDetails = {
    loanId: 'LN-2026-8812-KB',
    lenderName: 'KreditBee Financial Partners',
    disbursedAmount: '₹25,000',
    outstandingBalance: '₹9,000',
    totalRepaid: '₹16,000',
    nextEmiAmount: '₹1,125',
    nextDueDate: '15th August 2026',
    daysRemaining: 4,
    interestRate: '14.5% p.a.',
    tenure: '6 Months',
    completedEmis: 4,
    totalEmis: 6,

    schedule: [
      { emiNo: 1, dueDate: '15 Apr 2026', amount: '₹4,250', status: 'Paid', datePaid: '14 Apr 2026' },
      { emiNo: 2, dueDate: '15 May 2026', amount: '₹4,250', status: 'Paid', datePaid: '15 May 2026' },
      { emiNo: 3, dueDate: '15 Jun 2026', amount: '₹4,250', status: 'Paid', datePaid: '12 Jun 2026' },
      { emiNo: 4, dueDate: '15 Jul 2026', amount: '₹3,250', status: 'Paid', datePaid: '15 Jul 2026' },
      { emiNo: 5, dueDate: '15 Aug 2026', amount: '₹1,125', status: 'Due Soon', isNext: true },
      { emiNo: 6, dueDate: '15 Sep 2026', amount: '₹7,875', status: 'Upcoming' },
    ],
  };

  const handlePayEmi = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
    }, 1500);
  };

  const navItems = [
    { label: 'Dashboard', icon: TrendingUp, path: '/worker/dashboard' },
    { label: 'Loans', icon: CreditCard, path: '/worker/loans', badge: 'Active' },
    { label: 'Coach', icon: Sparkles, path: '/worker/coach' },
    { label: 'Profile', icon: ShieldCheck, path: '/worker/profile' },
  ];

  const repaymentPercentage = ((25000 - 9000) / 25000) * 100;

  return (
    <div className="min-h-screen bg-background text-slate-800 dark:bg-slate-950 dark:text-slate-100 pb-24 md:pb-8 transition-colors">
      <Header
        user={{ name: 'Rahul Sharma' }}
        notificationsCount={2}
        portalType="Loan Tracker"
        title="GigScore"
      />

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Page Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                GigScore Loan Tracker
              </h1>
              <StatusPill status="Active" customLabel="Active Credit Line" size="sm" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {loanDetails.lenderName} • Loan ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{loanDetails.loanId}</span>
            </p>
          </div>

          <Button
            variant="primary"
            icon={Zap}
            onClick={() => setShowPaymentModal(true)}
            className="shadow-lg shadow-primary/20"
          >
            Pay EMI ({loanDetails.nextEmiAmount})
          </Button>
        </div>

        {/* Active Loan Summary Card */}
        <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white border-slate-800 shadow-2xl p-6">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Disbursed Credit Amount</span>
                <p className="text-3xl font-extrabold text-white tracking-tight mt-0.5">{loanDetails.disbursedAmount}</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Remaining Balance</span>
                <p className="text-3xl font-extrabold text-emerald-400 tracking-tight mt-0.5">{loanDetails.outstandingBalance}</p>
              </div>
            </div>

            {/* Repayment Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Total Repaid: {loanDetails.totalRepaid}</span>
                <span className="text-emerald-400 font-bold">{Math.round(repaymentPercentage)}% Repaid</span>
              </div>
              <ProgressBar value={repaymentPercentage} color="success" height="lg" />
            </div>

            {/* Key Loan Terms Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Next Due Date</span>
                <span className="font-bold text-white mt-0.5 block">{loanDetails.nextDueDate}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">EMI Amount</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">{loanDetails.nextEmiAmount}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Interest Rate</span>
                <span className="font-bold text-white mt-0.5 block">{loanDetails.interestRate}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Loan Tenure</span>
                <span className="font-bold text-white mt-0.5 block">{loanDetails.tenure}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Upcoming Payment Alert Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-500 rounded-xl border border-amber-500/30 shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Upcoming EMI Payment</h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500 text-white rounded-full">
                  Due in {loanDetails.daysRemaining} Days
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Installment #{loanDetails.completedEmis + 1} of {loanDetails.totalEmis} ({loanDetails.nextEmiAmount}) due on {loanDetails.nextDueDate}.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowPaymentModal(true)}
            className="shrink-0 shadow-md"
          >
            Pay EMI Now
          </Button>
        </div>

        {/* Post-Repayment Score Impact Notice */}
        <Card className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border-emerald-500/30 p-5">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Post-Repayment Limit Upgrade Opportunity
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Paying this EMI on time will boost your Gig Reliability Score by <span className="font-bold text-emerald-400">+12 GRS points</span> and unlock an instant pre-approved credit limit upgrade up to <span className="font-bold text-emerald-400">₹35,000</span>.
              </p>
            </div>
          </div>
        </Card>

        {/* Repayment Schedule Timeline */}
        <Card
          title="Repayment Schedule Timeline"
          subtitle={`Installments Overview (${loanDetails.completedEmis} of ${loanDetails.totalEmis} Completed)`}
          className="p-6"
        >
          <div className="space-y-4">
            {loanDetails.schedule.map((item) => {
              const isPaid = item.status === 'Paid';
              const isDueSoon = item.isNext;

              return (
                <div
                  key={item.emiNo}
                  className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                    isDueSoon
                      ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 shadow-sm ring-1 ring-amber-500/30'
                      : isPaid
                      ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800 opacity-90'
                      : 'bg-surface dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isPaid
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : isDueSoon
                          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {isPaid ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : `#${item.emiNo}`}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          EMI Installment #{item.emiNo}
                        </h4>
                        {isPaid && <StatusPill status="Approved" customLabel="Paid" size="sm" />}
                        {isDueSoon && <StatusPill status="Pending" customLabel="Due Soon" size="sm" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Due: {item.dueDate} {item.datePaid && `• Paid on ${item.datePaid}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">{item.amount}</span>
                    {isDueSoon && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        Pay
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </main>

      {/* Payment Confirmation Drawer Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setPaymentSuccess(false);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            {paymentSuccess ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Payment Successful!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    EMI installment #{loanDetails.completedEmis + 1} ({loanDetails.nextEmiAmount}) has been verified.
                  </p>
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>GRS Score updated: +12 Points</span>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentSuccess(false);
                  }}
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm EMI Payment</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">UPI / Net Banking / Gig Escrow</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Installment</span>
                    <span className="font-semibold text-slate-900 dark:text-white">#5 of 6</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Due Amount</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{loanDetails.nextEmiAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Payment Gateway</span>
                    <span className="font-semibold text-emerald-500">Auto-Debit Escrow</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isProcessingPayment}
                  onClick={handlePayEmi}
                >
                  Authorize Payment ({loanDetails.nextEmiAmount})
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav
        activePath="/worker/loans"
        navItems={navItems}
        onNavigate={(path) => navigate(path)}
      />
    </div>
  );
};

export default LoanTracker;
