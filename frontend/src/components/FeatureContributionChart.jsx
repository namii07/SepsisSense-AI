import React from 'react';
import { TrendingUp, TrendingDown, HelpCircle, AlertCircle } from 'lucide-react';

export default function FeatureContributionChart({ contributions = [] }) {
  if (!contributions || contributions.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs">
        No feature contribution explanations available for this prediction.
      </div>
    );
  }

  // Find max absolute weight for proportional bar widths
  const maxAbsWeight = Math.max(...contributions.map(c => Math.abs(c.importance_weight)), 0.1);

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
          <span>Top Contributing Model Factors</span>
          <span className="text-[10px] text-cyan-400 font-normal lowercase">(SHAP local weights)</span>
        </h4>
        <span className="text-[11px] text-slate-500">
          Positive = elevates risk | Negative = mitigates risk
        </span>
      </div>

      <div className="space-y-2.5">
        {contributions.map((item, idx) => {
          const isPositive = item.direction === 'increases_risk';
          const absWeight = Math.abs(item.importance_weight);
          const barWidthPercent = Math.min(Math.round((absWeight / maxAbsWeight) * 100), 100);

          return (
            <div 
              key={item.feature || idx} 
              className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  )}
                  <span className="text-sm font-semibold text-slate-200">
                    {item.feature_label}
                  </span>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                    {item.value}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className={isPositive ? 'text-rose-400 font-semibold' : 'text-teal-400 font-semibold'}>
                    {isPositive ? `+${item.importance_weight}` : item.importance_weight}
                  </span>
                </div>
              </div>

              {/* Impact Bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPositive ? 'bg-rose-500' : 'bg-teal-500'
                  }`}
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>

              {/* Clinical rationale note */}
              <p className="text-[11px] text-slate-400 leading-normal">
                {item.explanation_text}
              </p>
            </div>
          );
        })}
      </div>

      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Explainability Note:</strong> Local feature contributions describe internal model decision weights for this observation. They do not establish biological or clinical medical causation.
        </span>
      </div>
    </div>
  );
}
