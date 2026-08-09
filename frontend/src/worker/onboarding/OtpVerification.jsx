import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, CheckCircle2, RotateCcw, Edit2 } from 'lucide-react';
import { Button } from '../../components';

/**
 * OtpVerification component for Worker Onboarding.
 */
export const OtpVerification = ({ phone = '9876543210', onVerifyOtp, onChangePhone }) => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (error) setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setTimer(30);
    setOtp(['', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  };

  const handleFillDemoOtp = () => {
    setOtp(['4', '3', '2', '1']);
    setError('');
  };

  const handleVerify = () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 4) {
      setError('Please enter the complete 4-digit OTP');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onVerifyOtp(fullOtp);
    }, 700);
  };

  const formattedPhone = phone.replace(/(\d{5})(\d{5})/, '$1 $2');

  return (
    <div className="flex flex-col justify-between min-h-[85vh] p-6 max-w-md mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verify OTP</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Code sent to +91 {formattedPhone}</p>
            </div>
          </div>
          {onChangePhone && (
            <button
              onClick={onChangePhone}
              className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Change phone number"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* OTP Input Boxes */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-center gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-14 h-16 text-center text-2xl font-bold rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface dark:bg-slate-900 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all shadow-sm"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {error && <p className="text-xs font-medium text-danger text-center">{error}</p>}

          {/* Quick Demo Fill Helper */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleFillDemoOtp}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <span>Auto-fill Demo Code (4321)</span>
            </button>
          </div>
        </div>

        {/* Resend & Timer */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>Didn't receive code?</span>
          {timer > 0 ? (
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Resend in <span className="tabular-nums font-bold text-primary">{timer}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="font-bold text-primary hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resend OTP</span>
            </button>
          )}
        </div>
      </div>

      <div className="pt-6 pb-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full shadow-lg shadow-primary/20"
          onClick={handleVerify}
          isLoading={isLoading}
          icon={CheckCircle2}
        >
          Verify & Continue
        </Button>
      </div>
    </div>
  );
};

export default OtpVerification;
