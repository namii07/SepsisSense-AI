import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export default function MedicalDisclaimer({ compact = false }) {
  if (compact) {
    return (
      <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-300/90 text-xs flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <span>
          <strong>Academic Research Prototype:</strong> Predictions are statistical estimates for educational evaluation. Strictly not for medical decisions or clinical diagnosis.
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 via-slate-900/90 to-amber-950/30 border border-amber-900/40 shadow-sm flex items-start gap-3.5">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
      </div>
      <div className="text-xs text-slate-300 leading-relaxed space-y-1">
        <div className="font-semibold text-amber-300 flex items-center gap-2">
          <span>Medical Research Disclaimer & Ethics Notice</span>
          <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-amber-900/40 text-amber-300 border border-amber-700/50">
            Non-Diagnostic
          </span>
        </div>
        <p className="text-slate-400">
          SepsisSense AI is an academic machine learning demonstration developed for studying early sepsis warning signals from ICU physiological telemetry.
          Estimations are probabilistic classifications trained on retrospective benchmark data and <span className="text-amber-200/90 font-medium">must never be used for actual patient treatment or medical decision-making</span>. Always consult qualified clinical healthcare professionals.
        </p>
      </div>
    </div>
  );
}
