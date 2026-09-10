import React, { useState, useEffect } from 'react';
import {
  Hospital,
  Shield,
  LogOut,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Menu,
  X,
  Stethoscope,
  LayoutGrid,
  Table,
  CheckCircle,
  Building2,
} from 'lucide-react';
import { AuthSession, Unit } from '../types';
import { ROLE_LABELS } from '../lib/supabase_config';

interface AppLayoutProps {
  viewMode?: 'quick_direct' | 'cards' | 'table';
  onChangeViewMode?: (mode: 'quick_direct' | 'cards' | 'table') => void;
  session: AuthSession;
  onLogout: () => void;
  onOpenSupabase: () => void;
  onOpenMasterUnits: () => void;
  onOpenPrint: () => void;
  onImportCSV?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportCSV: () => void;
  onResetData: () => void;
  isSupabaseConfigured: boolean;
  canManageRbac?: boolean;
  canManageUnits?: boolean;
  canExportCSV?: boolean;
  canPrintReports?: boolean;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  session,
  onLogout,
  onOpenSupabase,
  onOpenMasterUnits,
  onOpenPrint,
  onExportCSV,
  onImportCSV,
  onResetData,
  isSupabaseConfigured,
  canManageRbac = false,
  canManageUnits = false,
  canExportCSV = true,
  canPrintReports = true,
  viewMode,
  onChangeViewMode,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isSuperAdmin = session.role === 'super_admin' && canManageRbac;
  const roleInfo = ROLE_LABELS[session.role] || { title: session.role, badgeColor: 'bg-blue-100' };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen bg-slate-100/70 text-slate-900 overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity" 
          onClick={closeSidebar} 
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-xl lg:shadow-none flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0 bg-gradient-to-tr from-blue-700 to-indigo-600 text-white justify-between">
          <div className="flex items-center gap-3">
            <Hospital className="w-6 h-6" />
            <h1 className="font-bold tracking-tight text-sm">SIM Penilaian Pegawai</h1>
          </div>
          <button onClick={closeSidebar} className="lg:hidden p-1 bg-white/20 hover:bg-white/30 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 border-b border-slate-100 flex flex-col gap-1 shrink-0 bg-slate-50">
          <span className="font-bold text-slate-800 truncate">{session.userName}</span>
          <span className="text-xs text-slate-500 truncate">{session.unitNama}</span>
          <div className="mt-2 inline-flex">
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${roleInfo.badgeColor} border border-slate-200/50`}>
                {roleInfo.title.split('(')[0]}
             </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <nav className="space-y-1">
            <h3 className="px-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Manajemen RS</h3>
            
            {isSuperAdmin && (
              <button
                onClick={() => { closeSidebar(); onOpenSupabase(); }}
                className="w-full text-left px-3 py-2.5 text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center justify-between border border-purple-200 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Konfigurasi RBAC</span>
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSupabaseConfigured ? 'bg-emerald-500' : 'bg-purple-400'
                  }`}
                  title={isSupabaseConfigured ? 'Supabase Terhubung' : 'Offline'}
                />
              </button>
            )}

            {canManageUnits && (
              <button
                onClick={() => { closeSidebar(); onOpenMasterUnits(); }}
                className="w-full text-left px-3 py-2.5 mt-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl flex items-center gap-2.5 border border-rose-200 transition-colors"
              >
                <Building2 className="w-4 h-4 text-rose-600" />
                <span>Master Data Unit</span>
              </button>
            )}
          </nav>

          <nav className="space-y-1">
            <h3 className="px-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Laporan & Data</h3>
            
            {canExportCSV && (
              <>
                <button
                  onClick={() => { closeSidebar(); onExportCSV(); }}
                  className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl flex items-center gap-2.5 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Ekspor CSV / Excel</span>
                </button>
                <div className="relative overflow-hidden w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center gap-2.5 transition-colors">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(e) => { closeSidebar(); if(onImportCSV) onImportCSV(e); }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>Impor Data CSV</span>
                </div>
              </>
            )}

            {canPrintReports && (
              <button
                onClick={() => { closeSidebar(); onOpenPrint(); }}
                className="w-full text-left px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-2.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Cetak / Filter Laporan</span>
              </button>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-2 shrink-0 bg-slate-50">
           {session.role === 'super_admin' && (
           <button
             onClick={() => { closeSidebar(); onResetData(); }}
             className="w-full text-left px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-xl flex items-center gap-2.5 transition-colors"
           >
             <RotateCcw className="w-4 h-4 text-rose-500" />
             <span>Reset Data (0 Dummy)</span>
           </button>
           )}
           <button
             onClick={() => { closeSidebar(); onLogout(); }}
             className="w-full text-left px-3 py-2.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs"
           >
             <LogOut className="w-4 h-4" />
             <span>Keluar Akun</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header / Toolbar */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-2xs z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-xl lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                 <h2 className="text-sm font-extrabold text-slate-800">Evaluasi Pelayanan</h2>
                 <p className="text-[10px] text-slate-500">Sistem Informasi Manajemen RS</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onChangeViewMode && viewMode && (
              <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => onChangeViewMode('quick_direct')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    viewMode === 'quick_direct'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Input Cepat</span>
                </button>
                <button
                  onClick={() => onChangeViewMode('cards')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    viewMode === 'cards' || viewMode === 'table'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Lihat Rekap</span>
                </button>
              </div>
            )}
            <div className="hidden sm:block text-right border-l border-slate-200 pl-4 ml-1">
              <span className="block text-xs font-bold text-slate-800">{session.userName}</span>
              <span className="block text-[10px] text-slate-500">{roleInfo.title}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
