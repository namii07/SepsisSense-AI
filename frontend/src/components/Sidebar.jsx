import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  BarChart3, 
  History, 
  Server, 
  ChevronLeft, 
  ChevronRight,
  ShieldAlert,
  Dna
} from 'lucide-react';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Predict Sepsis', path: '/predict', icon: Activity },
    { name: 'Model Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Prediction History', path: '/history', icon: History },
    { name: 'System Status', path: '/system', icon: Server },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 ease-in-out bg-[#0B1120] border-r border-slate-800 flex flex-col justify-between ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand Section */}
      <div>
        <div className="h-16 flex items-center px-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-900/30 flex-shrink-0">
              <Dna className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  SepsisSense <span className="text-cyan-400">AI</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  ICU Early Risk Prediction
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Project Label Tag */}
        {!isCollapsed && (
          <div className="mx-3 mt-3 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-medium text-cyan-300">
              Research Prototype v1.0
            </span>
          </div>
        )}

        {/* Navigation List */}
        <nav className="mt-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors`} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-800/80">
        {!isCollapsed && (
          <div className="mb-3 px-2 py-2 rounded-lg bg-amber-950/20 border border-amber-900/40 text-amber-300/80 text-[11px] flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="leading-tight">
              Academic research model. Not for clinical diagnostic use.
            </span>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 rounded-lg transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
