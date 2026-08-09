import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { SplashScreen } from './onboarding/SplashScreen';
import { LanguageSelect } from './onboarding/LanguageSelect';
import { PhoneLogin } from './onboarding/PhoneLogin';
import { OtpVerification } from './onboarding/OtpVerification';
import { WelcomeScreen } from './onboarding/WelcomeScreen';

/**
 * WorkerOnboarding main controller managing step transitions (0..4).
 */
export const WorkerOnboarding = ({ onCompleteOnboarding }) => {
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState('en');
  const [phone, setPhone] = useState('');
  const [gigTrustId, setGigTrustId] = useState('');

  // Generate random GigTrust ID
  const generateGigTrustId = () => {
    const randPart = Math.random().toString(36).substring(2, 7).toUpperCase();
    const datePart = new Date().getFullYear();
    return `GT-MHF-${datePart}-${randPart}-G`;
  };

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 4));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleLanguageSubmit = (selectedLang) => {
    setLanguage(selectedLang);
    handleNext();
  };

  const handlePhoneSubmit = (phoneNum) => {
    setPhone(phoneNum);
    handleNext();
  };

  const handleOtpVerify = (otpCode) => {
    const newId = generateGigTrustId();
    setGigTrustId(newId);
    handleNext();
  };

  const handleFinish = () => {
    if (onCompleteOnboarding) {
      onCompleteOnboarding({ language, phone, gigTrustId });
    }
  };

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between">
      {/* Top Stepper Header (hidden on Splash and Welcome screens) */}
      {step > 0 && step < 4 && (
        <header className="w-full max-w-md mx-auto p-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s
                    ? 'w-6 bg-primary'
                    : step > s
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-slate-300 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>

          <div className="w-9" /> {/* Spacer for alignment */}
        </header>
      )}

      {/* Screen Render based on Step */}
      <main className="flex-1 flex items-center justify-center">
        {step === 0 && <SplashScreen onGetStarted={handleNext} />}
        {step === 1 && (
          <LanguageSelect
            onSelectLanguage={handleLanguageSubmit}
            initialLanguage={language}
          />
        )}
        {step === 2 && (
          <PhoneLogin
            onSubmitPhone={handlePhoneSubmit}
            defaultPhone={phone}
          />
        )}
        {step === 3 && (
          <OtpVerification
            phone={phone}
            onVerifyOtp={handleOtpVerify}
            onChangePhone={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <WelcomeScreen
            gigTrustId={gigTrustId || 'GT-MHF-2305-YNKMX-G'}
            onGoToDashboard={handleFinish}
          />
        )}
      </main>
    </div>
  );
};

export default WorkerOnboarding;
