import React, { useState } from 'react';
import { Languages, Check, ArrowRight } from 'lucide-react';
import { Button, Card } from '../../components';

/**
 * LanguageSelect component for Worker Onboarding.
 */
export const LanguageSelect = ({ onSelectLanguage, initialLanguage = 'en' }) => {
  const [selected, setSelected] = useState(initialLanguage);

  const languages = [
    { id: 'en', name: 'English', native: 'English', subtitle: 'Default Language' },
    { id: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', subtitle: 'Karnataka Region' },
    { id: 'hi', name: 'Hindi', native: 'हिन्दी', subtitle: 'North & Central India' },
    { id: 'ta', name: 'Tamil', native: 'தமிழ்', subtitle: 'Tamil Nadu Region' },
  ];

  const handleContinue = () => {
    onSelectLanguage(selected);
  };

  return (
    <div className="flex flex-col justify-between min-h-[85vh] p-6 max-w-md mx-auto">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Select Language</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose your preferred language for the app</p>
          </div>
        </div>

        <div className="grid gap-3">
          {languages.map((lang) => {
            const isSelected = selected === lang.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => setSelected(lang.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                  isSelected
                    ? 'bg-primary/5 dark:bg-primary/10 border-primary shadow-sm ring-1 ring-primary'
                    : 'bg-surface dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {lang.id.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                      {lang.native} <span className="text-xs text-slate-400 font-normal">({lang.name})</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{lang.subtitle}</p>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-primary border-primary text-white'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-6 pb-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleContinue}
          icon={ArrowRight}
          iconPosition="right"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default LanguageSelect;
