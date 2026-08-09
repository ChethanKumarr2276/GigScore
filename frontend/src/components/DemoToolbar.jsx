import React, { useState } from 'react';
import { Sliders, X, Check, Sparkles, UserCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { setActiveDemoProfile, getActiveDemoProfile } from '../services/api';
import { showToast } from './Toast';

/**
 * DemoToolbar component - Docked floating demo mode switcher widget.
 */
export const DemoToolbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeKey, setActiveKey] = useState(() => getActiveDemoProfile().id);

  const presets = [
    {
      id: 'high',
      name: 'Rahul Sharma',
      grs: 758,
      band: 'Reliable',
      pd: '2.8%',
      assessment: 'High Stability',
      color: 'emerald',
      icon: UserCheck,
    },
    {
      id: 'moderate',
      name: 'Vikram Patel',
      grs: 612,
      band: 'Moderate Risk',
      pd: '6.4%',
      assessment: 'Medium Stability',
      color: 'amber',
      icon: AlertTriangle,
    },
    {
      id: 'high_risk',
      name: 'Karthik Raja',
      grs: 520,
      band: 'High Risk',
      pd: '14.2%',
      assessment: 'Low / Flagged',
      color: 'red',
      icon: ShieldAlert,
    },
  ];

  const handleSelectPreset = (preset) => {
    setActiveKey(preset.id);
    setActiveDemoProfile(preset.id);
    showToast(
      `Switched Demo Profile to ${preset.name} (${preset.band} - GRS ${preset.grs})`,
      preset.id === 'high' ? 'success' : preset.id === 'moderate' ? 'warning' : 'error'
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Expanded Control Widget */}
      {isOpen && (
        <div className="mb-3 w-80 bg-slate-900 text-white border border-slate-700/80 rounded-3xl p-4 shadow-2xl space-y-3 animate-fade-in backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Demo Risk Profile Switcher</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Select a preset worker profile to simulate live credit scoring & underwriter policy responses across all views:
          </p>

          <div className="space-y-2">
            {presets.map((p) => {
              const isSelected = activeKey === p.id;
              const IconComp = p.icon;

              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-800 border-primary ring-2 ring-primary/30 shadow-lg'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl text-white ${
                        p.color === 'emerald'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : p.color === 'amber'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white">{p.name}</p>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                          GRS {p.grs}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {p.assessment} • PD {p.pd}
                      </p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full font-bold text-xs shadow-2xl border border-white/20 transition-all hover:scale-105 active:scale-95"
      >
        <Sliders className="w-4 h-4" />
        <span>{isOpen ? 'Close Presets' : 'Demo Presets'}</span>
      </button>
    </div>
  );
};

export default DemoToolbar;
