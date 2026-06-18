/**
 * ════════════════════════════════════════════════════════════════
 *  Settings SDK - إعدادات النظام
 * ════════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase';

export interface SystemSettings {
  systemName: string;
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  anonymousReports: boolean;
  aiAnalysis: boolean;
  autoAssign: boolean;
  maxFileSize: string;
  sessionTimeout: string;
  maintenanceMode: boolean;
}

/**
 * جلب إعدادات النظام العامة
 */
export async function fetchGeneralSettings(): Promise<Partial<SystemSettings> | null> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('general_settings')
    .eq('id', 'singleton')
    .single();

  if (error) {
    console.warn('⚠️ فشل جلب الإعدادات:', error.message);
    return null;
  }

  return data?.general_settings || null;
}

/**
 * حفظ إعدادات النظام العامة
 */
export async function saveGeneralSettings(settings: Partial<SystemSettings>): Promise<void> {
  const { error } = await supabase
    .from('system_settings')
    .update({ general_settings: settings })
    .eq('id', 'singleton');

  if (error) throw error;
}

/**
 * جلب إعدادات الصفحة الرئيسية (Landing Page)
 */
export async function fetchLandingConfig() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('landing_config')
    .eq('id', 'singleton')
    .single();

  if (error) return null;
  return data?.landing_config || null;
}

/**
 * حفظ إعدادات الصفحة الرئيسية
 */
export async function saveLandingConfig(config: any): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('system_settings')
    .upsert(
      { id: 'singleton', landing_config: config, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );

  if (error) {
    return { success: false, error: `خطأ RLS: ${error.message}` };
  }

  return { success: true };
}

/**
 * رفع صورة إلى التخزين
 */
export async function uploadFile(file: File, path: string): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('public-assets')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
}