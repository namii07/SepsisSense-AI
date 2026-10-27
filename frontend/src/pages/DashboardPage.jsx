import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Database, 
  Cpu, 
  Clock, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

import apiService from '../services/api';
import MetricCard from '../components/MetricCard';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getDashboard();
      setData(res);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Failed to connect to backend service. Please ensure FastAPI server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Prepare class distribution chart data
  const classDistData = data?.dataset_overview?.positive_count !== undefined ? [
    { name: 'Non-Sepsis (0)', value: data.dataset_overview.negative_count || 1968, color: '#10B981' },
    { name: 'Sepsis (1)', value: data.dataset_overview.positive_count || 212, color: '#F43F5E' },
  ] : [];

  // Prepare risk category data
  const riskDistData = data?.risk_distribution ? [
    { category: 'Low Risk', count: data.risk_distribution['Low Risk'] || 0, fill: '#10B981' },
    { category: 'Moderate', count: data.risk_distribution['Moderate Risk'] || 0, fill: '#F59E0B' },
    { category: 'High Risk', count: data.risk_distribution['High Risk'] || 0, fill: '#F43F5E' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Disclaimer Banner */}
      <MedicalDisclaimer />

      {/* Header with Title and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Clinical Surveillance & Prediction Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Real-time inference telemetry and retrospective ICU dataset analysis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <Link
            to="/predict"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-md shadow-cyan-900/40 transition-colors"
          >
            <span>Run New Prediction</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchDashboard} className="underline hover:text-white">Retry</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Predictions"
          value={data?.total_predictions ?? '—'}
          subtitle="Cumulative inference requests logged in SQLite"
          icon={Activity}
          accent="cyan"
        />

        <MetricCard
          title="Positive Predictions"
          value={data?.positive_predictions ?? '—'}
          subtitle={`${data?.positive_rate_percentage || 0}% positive detection rate`}
          icon={AlertCircle}
          accent="rose"
          badge={data?.positive_predictions > 0 ? "Elevated Risk" : "Normal"}
        />

        <MetricCard
          title="Lower-Risk Predictions"
          value={data?.negative_predictions ?? '—'}
          subtitle="Observations within lower risk boundaries"
          icon={CheckCircle2}
          accent="emerald"
        />

        <MetricCard
          title="Current Model Status"
          value={data?.model_status ? "Active" : "Ready"}
          subtitle="Random Forest (Balanced Weights)"
          icon={Cpu}
          accent="teal"
          badge="Inference Ready"
        />
      </div>

      {/* Dataset Overview & Class Imbalance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dataset Summary Panel */}
        <div className="medical-card p-5 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>ICU Dataset Overview</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-mono">
                {data?.dataset_overview?.source || "PhysioNet ICU"}
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Trained on standardized PhysioNet ICU benchmark observations containing multi-parameter vital signs and laboratory measurements.
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800/70">
                <span className="text-slate-400 font-sans">Total Valid Observations:</span>
                <span className="text-white font-semibold">{data?.dataset_overview?.total_observations?.toLocaleString() || '2,180'}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800/70">
                <span className="text-slate-400 font-sans">Available Clinical Features:</span>
                <span className="text-cyan-400 font-semibold">{data?.dataset_overview?.total_features || 17} features</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800/70">
                <span className="text-slate-400 font-sans">Positive Target Cases (Sepsis=1):</span>
                <span className="text-rose-400 font-semibold">{data?.dataset_overview?.positive_count?.toLocaleString() || '212'}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800/70">
                <span className="text-slate-400 font-sans">Negative Target Cases (Sepsis=0):</span>
                <span className="text-emerald-400 font-semibold">{data?.dataset_overview?.negative_count?.toLocaleString() || '1,968'}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900 border border-slate-800/70">
                <span className="text-slate-400 font-sans">Positive Prevalence Rate:</span>
                <span className="text-amber-400 font-semibold">{data?.dataset_overview?.positive_rate_percent || 9.72}%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="text-slate-300 font-medium">Validation Methodology:</span> Patient-level group splitting prevents observation leakage across repeated measurements.
          </div>
        </div>

        {/* Target Class Distribution Doughnut Chart */}
        <div className="medical-card p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">
              Target Class Distribution
            </h3>
            <span className="text-[11px] text-slate-400">SepsisLabel</span>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            Severe class imbalance requires cost-sensitive learning & recall optimization.
          </p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {classDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0B1120" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#F1F5F9' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={32}
                  formatter={(val) => <span className="text-xs text-slate-300 font-sans">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Category Distribution Bar Chart */}
        <div className="medical-card p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">
              Predictions by Risk Tier
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">SQLite Logs</span>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            Categorization based on experimental probability thresholds.
          </p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="category" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#F1F5F9' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskDistData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Prediction Activity Timeline Chart */}
      <div className="medical-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Prediction Activity Over Time</span>
            </h3>
            <p className="text-xs text-slate-400">
              Daily cumulative volume of positive vs negative sepsis inference events
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Database Logged
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.prediction_activity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B1120', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#F1F5F9' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Area type="monotone" dataKey="positive" name="Positive (Sepsis)" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#colorPositive)" />
              <Area type="monotone" dataKey="negative" name="Negative (Low Risk)" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorNegative)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="medical-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Recent Clinical Predictions
            </h3>
            <p className="text-xs text-slate-400">
              Latest inference records retrieved from the SQLite database
            </p>
          </div>
          <Link
            to="/history"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Record ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Patient Code</th>
                <th className="py-2.5 px-3">Probability</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Risk Tier</th>
                <th className="py-2.5 px-3">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {data?.recent_predictions && data.recent_predictions.length > 0 ? (
                data.recent_predictions.map((rec) => {
                  const isPos = rec.predicted_class === 1;
                  return (
                    <tr key={rec.record_id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-cyan-400">{rec.record_id}</td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(rec.timestamp).toLocaleDateString()} {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-medium">{rec.patient_pseudo_id}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-white">
                        {(rec.probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                          isPos ? 'bg-rose-950/40 text-rose-300 border border-rose-800/50' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                        }`}>
                          {isPos ? <AlertCircle className="w-3 h-3 text-rose-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {rec.predicted_label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rec.risk_category === 'High Risk' ? 'bg-rose-500/20 text-rose-300' :
                          rec.risk_category === 'Moderate Risk' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {rec.risk_category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{rec.notes || '—'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No prediction records found. Run a prediction to populate live statistics.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
