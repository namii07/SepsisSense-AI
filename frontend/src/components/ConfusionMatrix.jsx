import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';

export default function ConfusionMatrix({ matrix = { tp: 0, fp: 0, tn: 0, fn: 0 } }) {
  const { tp = 0, fp = 0, tn = 0, fn = 0 } = matrix;
  const total = tp + fp + tn + fn || 1;

  const sensitivity = tp + fn > 0 ? ((tp / (tp + fn)) * 100).toFixed(1) : '0.0';
  const specificity = tn + fp > 0 ? ((tn / (tn + fp)) * 100).toFixed(1) : '0.0';
  const precision = tp + fp > 0 ? ((tp / (tp + fp)) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          Held-Out Test Confusion Matrix
        </h4>
        <span className="text-xs text-slate-400 font-mono">
          N = {total} observations
        </span>
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-2 gap-3 font-mono text-center">
        {/* True Negatives (TN) */}
        <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-left">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="font-sans font-semibold">True Negative (TN)</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mb-0.5">{tn}</div>
          <div className="text-[11px] font-sans text-slate-400">
            Actual: Non-Sepsis | Pred: Non-Sepsis
          </div>
        </div>

        {/* False Positives (FP) */}
        <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-left">
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span className="font-sans font-semibold">False Positive (FP)</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mb-0.5">{fp}</div>
          <div className="text-[11px] font-sans text-slate-400">
            Actual: Non-Sepsis | Pred: Sepsis (Alarm)
          </div>
        </div>

        {/* False Negatives (FN) - CRITICAL IN SEPSIS */}
        <div className="p-3.5 rounded-lg bg-rose-950/30 border border-rose-800/50 text-left">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span className="font-sans font-semibold">False Negative (FN)</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-rose-300 mb-0.5">{fn}</div>
          <div className="text-[11px] font-sans text-rose-400/80 font-medium">
            Actual: Sepsis | Pred: Missed
          </div>
        </div>

        {/* True Positives (TP) */}
        <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-800/50 text-left">
          <div className="flex items-center justify-between text-xs text-cyan-400 mb-1">
            <span className="font-sans font-semibold">True Positive (TP)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 mb-0.5">{tp}</div>
          <div className="text-[11px] font-sans text-slate-400">
            Actual: Sepsis | Pred: Detected
          </div>
        </div>
      </div>

      {/* Clinical Rate Summary */}
      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        <div className="p-2 rounded bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Sensitivity (Recall)</span>
          <span className="text-sm font-bold text-cyan-400">{sensitivity}%</span>
        </div>
        <div className="p-2 rounded bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Specificity</span>
          <span className="text-sm font-bold text-emerald-400">{specificity}%</span>
        </div>
        <div className="p-2 rounded bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 block uppercase">Precision (PPV)</span>
          <span className="text-sm font-bold text-teal-400">{precision}%</span>
        </div>
      </div>
    </div>
  );
}
