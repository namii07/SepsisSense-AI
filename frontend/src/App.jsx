import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

import DashboardPage from './pages/DashboardPage';
import PredictPage from './pages/PredictPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';
import SystemStatusPage from './pages/SystemStatusPage';

export default function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#070A11] text-slate-100 flex">
        {/* Collapsible Sidebar */}
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        {/* Main Content Area */}
        <div 
          className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
            isCollapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          {/* Top Navigation Bar */}
          <Topbar isCollapsed={isCollapsed} />

          {/* Page Body Viewport */}
          <main className="flex-1 mt-16 p-6 max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/predict" element={<PredictPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/system" element={<SystemStatusPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="py-4 px-6 border-t border-slate-900 text-center text-xs text-slate-500">
            SepsisSense AI &copy; 2026 | Academic ICU Sepsis Prediction System | For Research & Educational Use Only
          </footer>
        </div>
      </div>
    </BrowserRouter>
  );
}
