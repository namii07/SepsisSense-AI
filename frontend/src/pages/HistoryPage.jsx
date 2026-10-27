import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';

import apiService from '../services/api';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selected record for details modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getHistory({
        page: currentPage,
        limit,
        search,
        risk_category: riskFilter,
        sort_by: sortBy
      });
      setRecords(res.records || []);
      setTotalRecords(res.total_records || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error("History fetch error:", err);
      setError("Failed to retrieve prediction records from SQLite database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentPage, riskFilter, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHistory();
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <MedicalDisclaimer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Patient Observation & Prediction History</span>
          </h2>
          <p className="text-xs text-slate-400">
            Immutable SQLite audit log of clinical telemetry evaluations and model outputs
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="medical-card p-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Record ID, Patient code, or audit note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="medical-input pl-9 text-xs"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="sm:col-span-3">
            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
              className="medical-input text-xs"
            >
              <option value="All">All Risk Categories</option>
              <option value="High Risk">High Risk Only</option>
              <option value="Moderate Risk">Moderate Risk Only</option>
              <option value="Low Risk">Low Risk Only</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              className="medical-input text-xs"
            >
              <option value="date_desc">Sort: Newest First</option>
              <option value="date_asc">Sort: Oldest First</option>
              <option value="prob_desc">Sort: Probability (High → Low)</option>
              <option value="prob_asc">Sort: Probability (Low → High)</option>
            </select>
          </div>

          {/* Search Button */}
          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchHistory} className="underline text-xs">Retry</button>
        </div>
      )}

      {/* Records Table */}
      <div className="medical-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Patient Code</th>
                <th className="py-3 px-4">Probability</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Risk Category</th>
                <th className="py-3 px-4">Model Version</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Loading records from SQLite database...</span>
                    </div>
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((rec) => {
                  const isPos = rec.predicted_class === 1;
                  return (
                    <tr key={rec.record_id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-cyan-400">
                        {rec.record_id}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(rec.timestamp).toLocaleDateString()} {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-medium">
                        {rec.patient_pseudo_id}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {(rec.probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                          isPos 
                            ? 'bg-rose-950/40 text-rose-300 border border-rose-800/50' 
                            : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                        }`}>
                          {isPos ? <AlertCircle className="w-3 h-3 text-rose-400" /> : <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {rec.predicted_label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          rec.risk_category === 'High Risk' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          rec.risk_category === 'Moderate Risk' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {rec.risk_category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[140px]">
                        {rec.model_version}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedRecord(rec)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 mx-auto text-xs"
                          title="View clinical feature details"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-600" />
                      <span className="text-sm font-semibold text-slate-400">No Prediction Records Found</span>
                      <p className="text-xs text-slate-500 max-w-sm">
                        No database records match your filter criteria. Try adjusting the search term or submitting a prediction on the Predict Sepsis page.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalRecords} total records)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="medical-card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5 border-cyan-500/40 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-cyan-400 font-mono uppercase">Audit Inspection</span>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Record: {selectedRecord.record_id}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Patient Code</span>
                <span className="text-slate-200 font-semibold">{selectedRecord.patient_pseudo_id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Estimated Likelihood</span>
                <span className="text-cyan-400 font-bold font-mono">{(selectedRecord.probability * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Classification</span>
                <span className={selectedRecord.predicted_class === 1 ? "text-rose-400 font-semibold" : "text-emerald-400 font-semibold"}>
                  {selectedRecord.predicted_label}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Risk Tier</span>
                <span className="text-amber-400 font-semibold">{selectedRecord.risk_category}</span>
              </div>
            </div>

            {/* Input Features Breakdown */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Recorded Input Parameters
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {Object.entries(selectedRecord.input_features || {}).map(([key, val]) => (
                  <div key={key} className="p-2 rounded bg-slate-900/80 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">{key}:</span>
                    <span className="text-white font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Factors if available */}
            {selectedRecord.top_factors && selectedRecord.top_factors.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Logged Explainability Contributions
                </h4>
                <div className="space-y-2 text-xs">
                  {selectedRecord.top_factors.map((f, i) => (
                    <div key={i} className="p-2.5 rounded bg-slate-900/60 border border-slate-800 flex items-start justify-between">
                      <div>
                        <span className="font-semibold text-slate-200">{f.feature_label}</span>
                        <p className="text-[11px] text-slate-400">{f.explanation_text}</p>
                      </div>
                      <span className={`font-mono text-xs font-semibold ${f.direction === 'increases_risk' ? 'text-rose-400' : 'text-teal-400'}`}>
                        {f.importance_weight > 0 ? `+${f.importance_weight}` : f.importance_weight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes & Model Version */}
            <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
              <span>Timestamp: {new Date(selectedRecord.timestamp).toLocaleString()}</span>
              <span>Model: {selectedRecord.model_version}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
