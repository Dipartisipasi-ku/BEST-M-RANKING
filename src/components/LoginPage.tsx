import React, { useState } from 'react';
import { Hospital, ShieldCheck, Building2, UserCheck, ArrowRight, Shield, Users, Lock, Stethoscope } from 'lucide-react';
import { Unit, AuthSession } from '../types';
import { supabase, AppRole } from '../lib/supabase_config';

interface LoginPageProps {
  units?: Unit[];
  onLogin: (session: AuthSession) => void;
  
}

export const LoginPage: React.FC<LoginPageProps> = ({ units, onLogin,  }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<AppRole>('kepala_ruangan');
  const [unitId, setUnitId] = useState<string>('');
  const [staffList, setStaffList] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase belum dikonfigurasi. Silakan atur variabel lingkungan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (isRegistering) {
        // Sign Up (Real Supabase Auth)
        if (role === 'kepala_ruangan' && unitId) {
          const { data: existingProfiles, error: countError } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'kepala_ruangan')
            .eq('unit_id', unitId)
            .limit(1);
            
          if (!countError && existingProfiles && existingProfiles.length > 0) {
            setError('Pendaftaran ditolak: Sudah ada akun Kepala Ruangan untuk unit/instalasi yang dipilih. Hanya diperbolehkan maksimal 1 (satu) Kepala Ruangan per unit.');
            setIsLoading(false);
            return;
          }
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
              unit_id: (role === 'kepala_ruangan' || role === 'staf_pegawai') ? unitId : null
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (data.session) {
          await processLogin(data.session.user);
        } else {
          setError('Registrasi berhasil! Silakan periksa email Anda untuk verifikasi (atau langsung login jika tidak butuh verifikasi email).');
          setIsRegistering(false);
        }
      } else {
        // Sign In
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) throw signInError;
        if (data.user) {
          await processLogin(data.user);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || 'Gagal masuk. Periksa kembali email dan password.');
    } finally {
      setIsLoading(false);
    }
  };

  const processLogin = async (user: any) => {
    if (!supabase) return;
    
    // Fetch profile from public.profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.error("Failed to load profile:", error);
      // Fallback if trigger didn't run for some reason
      onLogin({
        role: user.user_metadata?.role || 'staf_pegawai',
        unitId: user.user_metadata?.unit_id || 'all',
        unitNama: 'Belum diatur',
        userName: user.user_metadata?.full_name || user.email || 'Pengguna'
      });
      return;
    }
    
    const unitName = units?.find(u => u.id === profile.unit_id)?.nama || 'Semua Unit';
    
    onLogin({
      role: profile.role,
      unitId: profile.unit_id || 'all',
      unitNama: unitName,
      userName: profile.full_name,
      nip: profile.nip,
      jabatan: profile.jabatan
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/5 w-full max-w-5xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
        
        {/* Left Side: Branding */}
        <div className="w-full md:w-1/2 bg-blue-600 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-blue-700/20"></div>
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-50 mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-800 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 mb-8 shadow-xl">
              <Hospital className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Sistem Evaluasi<br />
              <span className="text-blue-200">Kepatuhan Pegawai</span>
            </h1>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed max-w-sm">
              Sistem terpadu untuk Komite Mutu dan Kepala Ruangan dalam mengelola dan memantau kepatuhan standar pelayanan.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <ShieldCheck className="w-6 h-6 text-blue-200 mb-2" />
              <h3 className="font-bold text-sm mb-1">Aman & Terpusat</h3>
              <p className="text-xs text-blue-100">Data tersimpan di Supabase Cloud</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <UserCheck className="w-6 h-6 text-blue-200 mb-2" />
              <h3 className="font-bold text-sm mb-1">Berbasis Peran</h3>
              <p className="text-xs text-blue-100">Akses sesuai otoritas RBAC</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              {isRegistering ? 'Daftar Akun Baru' : 'Selamat Datang Kembali'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {isRegistering ? 'Isi formulir di bawah untuk mendaftarkan akun di sistem.' : 'Silakan login menggunakan akun Supabase Anda.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex gap-3 text-rose-700">
              <Shield className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                  {role === 'staf_pegawai' && unitId ? (
                    staffList.length > 0 ? (
                      <select
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">-- Pilih Nama Anda --</option>
                        {staffList.map((s, i) => (
                          <option key={i} value={s.nama}>{s.nama} {s.nip ? `(${s.nip})` : ''}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-medium border border-rose-100">
                        Belum ada data pegawai di ruangan ini. Kepala Ruangan harus menginput nama Anda terlebih dahulu.
                      </div>
                    )
                  ) : (
                    <input
                      type="text"
                      required={role !== 'staf_pegawai'}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder={role === 'staf_pegawai' ? "Pilih ruangan terlebih dahulu" : "Ns. Nama Lengkap, S.Kep"}
                      disabled={role === 'staf_pegawai'}
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Pilih Peran (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => {
                      const newRole = e.target.value as AppRole;
                      setRole(newRole);
                      if (newRole === 'staf_pegawai' && unitId) {
                        try {
                          const saved = localStorage.getItem(`unit_staff_${unitId}`);
                          setStaffList(saved ? JSON.parse(saved) : []);
                          setFullName(''); // reset selected staff
                        } catch { setStaffList([]); }
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="kepala_ruangan">Kepala Ruangan</option>
                    
                    <option value="staf_pegawai">Staf / Pegawai</option>
                  </select>
                </div>
                
                {(role === 'kepala_ruangan' || role === 'staf_pegawai') && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Ruangan / Unit Tugas</label>
                    <select
                      required
                      value={unitId}
                      onChange={(e) => {
                        const newUnitId = e.target.value;
                        setUnitId(newUnitId);
                        if (role === 'staf_pegawai' && newUnitId) {
                          try {
                            const saved = localStorage.getItem(`unit_staff_${newUnitId}`);
                            setStaffList(saved ? JSON.parse(saved) : []);
                            setFullName(''); // reset selected staff
                          } catch { setStaffList([]); }
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">-- Pilih Ruangan --</option>
                      {units?.map(u => (
                        <option key={u.id} value={u.id}>{u.nama} ({u.kategori})</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="email@rumahsakit.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Minimal 6 karakter"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || (isRegistering && role === 'staf_pegawai' && !fullName)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 mt-6 shadow-sm shadow-blue-200 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>{isRegistering ? 'Daftar Sekarang' : 'Masuk ke Sistem'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isRegistering ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              {isRegistering ? 'Login di sini' : 'Daftar di sini'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
