/**
 * GigScore Backend API Integration Layer
 * Base API Service with Demo Mode Profile Switching & Schema Validation.
 */

import { validateGigScoreContract } from './contractValidator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Demo Mode Profiles matching Locked Roadmap v1.0 Schema
 */
export const DEMO_PROFILES = {
  high: {
    id: 'high',
    name: 'Rahul Sharma',
    gigtrust_id: 'GT-MHF-2305-YNKMX-G',
    grs: 758,
    grs_band: 'RELIABLE',
    financial_assessment: 'High',
    pd: 0.028,
    p_approve: 0.91,
    max_amount: 32000,
    interest_rate: 14.5,
    evidence_quality: 'High',
    top_5_reasons: [
      'Stable monthly income aggregate',
      'Low income volatility across linked platforms',
      'Strong historical repayment discipline',
      'High active-day ratio (>82%)',
      'Zero fraud flags or platform discrepancies',
    ],
    fraud_flag: false,
  },
  moderate: {
    id: 'moderate',
    name: 'Vikram Patel',
    gigtrust_id: 'GT-MHF-8821-MOD-G',
    grs: 612,
    grs_band: 'MODERATE_RISK',
    financial_assessment: 'Medium',
    pd: 0.064,
    p_approve: 0.64,
    max_amount: 18000,
    interest_rate: 18.0,
    evidence_quality: 'Medium',
    top_5_reasons: [
      'Multi-platform activity across 2 apps',
      'Moderate income fluctuations',
      'Acceptable debt-to-income ratio (<28%)',
      'Good active working day frequency',
      'No major default history',
    ],
    fraud_flag: false,
  },
  high_risk: {
    id: 'high_risk',
    name: 'Karthik Raja',
    gigtrust_id: 'GT-MHF-5510-RISK-G',
    grs: 520,
    grs_band: 'HIGH_RISK',
    financial_assessment: 'Low',
    pd: 0.142,
    p_approve: 0.32,
    max_amount: 8000,
    interest_rate: 24.5,
    evidence_quality: 'Low',
    top_5_reasons: [
      'Single platform dependency risk',
      'High monthly debt burden (>35%)',
      'Frequent income drops',
      'Low active working days (<50%)',
      'Mild platform discrepancy flag',
    ],
    fraud_flag: true,
  },
};

let currentProfileKey = 'high';

export function getActiveDemoProfile() {
  return DEMO_PROFILES[currentProfileKey];
}

export function setActiveDemoProfile(key) {
  if (DEMO_PROFILES[key]) {
    currentProfileKey = key;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gigscore:profile-changed', { detail: DEMO_PROFILES[key] }));
    }
    return DEMO_PROFILES[key];
  }
  return DEMO_PROFILES.high;
}

/**
 * Generic API request handler with timeout, schema validation & fallback support.
 */
async function apiRequest(endpoint, options = {}, mockFallback = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (endpoint.includes('/score')) {
      const validation = validateGigScoreContract(json);
      if (!validation.isValid) {
        console.warn('[GigScore Contract Validator] Received payload failed contract schema:', validation.errors);
      }
    }

    return json;
  } catch (error) {
    clearTimeout(timeoutId);

    if (mockFallback !== null) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const payload = typeof mockFallback === 'function' ? mockFallback() : mockFallback;

      if (endpoint.includes('/score')) {
        const validation = validateGigScoreContract(payload);
        if (!validation.isValid) {
          console.warn('[GigScore Contract Validator] Mock fallback failed contract validation:', validation.errors);
        }
      }

      return payload;
    }

    throw error;
  }
}

export async function postIdentity(identityPayload) {
  return apiRequest(
    '/identity',
    {
      method: 'POST',
      body: JSON.stringify(identityPayload),
    },
    {
      status: 'success',
      gigTrustId: identityPayload.gigTrustId || getActiveDemoProfile().gigtrust_id,
      message: 'Worker identity registered successfully.',
    }
  );
}

export async function ingestCSV(formData) {
  return apiRequest(
    '/ingest/csv',
    {
      method: 'POST',
      headers: {},
      body: formData,
    },
    {
      status: 'success',
      recordsProcessed: 42,
      platformsDetected: ['Uber', 'Zomato', 'Swiggy', 'Porter'],
      message: 'Platform earnings CSV ingested successfully.',
    }
  );
}

export async function getWorkerProfile(workerId) {
  const profile = getActiveDemoProfile();
  return apiRequest(
    `/worker/${workerId || profile.gigtrust_id}`,
    { method: 'GET' },
    {
      workerId: profile.gigtrust_id,
      name: profile.name,
      gigTrustId: profile.gigtrust_id,
      category: 'Ride-Hailing & Delivery Driver',
      location: 'Bengaluru, KA',
      status: profile.fraud_flag ? 'Flagged' : 'Verified',
      primaryPlatform: 'Uber Rides',
      linkedPlatforms: [
        { id: 'uber', name: 'Uber Rides', earnings: '₹14,200', syncStatus: 'Synced 2h ago', icon: '🚗' },
        { id: 'zomato', name: 'Zomato Delivery', earnings: '₹9,850', syncStatus: 'Synced 1h ago', icon: '🍕' },
        { id: 'swiggy', name: 'Swiggy Instamart', earnings: '₹7,400', syncStatus: 'Synced 4h ago', icon: '🛒' },
        { id: 'porter', name: 'Porter Logistics', earnings: '₹5,600', syncStatus: 'Synced 12h ago', icon: '📦' },
      ],
    }
  );
}

export async function getScoreDetails(workerId) {
  const activeProfile = getActiveDemoProfile();
  return apiRequest(
    `/score/${workerId || activeProfile.gigtrust_id}`,
    { method: 'GET' },
    activeProfile
  );
}

/**
 * Submit an underwriting decision.
 * Deliberately has NO mock fallback: decisions are high-stakes actions, and a
 * silent fake success would be actively misleading (an underwriter could
 * believe a decision was recorded when it wasn't). Failures must be visible.
 */
export async function postDecision(decisionPayload) {
  return apiRequest('/decision', {
    method: 'POST',
    body: JSON.stringify(decisionPayload),
  });
}

/**
 * Fetch the real applicant queue for the Lender Portal.
 * Deliberately has NO mock fallback: if this fails, we want it to fail
 * loudly (visible error state in the UI) rather than silently showing
 * fake applicants, which would be misleading during testing/demo.
 */
export async function getApplicants() {
  return apiRequest('/applicants', { method: 'GET' });
}
