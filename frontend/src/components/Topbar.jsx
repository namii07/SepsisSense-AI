import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  ExternalLink,
  Clock
} from 'lucide-react';
import apiService from '../services/api';

const ROUTE_TITLES = {
  '/': 'ICU Sepsis Overview Dashboard',
  '/predict': 'Clinical Sepsis Risk Estimation',
  '/analytics': 'Model Performance & Validation Analytics',
  '/history': 'Patient Observation & Prediction History',
  '/system': 'System Health & Component Diagnostics',
};

export default function Topbar({ isCollapsed }) {
  const location = useLocation();
  const currentTitle = ROUTE_TITLES[location.pathname] || 'SepsisSense AI';

  const [healthStatus, setHealthStatus] = useState('checking');
  const [modelName, setModelName] = useState('Random Forest');

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const data = await apiService.getHealth();
        if (isMounted) {
          setHealthStatus(data.status === 'healthy' ? 'operational' : 'degraded');
          if (data.model_algorithm) setModelName(data.model_algorithm);
        }
      } catch (err) {
        if (isMounted) setHealthStatus('offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header 
      className={`fixed top-0 right-0 z-20 h-16 bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-800/80 transition-all duration-300 ease-in-out flex items-center justify-between px-6 ${
        isCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Page Title & Breadcrumb */}
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">
          {currentTitle}
        </h2>
        <p className="text-xs text-slate-400">
          PhysioNet ICU Challenge Benchmark | ML Inference Pipeline
        </p>
      </div>

      {/* Right Controls & Status Indicators */}
      <div className="flex items-center gap-4">
        {/* Model Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Model:</span>
          <span className="font-medium text-slate-200">{modelName}</span>
        </div>

        {/* Backend Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
          {healthStatus === 'operational' ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 font-medium">Backend Ready</span>
            </>
          ) : healthStatus === 'checking' ? (
            <>
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-cyan-400 font-medium">Connecting...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-amber-400 font-medium">Offline / Local Mode</span>
            </>
          )}
        </div>

        {/* API Docs Link */}
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors px-2.5 py-1.5 rounded-md hover:bg-slate-800/50"
          title="Open FastAPI Swagger Documentation"
        >
          <span>API Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
}
