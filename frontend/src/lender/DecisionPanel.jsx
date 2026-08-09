import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  ShieldCheck,
  Percent,
  X,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  ArrowRight,
} from 'lucide-react';
import { Card, StatusPill } from '../components';
import { postDecision } from '../services/api';

/**
 * DecisionPanel component - Interactive Underwriter Decision & Automated Policy Engine.
 * Approve and Reject are always-visible actions (no tab switching required).
 * Policy rules are computed from the real ML pillar_scores returned by /score.
 */
export const DecisionPanel = ({
  applicant = {
    name: 'Rahul Sharma',
    gigTrustId: 'GT-MHF-2026-YNKMX-G',
    grsScore: 758,
    requestedAmount: 25000,
    maxRecommended: 32000,
    pillarScores: { earning: 0.5, continuity: 0.5, service: 0.5, financial: 0.5, integrity: 0.5 },
    fraudFlag: false,
    platformsCount: 1,
  },
  onDecisionSubmitted,
}) => {
  const [approvedAmount, setApprovedAmount] = useState(applicant.requestedAmount || 25000);
  const [interestRate, setInterestRate] = useState(14.5);
  const [tenureMonths, setTenureMonths] = useState(6);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState(null);
  const [underwriterNotes, setUnderwriterNotes] = useState(
    'Approved based on multi-platform income stability across Uber & Zomato, 83% active-day ratio, and 100% historical EMI repayment discipline.'
  );

  const [submittingAction, setSubmittingAction] = useState(null); // 'APPROVE' | 'REJECT' | 'REFER' | null
  const [successFlash, setSuccessFlash] = useState(null); // 'APPROVE' | 'REJECT' | 'REFER' | null
  const [submittedAuditLog, setSubmittedAuditLog] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Automated Policy Engine Rule Checks — derived from the ML pipeline's
  // real 5 pillar scores (earning, continuity, service, financial, integrity).
  const pillarScores = applicant.pillarScores || {};
  const fraudFlag = !!applicant.fraudFlag;
  const platformsCount = applicant.platformsCount ?? 1;
  const PASS_THRESHOLD = 0.5;

  const pct = (v) => `${Math.round((v ?? 0) * 100)}%`;

  const policyRules = [
    {
      id: 1,
      rule: 'Income Stability (earning pillar)',
      val: pct(pillarScores.earning),
      status: (pillarScores.earning ?? 0) >= PASS_THRESHOLD ? 'pass' : 'fail',
    },
    {
      id: 2,
      rule: 'Platform Continuity & Multi-Homing',
      val: `${platformsCount} Feed${platformsCount !== 1 ? 's' : ''} · ${pct(pillarScores.continuity)}`,
      status: (pillarScores.continuity ?? 0) >= PASS_THRESHOLD ? 'pass' : 'fail',
    },
    {
      id: 3,
      rule: 'Service Quality (service pillar)',
      val: pct(pillarScores.service),
      status: (pillarScores.service ?? 0) >= PASS_THRESHOLD ? 'pass' : 'fail',
    },
    {
      id: 4,
      rule: 'Financial Health (financial pillar)',
      val: pct(pillarScores.financial),
      status: (pillarScores.financial ?? 0) >= PASS_THRESHOLD ? 'pass' : 'fail',
    },
    {
      id: 5,
      rule: 'Zero Fraud Flag (integrity pillar)',
      val: fraudFlag ? 'Fraud Flag Raised' : `Clean · ${pct(pillarScores.integrity)}`,
      status: fraudFlag ? 'fail' : (pillarScores.integrity ?? 0) >= PASS_THRESHOLD ? 'pass' : 'fail',
    },
  ];

  const passedCount = policyRules.filter((r) => r.status === 'pass').length;

  const submitDecision = async (action) => {
    if (action === 'REJECT' && !rejectReason) {
      setRejectError('Please select a decline reason before submitting.');
      return;
    }
    setRejectError(null);
    setSubmitError(null);
    setSubmittingAction(action);

    const auditPayload = {
      underwriterId: 'UW-KB-8821',
      applicantId: applicant.gigTrustId,
      applicantName: applicant.name,
      decisionAction: action,
      finalTerms:
        action === 'APPROVE'
          ? {
              approvedAmount: `₹${approvedAmount.toLocaleString('en-IN')}`,
              interestRate: `${interestRate}% p.a.`,
              tenure: `${tenureMonths} Months`,
            }
          : null,
      notes: action === 'REJECT' ? rejectReason : underwriterNotes,
      policyOutcome: `${passedCount}/5 Automated Rules Passed`,
    };

    // The backend's /decision endpoint only accepts APPROVE or REJECT
    // (schema: { gigtrust_id, decision, sanctioned_amount, officer }).
    // "Refer to Senior UW" has no backend support, so it's recorded locally only.
    if (action === 'REFER') {
      const finalLog = {
        ...auditPayload,
        decisionId: `LOCAL-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toISOString(),
        persisted: false,
      };
      setSuccessFlash('REFER');
      setTimeout(() => {
        setSubmittingAction(null);
        setSubmittedAuditLog(finalLog);
        if (onDecisionSubmitted) onDecisionSubmitted(finalLog);
      }, 900);
      return;
    }

    const backendPayload = {
      gigtrust_id: applicant.gigTrustId,
      decision: action,
      sanctioned_amount: action === 'APPROVE' ? approvedAmount : null,
      officer: 'UW-KB-8821',
    };

    try {
      const response = await postDecision(backendPayload);

      const finalLog = {
        ...auditPayload,
        decisionId: response.decision_id || `DEC-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toISOString(),
        persisted: true,
      };

      setSuccessFlash(action);
      setTimeout(() => {
        setSubmittingAction(null);
        setSubmittedAuditLog(finalLog);
        if (onDecisionSubmitted) onDecisionSubmitted(finalLog);
      }, 900);
    } catch (err) {
      console.error('Failed to submit decision via API:', err);
      setSubmittingAction(null);
      setSubmitError(
        `Could not save this ${action.toLowerCase()} decision to the backend. Check that the server is running and try again.`
      );
    }
  };

  const closeModal = () => {
    setSubmittedAuditLog(null);
    setSuccessFlash(null);
  };

  const isBusy = submittingAction !== null;

  return (
    <Card className="p-6 bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Underwriter Decision Control Panel</h3>
            <StatusPill status="Active" customLabel="Policy Engine Ready" size="sm" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Review terms & decline reason below, then submit a decision.
          </p>
        </div>
      </div>

      {/* Automated Policy Checks Grid — computed from real ML pillar scores */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Automated Underwriting Policy Rules ({passedCount}/5 Passed)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {policyRules.map((rule) => (
            <div
              key={rule.id}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-2"
            >
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-tight">{rule.rule}</p>
                <p
                  className={`text-xs font-bold ${
                    rule.status === 'pass'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {rule.val}
                </p>
              </div>
              {rule.status === 'pass' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Approve Terms Panel — always visible */}
      <div className="space-y-5 p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
        <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          <span>Credit Approval Terms</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Approved Loan Amount</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                ₹{approvedAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={applicant.maxRecommended || 32000}
              step={1000}
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Min: ₹5,000</span>
              <span>Max Rec: ₹{(applicant.maxRecommended || 32000).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Custom Interest Rate (% p.a.)
            </label>
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-surface dark:bg-slate-800 overflow-hidden px-3 py-2">
              <Percent className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="number"
                step="0.1"
                min="8"
                max="36"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tenure (Months)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[3, 6, 9, 12].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTenureMonths(m)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    tenureMonths === m
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-surface dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decline Reason Panel — always visible */}
      <div className="space-y-3 p-5 rounded-2xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20">
        <label className="block text-xs font-bold text-red-500 uppercase tracking-wider">
          Decline Reason & Adverse Action Category
        </label>
        <select
          value={rejectReason}
          onChange={(e) => {
            setRejectReason(e.target.value);
            if (e.target.value) setRejectError(null);
          }}
          className="w-full p-3 bg-surface dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
        >
          <option value="">Select Primary Decline Reason...</option>
          <option value="High Debt Burden Ratio (>30%)">High Debt Burden Ratio (&gt;30%)</option>
          <option value="Insufficient Platform Activity Days (<50%)">Insufficient Platform Activity Days (&lt;50%)</option>
          <option value="Single Platform Dependency Risk">Single Platform Dependency Risk</option>
          <option value="Platform Discrepancy Flag">Platform Discrepancy Flag</option>
        </select>
        <p className="text-[10px] text-slate-400">Only required if you click "Decline Application" below.</p>
        {rejectError && (
          <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {rejectError}
          </p>
        )}
      </div>

      {/* Reason & Underwriter Justification Notes */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Underwriter Justification & Decision Audit Notes
        </label>
        <textarea
          rows={3}
          value={underwriterNotes}
          onChange={(e) => setUnderwriterNotes(e.target.value)}
          placeholder="Enter underwriter comments and rationale..."
          className="w-full p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Submit error banner */}
      {submitError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {submitError}
        </div>
      )}

      {/* Action Buttons — Approve and Reject always visible side by side, Refer as a smaller tertiary option */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => submitDecision('REFER')}
          className="order-3 sm:order-1 px-4 py-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {successFlash === 'REFER' ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Referred!
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              Refer to Senior UW
            </>
          )}
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => submitDecision('REJECT')}
          className={`order-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
            successFlash === 'REJECT'
              ? 'bg-red-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white disabled:opacity-60'
          }`}
        >
          {submittingAction === 'REJECT' && successFlash !== 'REJECT' ? (
            <>Submitting...</>
          ) : successFlash === 'REJECT' ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Rejected!
            </>
          ) : (
            <>
              <ThumbsDown className="w-4 h-4" />
              Reject
            </>
          )}
        </button>

        <button
          type="button"
          disabled={isBusy}
          onClick={() => submitDecision('APPROVE')}
          className={`order-1 sm:order-3 px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed ${
            successFlash === 'APPROVE'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-60'
          }`}
        >
          {submittingAction === 'APPROVE' && successFlash !== 'APPROVE' ? (
            <>Submitting...</>
          ) : successFlash === 'APPROVE' ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Approved!
            </>
          ) : (
            <>
              <ThumbsUp className="w-4 h-4" />
              Approve
            </>
          )}
        </button>
      </div>

      {/* Decision Audit Log Modal Confirmation */}
      {submittedAuditLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    submittedAuditLog.decisionAction === 'REJECT'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Decision Audit Log Created</h3>
                  <p className="text-xs text-slate-400 font-mono">{submittedAuditLog.decisionId}</p>
                  {submittedAuditLog.persisted === false && (
                    <p className="text-[10px] text-amber-500 font-semibold mt-0.5">
                      Local record only — not saved to backend (Refer decisions aren't supported yet)
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Action:</span>
                <span
                  className={`font-bold ${
                    submittedAuditLog.decisionAction === 'REJECT' ? 'text-red-500' : 'text-emerald-500'
                  }`}
                >
                  {submittedAuditLog.decisionAction}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Underwriter ID:</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{submittedAuditLog.underwriterId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Applicant:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{submittedAuditLog.applicantName}</span>
              </div>
              {submittedAuditLog.finalTerms && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Approved Amount:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{submittedAuditLog.finalTerms.approvedAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Interest / Tenure:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {submittedAuditLog.finalTerms.interestRate} | {submittedAuditLog.finalTerms.tenure}
                    </span>
                  </div>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Audit Justification:</span>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 italic">{submittedAuditLog.notes}</p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
            >
              Close Audit Record
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DecisionPanel;
