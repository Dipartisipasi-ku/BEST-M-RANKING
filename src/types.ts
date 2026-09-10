export interface Unit {
  id: string;
  nama: string;
  kategori: 'Instalasi' | 'Ruangan' | 'Unit';
  lokasi?: string;
  kepalaRuangan?: string;
}

export interface StaffMember {
  id: string;
  unitId: string;
  nama: string;
  nip: string;
  jabatan: string;
  role?: string;
}

export interface AuthSession {
  role: 'super_admin' | 'komite_mutu' | 'kepala_ruangan' | 'staf_pegawai';
  unitId: string;
  unitNama: string;
  userName: string;
  nip?: string;
  jabatan?: string;
}

export interface EvaluationRecord {
  id: string;
  unitId: string;
  unitNama: string;
  nama: string;
  nip?: string;
  jabatan?: string;
  tanggal: string;
  shift?: 'Pagi' | 'Siang' | 'Malam' | 'Non-Shift';
  
  // 4 Kolom Skala Angka (1-5)
  seragamSesuaiKetentuan: number;
  atributKerjaSesuaiKetentuan: number;
  sepatuSaatPelayanan: number;
  salamPrimaLingkunganRS: number;

  // 10 Kolom Kepatuhan (Ya / Tidak) - Sesuai public.master
  identitasIdCard: 'Ya' | 'Tidak';
  pinAtributLogo?: 'Ya' | 'Tidak';
  menerapkanSalamPrima: 'Ya' | 'Tidak';
  seragamKerjaAturan: 'Ya' | 'Tidak';
  ramahSopanMenghormati: 'Ya' | 'Tidak';
  tanggungJawabJujurProfesional: 'Ya' | 'Tidak';
  tidakTerimaHadiah: 'Ya' | 'Tidak';
  pelayananSesuaiKewenangan: 'Ya' | 'Tidak';
  memenuhiPanggilanKedinasan: 'Ya' | 'Tidak';
  bekerjaPenuhTanggungJawab: 'Ya' | 'Tidak';

  catatan?: string;
  createdAt: string;
}

export const EVAL_COLUMNS_SCALE = [
  {
    key: 'seragamSesuaiKetentuan',
    label: 'MENGGUNAKAN SERAGAM SESUAI KETENTUAN RUMAH SAKIT',
    shortLabel: 'Seragam Sesuai Ketentuan RS',
    description: 'Kerapian, kesesuaian hari kerja & kelayakan seragam dinas',
  },
  {
    key: 'atributKerjaSesuaiKetentuan',
    label: 'MENGGUNAKAN ATRIBUT KERJA SESUAI KETENTUAN RUMAH SAKIT (NAME TAG, PIN KORPRI DAN ID CARD)',
    shortLabel: 'Atribut Kerja (Name Tag, Pin, ID)',
    description: 'Kelengkapan name tag, pin KORPRI/profesi, dan ID card resmi',
  },
  {
    key: 'sepatuSaatPelayanan',
    label: 'MENGGUNAKAN SEPATU SAAT MEMBERIKAN PELAYANAN KEPADA TAMU ATAU PENGUNJUNG DAN KEPADA PASIEN DI LINGKUNGAN RUMAH SAKIT',
    shortLabel: 'Penggunaan Sepatu Standar Pelayanan',
    description: 'Sepatu standar keselamatan kerja medis / tertutup / warna sesuai aturan',
  },
  {
    key: 'salamPrimaLingkunganRS',
    label: 'MENERAPKAN SALAM PRIMA DI LINGKUNGAN RUMAH SAKIT',
    shortLabel: 'Penerapan Salam Prima di Lingkungan RS',
    description: 'Senyum, Sapa, Salam, Sopan, dan Santun (5S)',
  },
] as const;

export const EVAL_COLUMNS_BOOLEAN = [
  {
    key: 'identitasIdCard',
    label: 'menggunakan identitas nama/ id card/tanda pengenal saat bertugas',
    shortLabel: 'Identitas / ID Card saat bertugas',
  },
  {
    key: 'pinAtributLogo',
    label: 'menggunakan pin / atribut / logo pelayanan sesuai ketentuan',
    shortLabel: 'Pin / Atribut / Logo Pelayanan',
  },
  {
    key: 'menerapkanSalamPrima',
    label: 'Menerapkan salam prima',
    shortLabel: 'Menerapkan salam prima',
  },
  {
    key: 'seragamKerjaAturan',
    label: 'Menggunakan seragam kerja sesuai aturan yang berlaku',
    shortLabel: 'Seragam kerja sesuai aturan',
  },
  {
    key: 'ramahSopanMenghormati',
    label: 'Bersikap ramah, sopan dan menghormati pasien / pengunjung',
    shortLabel: 'Ramah, sopan & menghormati pengunjung',
  },
  {
    key: 'tanggungJawabJujurProfesional',
    label: 'melaksanakan tugas dengan penuh tanggung jawab, jujur dan profesional,',
    shortLabel: 'Tanggung jawab, jujur & profesional',
  },
  {
    key: 'tidakTerimaHadiah',
    label: 'Tidak menerima hadiah, uang, atau imbalan dalam bentuk apapun',
    shortLabel: 'Bebas gratifikasi (tidak terima hadiah/imbalan)',
  },
  {
    key: 'pelayananSesuaiKewenangan',
    label: 'Melaksanakan pelayanan sesuai tugas dan kewenangan yang diberikan',
    shortLabel: 'Pelayanan sesuai kompetensi & kewenangan',
  },
  {
    key: 'memenuhiPanggilanKedinasan',
    label: 'Memenuhi panggilan untuk hadir atau melaksanakan perintah kedinasan atau rapat unit sesuai ketentuan',
    shortLabel: 'Hadir panggilan dinas & rapat unit',
  },
  {
    key: 'bekerjaPenuhTanggungJawab',
    label: 'Bekerja dengan penuh tanggungjawab',
    shortLabel: 'Bekerja dengan penuh tanggung jawab',
  },
] as const;

export interface EvalElement {
  id: string;
  code: string;
  text: string;
  order: number;
}

export interface EvalSection {
  id: string;
  title: string;
  elements: EvalElement[];
}

export interface EvalElementsConfig {
  sections: EvalSection[];
}
