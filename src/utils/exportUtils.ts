import { EvaluationRecord, Unit } from '../types';

export function exportToCSV(records: EvaluationRecord[], unitName: string = 'Semua-Unit') {
  const headers = [
    'No',
    'Ruangan / Unit / Instalasi',
    'DAFTAR NAMA',
    'NIP',
    'Jabatan',
    'Tanggal',
    'Shift',
    'MENGGUNAKAN SERAGAM SESUAI KETENTUAN RUMAH SAKIT',
    'MENGGUNAKAN ATRIBUT KERJA SESUAI KETENTUAN RUMAH SAKIT (NAME TAG, PIN KORPRI DAN ID CARD)',
    'MENGGUNAKAN SEPATU SAAT MEMBERIKAN PELAYANAN KEPADA TAMU ATAU PENGUNJUNG DAN KEPADA PASIEN DI LINGKUNGAN RUMAH SAKIT',
    'MENERAPKAN SALAM PRIMA DI LINGKUNGAN RUMAH SAKIT',
    'menggunakan identitas nama/ id card/tanda pengenal saat bertugas',
    'Menerapkan salam prima',
    'Menggunakan seragam kerja sesuai aturan yang berlaku',
    'Bersikap ramah, sopan dan menghormati pasien / pengunjung',
    'melaksanakan tugas dengan penuh tanggung jawab, jujur dan profesional,',
    'Tidak menerima hadiah, uang, atau imbalan dalam bentuk apapun',
    'Melaksanakan pelayanan sesuai tugas dan kewenangan yang diberikan',
    'Memenuhi panggilan untuk hadir atau melaksanakan perintah kedinasan atau rapat unit sesuai ketentuan',
    'Bekerja dengan penuh tanggungjawab',
    'Catatan Khusus',
  ];

  const rows = records.map((rec, index) => [
    index + 1,
    `"${rec.unitNama.replace(/"/g, '""')}"`,
    `"${rec.nama.replace(/"/g, '""')}"`,
    `"${(rec.nip || '-').replace(/"/g, '""')}"`,
    `"${(rec.jabatan || '-').replace(/"/g, '""')}"`,
    rec.tanggal,
    rec.shift || '-',
    rec.seragamSesuaiKetentuan,
    rec.atributKerjaSesuaiKetentuan,
    rec.sepatuSaatPelayanan,
    rec.salamPrimaLingkunganRS,
    rec.identitasIdCard,
    rec.menerapkanSalamPrima,
    rec.seragamKerjaAturan,
    rec.ramahSopanMenghormati,
    rec.tanggungJawabJujurProfesional,
    rec.tidakTerimaHadiah,
    rec.pelayananSesuaiKewenangan,
    rec.memenuhiPanggilanKedinasan,
    rec.bekerjaPenuhTanggungJawab,
    `"${(rec.catatan || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanUnitName = unitName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `rekap_evaluasi_kepatuhan_${cleanUnitName}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
