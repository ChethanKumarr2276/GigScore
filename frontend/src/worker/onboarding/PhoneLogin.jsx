import React, { useState } from 'react';
import { Smartphone, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../../components';

/**
 * PhoneLogin component for Worker Onboarding.
 */
export const PhoneLogin = ({ onSubmitPhone, defaultPhone = '' }) => {
  const [phone, setPhone] = useState(defaultPhone);
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!agreed) {
      setError('Please accept the Terms & Privacy Policy to continue');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSubmitPhone(phone);
    }, 600);
  };

  return (
    <div className="flex flex-col justify-between min-h-[85vh] p-6 max-w-md mx-auto">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mobile Authentication</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Enter your phone number registered with gig platforms</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Mobile Number
            </label>
            <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface dark:bg-slate-900 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="px-3.5 py-3 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                <span>🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="98765 43210"
                className="w-full px-4 py-3 bg-transparent text-base font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 tracking-wider"
                autoFocus
              />
            </div>
            {error && <p className="text-xs font-medium text-danger mt-2">{error}</p>}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
            />
            <label htmlFor="terms" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed cursor-pointer">
              I agree to the <span className="text-primary font-semibold underline">Terms of Service</span> and consent to fetching my platform work data for credit score generation.
            </label>
          </div>
        </form>
      </div>

      <div className="pt-6 pb-2 space-y-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full shadow-lg shadow-primary/20"
          onClick={handleSubmit}
          isLoading={isLoading}
          icon={ArrowRight}
          iconPosition="right"
        >
          Send OTP
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <Lock className="w-3 h-3" />
          <span>256-bit SSL encrypted verification</span>
        </div>
      </div>
    </div>
  );
};

export default PhoneLogin;
