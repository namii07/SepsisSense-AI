import React, { useState } from 'react';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  RotateCcw, 
  Send, 
  Stethoscope, 
  FlaskConical, 
  UserCircle2,
  Sparkles,
  Info
} from 'lucide-react';

import apiService from '../services/api';
import RiskMeter from '../components/RiskMeter';
import FeatureContributionChart from '../components/FeatureContributionChart';
import MedicalDisclaimer from '../components/MedicalDisclaimer';

// Realistic Demonstration Cases (Explicitly labeled as research test benchmarks)
const DEMO_CASES = {
  septic: {
    label: 'Load Septic Trajectory Demo',
    description: 'Tachycardia, tachypnea, pyrexia, hyperlactatemia & leukocytosis',
    data: {
      patient_pseudo_id: 'DEMO-CASE-SEPTIC',
      is_demo: true,
      HR: 114.0,
      Resp: 28.0,
      Temp: 38.8,
      MAP: 59.0,
      O2Sat: 91.0,
      SBP: 88.0,
      DBP: 46.0,
      WBC: 18.2,
      Lactate: 4.1,
      Creatinine: 2.3,
      Platelets: 112.0,
      Glucose: 175.0,
      BUN: 36.0,
      pH: 7.29,
      Age: 69.0,
      ICULOS: 28.0,
      Gender: 1
    }
  },
  stable: {
    label: 'Load Stable ICU Case Demo',
    description: 'Post-operative observation, normal hemodynamics, baseline lactate',
    data: {
      patient_pseudo_id: 'DEMO-CASE-STABLE',
      is_demo: true,
      HR: 72.0,
      Resp: 15.0,
      Temp: 36.9,
      MAP: 86.0,
      O2Sat: 98.0,
      SBP: 122.0,
      DBP: 74.0,
      WBC: 7.4,
      Lactate: 1.1,
      Creatinine: 0.9,
      Platelets: 250.0,
      Glucose: 106.0,
      BUN: 14.0,
      pH: 7.41,
      Age: 56.0,
      ICULOS: 14.0,
      Gender: 0
    }
  }
};

const INITIAL_FORM_STATE = {
  patient_pseudo_id: 'OBS-ICU-8821',
  is_demo: false,
  HR: 84.0,
  Resp: 18.0,
  Temp: 37.0,
  MAP: 82.0,
  O2Sat: 97.0,
  SBP: 118.0,
  DBP: 72.0,
  WBC: 8.5,
  Lactate: 1.4,
  Creatinine: 1.0,
  Platelets: 230.0,
  Glucose: 115.0,
  BUN: 16.0,
  pH: 7.40,
  Age: 62.0,
  ICULOS: 16.0,
  Gender: 1
};

