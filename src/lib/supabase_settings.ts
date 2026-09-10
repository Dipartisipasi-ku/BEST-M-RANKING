import { supabase } from './supabase_config';
import { RolePermissions } from './rbac_config';

export const loadSettingsFromSupabase = async (key: string): Promise<any | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('app_settings').select('setting_data').eq('id', key).single();
    if (error) throw error;
    return data?.setting_data;
  } catch (error) {
    if (error?.code !== 'PGRST205' && error?.code !== '42P01') console.error(`Failed to load setting ${key} from Supabase:`, error);
    return null;
  }
};

export const saveSettingsToSupabase = async (key: string, data: any): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('app_settings').upsert({
      id: key,
      setting_data: data,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
    return true;
  } catch (error) {
    if (error?.code !== 'PGRST205' && error?.code !== '42P01') console.error(`Failed to save setting ${key} to Supabase:`, error);
    return false;
  }
};
