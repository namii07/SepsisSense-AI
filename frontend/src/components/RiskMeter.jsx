import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function RiskMeter({ probability = 0, threshold = 0.40, category = 'Low Risk' }) {
  const percentage = Math.round(probability * 100 * 10) / 10;
  
  // Color configuration
  const isHigh = percentage >= 50;
  const isModerate = percentage >= 30 && percentage < 50;
  const isLow = percentage < 30;

  const currentTheme = isHigh
    ? {
        text: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: AlertCircle,
        label: 'High Risk (Sepsis Positive)',
      }
    : isModerate
    ? {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: AlertTriangle,
        label: 'Moderate Risk (Observation Required)',
      }
    : {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: CheckCircle2,
        label: 'Low Risk (Sepsis Negative)',
      };

  const Icon = currentTheme.icon;

  return (
    <div className={`p-5 rounded-xl border ${currentTheme.border} ${currentTheme.bg} transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
            Model Estimated Sepsis Likelihood
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-4xl font-extrabold tracking-tight ${currentTheme.text}`}>
              {percentage}%
            </span>
            <div className={`px-2.5 py-1 rounded-md border text-xs font-semibold flex items-center gap-1.5 ${currentTheme.badge}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{category}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block">Classification Threshold</span>
          <span className="text-sm font-semibold text-cyan-400">
            {Math.round(threshold * 100)}% (Experimental)
          </span>
        </div>
      </div>

      {/* Visual Segmented Progress Bar */}
      <div className="relative pt-2 pb-1">
        {/* Track Bar with 3 segments */}
        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div className="w-[30%] bg-emerald-500/60" title="Low Risk Zone (0-30%)" />
          <div className="w-[20%] bg-amber-500/70" title="Moderate Risk Zone (30-50%)" />
          <div className="w-[50%] bg-rose-500/70" title="High Risk Zone (50-100%)" />
        </div>

        {/* Current Probability Indicator Marker */}
        <div 
          className="absolute top-1 transform -translate-x-1/2 transition-all duration-500 ease-out flex flex-col items-center"
          style={{ left: `${Math.min(Math.max(percentage, 2), 98)}%` }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-slate-900" />
          <div className="w-0.5 h-4 bg-white/70" />
        </div>

        {/* Threshold Reference Indicator Line */}
        <div 
          className="absolute top-1 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
          style={{ left: `${threshold * 100}%` }}
        >
          <div className="w-0.5 h-6 bg-cyan-400 z-10" />
        </div>
      </div>

      {/* Bar Legend Labels */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
        <span>0%</span>
        <span className="text-emerald-400">Low (&lt;30%)</span>
        <span className="text-cyan-400 font-semibold">▲ Threshold ({Math.round(threshold * 100)}%)</span>
        <span className="text-amber-400">Moderate</span>
        <span className="text-rose-400">High (&ge;50%)</span>
        <span>100%</span>
      </div>
    </div>
  );
}