export default function PredictPage() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'patient_pseudo_id' ? value : parseFloat(value) || value
    }));
  };

  const loadPreset = (presetKey) => {
    if (DEMO_CASES[presetKey]) {
      setFormData(DEMO_CASES[presetKey].data);
      setPrediction(null);
      setError(null);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setPrediction(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.predictSepsis(formData);
      setPrediction(result);
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err.response?.data?.detail || "Inference server error. Ensure the FastAPI backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <MedicalDisclaimer />

      {/* Header & Presets Bar */}
      <div className="medical-card p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>ICU Clinical Observation Input Form</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit validated ICU telemetry and laboratory features for probabilistic sepsis estimation
          </p>
        </div>

        {/* Demo Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => loadPreset('septic')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs font-medium text-rose-300 hover:bg-rose-900/40 transition-colors"
            title="Load synthetic septic trajectory (tachycardia, fever, elevated lactate)"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>Load Sepsis Case Demo</span>
          </button>

          <button
            type="button"
            onClick={() => loadPreset('stable')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs font-medium text-emerald-300 hover:bg-emerald-900/40 transition-colors"
            title="Load normal ICU patient observation values"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Normal Case Demo</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset form to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form on Left, Prediction Output on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column (7 Cols on large) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          {/* Section 1: Vital Signs */}
          <div className="medical-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-cyan-400" />
                <span>1. Hemodynamic & Vital Signs</span>
              </h3>
              <span className="text-[11px] text-slate-500">Core SIRS & qSOFA telemetry</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Heart Rate (HR) *</span>
                  <span className="text-[10px] text-slate-500">60-100 bpm</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="240"
                    required
                    name="HR"
                    value={formData.HR}
                    onChange={handleInputChange}
                    className="medical-input"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">bpm</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Tachycardia &gt;90 bpm signals systemic response</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Respiration Rate (Resp) *</span>
                  <span className="text-[10px] text-slate-500">12-20 bpm</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    min="4"
                    max="65"
                    required
                    name="Resp"
                    value={formData.Resp}
                    onChange={handleInputChange}
                    className="medical-input"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">br/min</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Tachypnea &gt;20 indicates compensatory effort</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Body Temperature (Temp) *</span>
                  <span className="text-[10px] text-slate-500">36.5-37.5 °C</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    min="31.0"
                    max="43.0"
                    required
                    name="Temp"
                    value={formData.Temp}
                    onChange={handleInputChange}
                    className="medical-input"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">°C</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">&gt;38.0°C fever or &lt;36.0°C hypothermia</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Mean Arterial Pressure (MAP) *</span>
                  <span className="text-[10px] text-slate-500">70-105 mmHg</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    min="25"
                    max="180"
                    required
                    name="MAP"
                    value={formData.MAP}
                    onChange={handleInputChange}
                    className="medical-input"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">mmHg</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">&lt;65 mmHg indicates septic shock hypoperfusion</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Oxygen Saturation (O2Sat) *</span>
                  <span className="text-[10px] text-slate-500">95-100 %</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    min="60"
                    max="100"
                    required
                    name="O2Sat"
                    value={formData.O2Sat}
                    onChange={handleInputChange}
                    className="medical-input"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Pulse oximetry SpO2</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-300">SBP (mmHg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="40"
                    max="260"
                    name="SBP"
                    value={formData.SBP}
                    onChange={handleInputChange}
                    className="medical-input mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">DBP (mmHg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="160"
                    name="DBP"
                    value={formData.DBP}
                    onChange={handleInputChange}
                    className="medical-input mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Laboratory Measurements */}
          <div className="medical-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-teal-400" />
                <span>2. Laboratory Measurements</span>
              </h3>
              <span className="text-[11px] text-slate-500">Inflammatory & organ dysfunction markers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>White Blood Cell Count (WBC) *</span>
                  <span className="text-[10px] text-slate-500">4.5-11.0</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="90"
                    required
                    name="WBC"
                    value={formData.WBC}
                    onChange={handleInputChange}
                    className="medical-input"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">x10³/µL</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Leukocytosis &gt;12 or leukopenia &lt;4</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Serum Lactate *</span>
                  <span className="text-[10px] text-slate-500">&lt;2.0 mmol/L</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="25.0"
                    required
                    name="Lactate"
                    value={formData.Lactate}
                    onChange={handleInputChange}
                    className="medical-input"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">mmol/L</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">&gt;2.0 marks anaerobic tissue hypoperfusion</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Serum Creatinine</span>
                  <span className="text-[10px] text-slate-500">0.6-1.2 mg/dL</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="15.0"
                    name="Creatinine"
                    value={formData.Creatinine}
                    onChange={handleInputChange}
                    className="medical-input"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">mg/dL</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Renal impairment marker (SOFA score)</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Platelet Count</span>
                  <span className="text-[10px] text-slate-500">150-400</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="900"
                    name="Platelets"
                    value={formData.Platelets}
                    onChange={handleInputChange}
                    className="medical-input"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">x10³/µL</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">&lt;150 thrombocytopenia in consumptive coagulopathy</p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                  <span>Blood Glucose</span>
                  <span className="text-[10px] text-slate-500">70-140 mg/dL</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    step="1"
                    min="30"
                    max="600"
                    name="Glucose"
                    value={formData.Glucose}
                    onChange={handleInputChange}
                    className="medical-input"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-500 font-mono">mg/dL</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-300">BUN (mg/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="2"
                    max="150"
                    name="BUN"
                    value={formData.BUN}
                    onChange={handleInputChange}
                    className="medical-input mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-300">pH (units)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="6.9"
                    max="7.7"
                    name="pH"
                    value={formData.pH}
                    onChange={handleInputChange}
                    className="medical-input mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Patient Context & Demographics */}
          <div className="medical-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserCircle2 className="w-4 h-4 text-cyan-400" />
                <span>3. Patient Demographics & ICU Stay</span>
              </h3>
              <span className="text-[11px] text-slate-500">Risk stratification covariates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300">Patient Observation Code</label>
                <input
                  type="text"
                  name="patient_pseudo_id"
                  value={formData.patient_pseudo_id}
                  onChange={handleInputChange}
                  className="medical-input mt-1 font-mono text-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Age (years) *</label>
                <input
                  type="number"
                  step="1"
                  min="18"
                  max="105"
                  required
                  name="Age"
                  value={formData.Age}
                  onChange={handleInputChange}
                  className="medical-input mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">ICU Length of Stay (hrs)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="500"
                  name="ICULOS"
                  value={formData.ICULOS}
                  onChange={handleInputChange}
                  className="medical-input mt-1"
                />
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-cyan-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Evaluating Sepsis Risk Telemetry...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Estimate Sepsis Risk</span>
              </>
            )}
          </button>
        </form>

        {/* Prediction Results Column (5 Cols on large) */}
        <div className="lg:col-span-5 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-rose-200">Prediction Pipeline Error</h4>
                <p className="mt-0.5 text-rose-300/80">{error}</p>
              </div>
            </div>
          )}

          {prediction ? (
            <div className="medical-card p-5 space-y-5 border-cyan-500/40 shadow-xl shadow-cyan-950/20">
              {/* Header Badge */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Prediction Result</span>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {prediction.patient_pseudo_id}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/50">
                  {prediction.record_id}
                </span>
              </div>

              {/* Risk Meter Gauge */}
              <RiskMeter
                probability={prediction.probability}
                threshold={prediction.classification_threshold}
                category={prediction.risk_category}
              />

              {/* Classification Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                prediction.predicted_class === 1
                  ? 'bg-rose-950/25 border-rose-800/50 text-rose-300'
                  : 'bg-emerald-950/25 border-emerald-800/50 text-emerald-300'
              }`}>
                {prediction.predicted_class === 1 ? (
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-xs space-y-1">
                  <div className="font-bold text-sm">
                    {prediction.predicted_label}
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {prediction.interpretation}
                  </p>
                </div>
              </div>

              {/* Feature Contributions Breakdown */}
              <div className="pt-2">
                <FeatureContributionChart
                  contributions={prediction.feature_contributions}
                />
              </div>

              {/* Metadata Footer */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex justify-between">
                <span>Model: {prediction.model_version}</span>
                <span>Threshold: {Math.round(prediction.classification_threshold * 100)}%</span>
              </div>
            </div>
          ) : (
            <div className="medical-card p-8 text-center flex flex-col items-center justify-center min-h-[460px]">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <Activity className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-base font-semibold text-white">
                Awaiting Clinical Inputs
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                Fill in the patient vital signs and laboratory parameters on the left, or click one of the pre-configured clinical demonstration cases above, then press <strong>Estimate Sepsis Risk</strong>.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => loadPreset('septic')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300"
                >
                  Quick Demo: Septic Patient
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('stable')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300"
                >
                  Quick Demo: Stable Patient
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
