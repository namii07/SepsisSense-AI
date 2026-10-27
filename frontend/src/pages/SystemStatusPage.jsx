import React, { useState, useEffect } from 'react';
import { 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Cpu, 
  Database, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  ExternalLink,
  ShieldAlert,
  Code
} from 'lucide-react';

import apiService from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

export default function SystemStatusPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState(null);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getHealth();
      setHealth(data);
      setLastCheck(new Date());
    } catch (err) {
      console.error("Health check error:", err);
      setError("Cannot reach FastAPI backend at http://localhost:8000. Backend may be offline.");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const getStatusBadge = (statusStr) => {
    if (statusStr === 'operational' || statusStr === 'healthy' || statusStr === 'connected') {
      return {
        label: 'Operational',
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
        icon: CheckCircle2,
      };
    } else if (statusStr?.includes('proxy') || statusStr === 'degraded' || statusStr === 'pending') {
      return {
        label: statusStr.toUpperCase(),
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
        icon: AlertTriangle,
      };
    } else {
      return {
        label: 'Failed / Missing',
        color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400',
        icon: XCircle,
      };
    }
  };

  const components = [
    {
      name: 'FastAPI Backend Core',
      type: 'REST Service',
      status: health ? 'operational' : 'failed',
      details: health ? `Version ${health.backend_version} | Python ASGI` : 'Unreachable',
      icon: Server,
    },
    {
      name: 'Machine Learning Model Artifact',
      type: 'Scikit-Learn Classifier',
      status: health?.model_status || 'failed',
      details: health?.model_algorithm ? `${health.model_algorithm} (balanced weights)` : 'Model pending',
      icon: Cpu,
    },
    {
      name: 'ICU Telemetry Dataset',
      type: 'PhysioNet Challenge Data',
      status: health?.dataset_status || 'failed',
      details: health?.dataset_rows ? `${health.dataset_rows.toLocaleString()} valid observations loaded` : 'Dataset missing',
      icon: Database,
    },
    {
      name: 'SQLite Database & ORM',
      type: 'SQLAlchemy Engine',
      status: health?.database_status || 'failed',
      details: health?.total_db_records !== undefined ? `Connected | ${health.total_db_records} logged inference records` : 'Database disconnected',
      icon: Layers,
    },
    {
      name: 'Explainable AI Engine',
      type: 'Local Attribution',
      status: health?.explainability_status || 'failed',
      details: health?.explainability_status || 'SHAP TreeExplainer',
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <MedicalDisclaimer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <span>Subsystem Health & Diagnostic Status</span>
          </h2>
          <p className="text-xs text-slate-400">
            Live operational verification of backend APIs, ML artifacts, datasets, and storage
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastCheck && (
            <span className="text-xs text-slate-500 font-mono hidden sm:inline">
              Checked: {lastCheck.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-md shadow-cyan-950/40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Run Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Backend Offline Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-rose-200">Backend Communication Failure</h4>
            <p className="text-rose-300/80">{error}</p>
            <p className="text-slate-400 text-[11px] pt-1">
              Start the backend locally using: <code className="bg-slate-900 px-2 py-0.5 rounded text-cyan-400">uvicorn backend.main:app --reload --port 8000</code>
            </p>
          </div>
        </div>
      )}

      {/* Primary Subsystems Status Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Core Subsystem Components
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {components.map((c) => {
            const Icon = c.icon;
            const badge = getStatusBadge(c.status);
            const StatusIcon = badge.icon;

            return (
              <div key={c.name} className="medical-card p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className={`px-2 py-0.5 rounded-full border text-[11px] font-medium flex items-center gap-1.5 ${badge.color}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span>{badge.label}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">{c.name}</h4>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-mono">{c.type}</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300 font-mono">
                  {c.details}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Available API Endpoints & Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Endpoints Panel */}
        <div className="medical-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" />
              <span>Available Backend API Endpoints</span>
            </h3>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Swagger UI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            FastAPI REST interface endpoints with Pydantic payload validation and CORS protection
          </p>

          <div className="space-y-2 font-mono text-xs">
            {[
              { method: 'GET', path: '/health', desc: 'Application health and component status check' },
              { method: 'GET', path: '/api/dashboard', desc: 'Live KPI summary and dataset overview statistics' },
              { method: 'POST', path: '/predict', desc: 'Sepsis risk estimation and SQLite history persistence' },
              { method: 'POST', path: '/explain', desc: 'SHAP local feature attribution explanations' },
              { method: 'GET', path: '/api/analytics', desc: 'Held-out test evaluation metrics and ROC/PR curves' },
              { method: 'GET', path: '/api/history', desc: 'Paginated prediction audit history with search/filter' },
              { method: 'GET', path: '/api/stats', desc: 'High-level prediction volume counts' },
              { method: 'GET', path: '/api/features', desc: 'Available clinical features and physiological metadata' },
            ].map((ep) => (
              <div key={ep.path} className="p-2 rounded bg-slate-900 border border-slate-800/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    ep.method === 'GET' ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/60' : 'bg-teal-950/60 text-teal-400 border border-teal-800/60'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="text-slate-200">{ep.path}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-sans hidden sm:inline">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Runtime Environment & File Paths */}
        <div className="medical-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">
            Local Deployment Environment
          </h3>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 font-sans block text-[11px] mb-0.5">Model Artifact Path:</span>
              <span className="text-cyan-400 break-all">{health?.model_path || 'backend/artifacts/model.joblib'}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 font-sans block text-[11px] mb-0.5">Dataset File Path:</span>
              <span className="text-slate-200 break-all">{health?.dataset_path || 'backend/artifacts/sample_dataset.csv'}</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 font-sans block text-[11px] mb-0.5">SQLite Database File:</span>
              <span className="text-slate-200">backend/sepsis_sense.db</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center font-sans">
              <div>
                <span className="text-slate-400 block text-[11px]">Frontend Origin:</span>
                <span className="text-slate-200 font-mono text-xs">http://localhost:5173</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px]">
                CORS Allowed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
