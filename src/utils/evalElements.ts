import { loadSettingsFromSupabase, saveSettingsToSupabase } from '../lib/supabase_settings';

export const DEFAULT_EVAL_ELEMENTS_CONFIG: any = {
  scale: [
    {
      id: 'seragamSesuaiKetentuan',
      title: 'Seragam Sesuai Ketentuan RS',
      subtitle: '(Skala 1 - 5)'
    },
    {
      id: 'atributKerjaSesuaiKetentuan',
      title: 'Atribut Kerja (Name Tag, Pin, ID)',
      subtitle: '(Skala 1 - 5)'
    },
    {
      id: 'sepatuSaatPelayanan',
      title: 'Sepatu Saat Pelayanan',
      subtitle: '(Skala 1 - 5)'
    },
    {
      id: 'salamPrimaLingkunganRS',
      title: 'Menerapkan Salam Prima',
      subtitle: '(Skala 1 - 5)'
    }
  ],
  booleanTitle: 'Etika & Kewajiban',
  booleanSubtitle: '(Ya / Tidak)',
  booleans: [
    { id: 'identitasIdCard', label: 'Identitas / ID Card saat bertugas' },
    { id: 'pinAtributLogo', label: 'Pin / Atribut / Logo Pelayanan' },
    { id: 'menerapkanSalamPrima', label: 'Menerapkan Salam Prima' },
    { id: 'seragamKerjaAturan', label: 'Seragam Kerja sesuai Aturan' },
    { id: 'ramahSopanMenghormati', label: 'Ramah, Sopan & Menghormati' },
    { id: 'tanggungJawabJujurProfesional', label: 'Tanggung Jawab & Profesional' },
    { id: 'tidakTerimaHadiah', label: 'Tidak Terima Hadiah / Tip' },
    { id: 'pelayananSesuaiKewenangan', label: 'Pelayanan Sesuai Kewenangan' },
    { id: 'memenuhiPanggilanKedinasan', label: 'Memenuhi Panggilan Kedinasan' },
    { id: 'bekerjaPenuhTanggungJawab', label: 'Bekerja Penuh Tanggung Jawab' }
  ]
};

let cachedEvalConfig: any | null = null;

export const loadEvalElementsConfig = async (): Promise<any> => {
  const remote = await loadSettingsFromSupabase('evalElementsConfig');
  
  if (remote && remote.scale) {
    if (!remote.booleans) remote.booleans = DEFAULT_EVAL_ELEMENTS_CONFIG.booleans;
    if (!remote.booleanTitle) remote.booleanTitle = DEFAULT_EVAL_ELEMENTS_CONFIG.booleanTitle;
    if (!remote.booleanSubtitle) remote.booleanSubtitle = DEFAULT_EVAL_ELEMENTS_CONFIG.booleanSubtitle;

    cachedEvalConfig = remote;
    return remote;
  }
  
  const stored = localStorage.getItem('evalElementsConfig');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      
  if (parsed && parsed.scale) {
    if (!parsed.booleans) parsed.booleans = DEFAULT_EVAL_ELEMENTS_CONFIG.booleans;
    if (!parsed.booleanTitle) parsed.booleanTitle = DEFAULT_EVAL_ELEMENTS_CONFIG.booleanTitle;
    if (!parsed.booleanSubtitle) parsed.booleanSubtitle = DEFAULT_EVAL_ELEMENTS_CONFIG.booleanSubtitle;

        cachedEvalConfig = parsed;
        return parsed;
      }
    } catch (e) {}
  }
  
  cachedEvalConfig = DEFAULT_EVAL_ELEMENTS_CONFIG;
  return DEFAULT_EVAL_ELEMENTS_CONFIG;
};

// Synchronous getter for fast renders (uses cache)
export const getStoredEvalElements = (): any => {
  if (cachedEvalConfig) return cachedEvalConfig;
  const stored = localStorage.getItem('evalElementsConfig');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      
  if (parsed && parsed.scale) {
    if (!parsed.booleans) parsed.booleans = DEFAULT_EVAL_ELEMENTS_CONFIG.booleans;
    if (!parsed.booleanTitle) parsed.booleanTitle = DEFAULT_EVAL_ELEMENTS_CONFIG.booleanTitle;
    if (!parsed.booleanSubtitle) parsed.booleanSubtitle = DEFAULT_EVAL_ELEMENTS_CONFIG.booleanSubtitle;

        return parsed;
      }
    } catch (e) {}
  }
  return DEFAULT_EVAL_ELEMENTS_CONFIG;
};

export const saveStoredEvalElements = async (data: any): Promise<void> => {
  cachedEvalConfig = data;
  await saveSettingsToSupabase('evalElementsConfig', data);
  localStorage.setItem('evalElementsConfig', JSON.stringify(data));
};
