import React, { useState } from 'react';
import { Unit } from '../types';
import { X, Building2, Plus, Pencil, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';

interface MasterUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  onAddUnitClick: () => void;
  onEditUnitClick: (unit: Unit) => void;
  onDeleteUnit: (unitId: string) => void;
  onResetUnits?: () => void;
}

export const MasterUnitsModal: React.FC<MasterUnitsModalProps> = ({
  isOpen,
  onClose,
  units,
  onAddUnitClick,
  onEditUnitClick,
  onDeleteUnit,
  onResetUnits,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredUnits = units.filter((u) =>
    (u.nama + u.kategori + (u.kepalaRuangan || '')).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-800">Master Ruangan / Unit / Instalasi</h3>
              <p className="text-xs text-slate-500">Kelola daftar ruangan dan kepala ruangan ({units.length} total)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 shrink-0 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <input
            type="text"
            placeholder="Cari ruangan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            {onResetUnits && (
              <button
                onClick={onResetUnits}
                className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                title="Kembalikan ke data bawaan rumah sakit"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Bawaan</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onAddUnitClick();
              }}
              className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Unit</span>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-4 flex-1 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredUnits.length > 0 ? (
              filteredUnits.map((u) => (
                <div key={u.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {u.kategori}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 truncate">{u.nama}</h4>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      Kepala: <strong className="text-slate-700 font-medium">{u.kepalaRuangan || 'Belum diisi'}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onClose();
                        onEditUnitClick(u);
                      }}
                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit ruangan"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteUnit(u.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus ruangan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-slate-500 flex flex-col items-center">
                <AlertTriangle className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm">Tidak ada ruangan yang cocok dengan "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
