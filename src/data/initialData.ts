import { Unit, EvaluationRecord, StaffMember } from '../types';

// Master 38 Unit / Instalasi / Ruangan resmi sesuai 3 gambar spreadsheet rumah sakit (Tanpa data dummy contoh nama pegawai)
export const INITIAL_UNITS: Unit[] = [
  // --- Gambar 2 ---
  {
    id: 'bidang-perencanaan',
    nama: 'BIDANG PERENCANAAN',
    kategori: 'Unit',
    lokasi: 'Gedung Administrasi Lantai 2',
  },
  {
    id: 'umum-dan-kepegawaian',
    nama: 'UMUM DAN KEPEGAWAIAN',
    kategori: 'Unit',
    lokasi: 'Gedung Administrasi Lantai 1',
  },
  {
    id: 'komite-medik',
    nama: 'KOMITE MEDIK',
    kategori: 'Unit',
    lokasi: 'Gedung Manajemen Lantai 2',
  },
  {
    id: 'belibis',
    nama: 'BELIBIS',
    kategori: 'Ruangan',
    lokasi: 'Gedung Rawat Inap Blok A',
  },
  {
    id: 'cendrawasih',
    nama: 'CENDRAWASIH',
    kategori: 'Ruangan',
    lokasi: 'Gedung Rawat Inap Blok B',
  },
  {
    id: 'elang',
    nama: 'ELANG',
    kategori: 'Ruangan',
    lokasi: 'Gedung Rawat Inap Blok C',
  },
  {
    id: 'enggang',
    nama: 'ENGGANG',
    kategori: 'Ruangan',
    lokasi: 'Gedung Rawat Inap Blok D',
  },
  {
    id: 'gelatik',
    nama: 'GELATIK',
    kategori: 'Ruangan',
    lokasi: 'Gedung Rawat Inap Blok E',
  },
  {
    id: 'igd',
    nama: 'IGD',
    kategori: 'Instalasi',
    lokasi: 'Gedung Gawat Darurat Lantai 1',
  },
  {
    id: 'inst-farmasi',
    nama: 'INST FARMASI',
    kategori: 'Instalasi',
    lokasi: 'Gedung Pelayanan Sentral Lantai 1',
  },
  {
    id: 'inst-gizi',
    nama: 'INST GIZI',
    kategori: 'Instalasi',
    lokasi: 'Gedung Penunjang Lantai 1',
  },
  {
    id: 'inst-k3',
    nama: 'INST K3',
    kategori: 'Instalasi',
    lokasi: 'Gedung Penunjang Lantai 2',
  },
  {
    id: 'inst-kesling',
    nama: 'INST KESLING',
    kategori: 'Instalasi',
    lokasi: 'Gedung Instalasi Sanitasi & IPAL',
  },
  {
    id: 'inst-laboratorium',
    nama: 'INST LABORATORIUM',
    kategori: 'Instalasi',
    lokasi: 'Gedung Diagnostik Lantai 1',
  },

  // --- Gambar 1 ---
  {
    id: 'inst-mcu',
    nama: 'INST MCU',
    kategori: 'Instalasi',
    lokasi: 'Gedung Rawat Jalan Lantai 2',
  },
  {
    id: 'cssd-loundry',
    nama: 'CSSD LOUNDRY',
    kategori: 'Instalasi',
    lokasi: 'Gedung Penunjang Medik Lantai 1',
  },
  {
    id: 'ipsrs',
    nama: 'IPSRS',
    kategori: 'Instalasi',
    lokasi: 'Gedung Pemeliharaan Sarana (IPSRS)',
  },
  {
    id: 'radiologi',
    nama: 'RADIOLOGI',
    kategori: 'Instalasi',
    lokasi: 'Gedung Diagnostik Lantai 1',
  },
  {
    id: 'inst-rawat-inap',
    nama: 'INST RAWAT INAP',
    kategori: 'Instalasi',
    lokasi: 'Gedung Rawat Inap Terpadu',
  },
  {
    id: 'inst-rawat-jalan',
    nama: 'INST RAWAT JALAN',
    kategori: 'Instalasi',
    lokasi: 'Gedung Poliklinik Lantai 1',
  },
  {
    id: 'rehab-medik',
    nama: 'REHAB MEDIK',
    kategori: 'Instalasi',
    lokasi: 'Gedung Fisioterapi Lantai 1',
  },
  {
    id: 'rehab-psikososial',
    nama: 'REHAB PSIKOSOSIAL',
    kategori: 'Instalasi',
    lokasi: 'Gedung Unit Rehabilitasi Psikososial',
  },
  {
    id: 'inst-napza',
    nama: 'INST NAPZA',
    kategori: 'Instalasi',
    lokasi: 'Gedung Rehabilitasi NAPZA Terpadu',
  },
  {
    id: 'pergam-napza',
    nama: 'PERGAM NAPZA',
    kategori: 'Ruangan',
    lokasi: 'Gedung NAPZA Ruangan Pergam',
  },
  {
    id: 'perlengkapan',
    nama: 'PERLENGKAPAN',
    kategori: 'Unit',
    lokasi: 'Gedung Logistik & Gudang Perlengkapan',
  },
  {
    id: 'punai',
    nama: 'PUNAI',
    kategori: 'Ruangan',
    lokasi: 'Gedung Rawat Inap Blok F',
  },
  {
    id: 'simrs',
    nama: 'SIMRS',
    kategori: 'Unit',
    lokasi: 'Gedung IT & Data Center Lantai 2',
  },
  {
    id: 'ruang-icu',
    nama: 'Ruang ICU',
    kategori: 'Ruangan',
    lokasi: 'Gedung Perawatan Intensif Lantai 2',
  },
  {
    id: 'ruang-upip',
    nama: 'Ruang upip',
    kategori: 'Ruangan',
    lokasi: 'Gedung Unit Perawatan Intensif Psikiatri',
  },

  // --- Gambar 3 ---
  {
    id: 'ruang-tiung',
    nama: 'RUANG TIUNG',
    kategori: 'Ruangan',
    lokasi: 'Gedung Rawat Inap Blok G',
  },
  {
    id: 'bagian-keamanan',
    nama: 'BAGIAN KEAMANAN',
    kategori: 'Unit',
    lokasi: 'Pos Keamanan Terpadu & CCTV',
  },
  {
    id: 'inst-rekam-medik',
    nama: 'INST REKAM MEDIK',
    kategori: 'Instalasi',
    lokasi: 'Gedung Admisi & Rekam Medik Lantai 1',
  },
  {
    id: 'bagian-keuangan',
    nama: 'BAGIAN KEUANGAN',
    kategori: 'Unit',
    lokasi: 'Gedung Administrasi Lantai 2',
  },
  {
    id: 'bidang-diklat',
    nama: 'BIDANG DIKLAT',
    kategori: 'Unit',
    lokasi: 'Gedung Aula & Diklat Lantai 3',
  },
  {
    id: 'bidang-keperawatan',
    nama: 'BIDANG KEPERAWATAN',
    kategori: 'Unit',
    lokasi: 'Gedung Administrasi Lantai 2',
  },
  {
    id: 'pelayanan-medis',
    nama: 'PELAYANAN MEDIS',
    kategori: 'Unit',
    lokasi: 'Gedung Manajemen Lantai 2',
  },
  {
    id: 'penunjang-medik',
    nama: 'PENUNJANG MEDIK',
    kategori: 'Unit',
    lokasi: 'Gedung Manajemen Penunjang Lantai 2',
  },
  {
    id: 'penunjang-non-medik',
    nama: 'PENUNJANG NON MEDIK',
    kategori: 'Unit',
    lokasi: 'Gedung Manajemen Penunjang Lantai 1',
  },
];

// Data Rekap Evaluasi Awal - Bersih tanpa data dummy
export const INITIAL_RECORDS: EvaluationRecord[] = [];

// Roster Pegawai - Kosong (Tidak ada seed data contoh nama pegawai)
export const UNIT_STAFF_ROSTER: Record<string, StaffMember[]> = {};

// Preset Akun Kepala Ruangan
export interface KepalaRuanganPreset {
  unitId: string;
  unitNama: string;
  nama: string;
  nip: string;
  jabatan: string;
}

// Tidak ada preset nama pegawai contoh
export const KEPALA_RUANGAN_PRESETS: KepalaRuanganPreset[] = [];
