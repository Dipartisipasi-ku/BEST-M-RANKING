import React, { useState, useEffect } from 'react';
import { Unit } from '../types';
import { X, Plus, Building2, Pencil, Check } from 'lucide-react';

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUnit?: (unit: Unit) => void;
  onUpdateUnit?: (unit: Unit) => void;
  unitToEdit?: Unit | null;
}

export const AddUnitModal: React.FC<AddUnitModalProps> = ({
  isOpen,
  onClose,
  onAddUnit,
  onUpdateUnit,
  unitToEdit,
}) => {
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState<'Ruangan' | 'Unit' | 'Instalasi'>('Ruangan');
  const [kepalaRuangan, setKepalaRuangan] = useState('');
    const [error, setError] = useState('');

  const isEdit = Boolean(unitToEdit);

  useEffect(() => {
    if (unitToEdit) {
      setNama(unitToEdit.nama || '');
      setKategori(unitToEdit.kategori || 'Ruangan');
      setKepalaRuangan(unitToEdit.kepalaRuangan || '');
            setError('');
    } else {
      setNama('');
      setKategori('Ruangan');
      setKepalaRuangan('');
            setError('');
    }
  }, [unitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setError('Nama Ruangan / Unit / Instalasi wajib diisi');
      return;
    }

    if (isEdit && unitToEdit) {
      const updatedUnit: Unit = {
        ...unitToEdit,
        nama: nama.trim(),
        kategori,
        kepalaRuangan: kepalaRuangan.trim() || undefined,
              };

      if (onUpdateUnit) {
        onUpdateUnit(updatedUnit);
      }
    } else {
      const newUnit: Unit = {
        id: `unit-${Date.now()}`,
        nama: nama.trim(),
        kategori,
        kepalaRuangan: kepalaRuangan.trim() || undefined,
              };

      if (onAddUnit) {
        onAddUnit(newUnit);
      }
    }

    setNama('');
    setKepalaRuangan('');
        setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="add-unit-modal"
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-lg ${
                isEdit ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {isEdit ? <Pencil className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {isEdit ? 'Edit Master Ruangan / Unit' : 'Tambah Ruangan / Unit / Instalasi'}
              </h3>
              {isEdit && (
                <p className="text-[10px] text-slate-500 font-mono">ID: {unitToEdit?.id}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kategori <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Ruangan', 'Unit', 'Instalasi'] as const).map((kat) => (
                <button
                  key={kat}
                  type="button"
                  onClick={() => setKategori(kat)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    kategori === kat
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {kat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Ruangan / Unit / Instalasi <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-unit-nama"
              type="text"
              placeholder="cth: Ruangan Rawat Inap Dahlia / Unit Hemodialisa"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kepala Ruangan / Koordinator / Penanggung Jawab
            </label>
            <input
              id="input-unit-kepala"
              type="text"
              placeholder="cth: Ns. Nama Lengkap, S.Kep"
              value={kepalaRuangan}
              onChange={(e) => setKepalaRuangan(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-save-unit"
              type="submit"
              className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                isEdit ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isEdit ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Unit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

