import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

export const apiService = {
  // System Health
  async getHealth() {
    const res = await apiClient.get('/health');
    return res.data;
  },

  // Dashboard Summary & Charts
  async getDashboard() {
    const res = await apiClient.get('/api/dashboard');
    return res.data;
  },

  // Sepsis Prediction Inference
  async predictSepsis(clinicalInputs) {
    const res = await apiClient.post('/predict', clinicalInputs);
    return res.data;
  },

  // Explainability
  async explainPrediction(features) {
    const res = await apiClient.post('/explain', { features });
    return res.data;
  },

  // Model Analytics & Evaluation
  async getAnalytics() {
    const res = await apiClient.get('/api/analytics');
    return res.data;
  },

  // Prediction History
  async getHistory({ page = 1, limit = 10, search = '', risk_category = 'All', sort_by = 'date_desc' } = {}) {
    const params = { page, limit, sort_by };
    if (search) params.search = search;
    if (risk_category && risk_category !== 'All') params.risk_category = risk_category;
    
    const res = await apiClient.get('/api/history', { params });
    return res.data;
  },

  // Prediction Counts
  async getStats() {
    const res = await apiClient.get('/api/stats');
    return res.data;
  },

  // Clinical Features Metadata
  async getFeatures() {
    const res = await apiClient.get('/api/features');
    return res.data;
  },
};

export default apiService;
