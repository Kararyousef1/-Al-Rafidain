/**
 * ════════════════════════════════════════════════════════════════
 *  Employees SDK - إدارة بيانات الموظفين
 *  جميع دوال جلب وتحديث وإدارة معلومات الموظفين
 * ════════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import type { UserRole } from '../types';

export interface EmployeeRecord {
  id: string;
  user_id?: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name_ar?: string;
  email?: string;
  phone?: string;
  department_id?: string;
  position?: string;
  role: string;
  manager_id?: string;
  hire_date: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  departments?: { name: string };
}

export interface ProfileRecord {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  rank?: string;
  manufacturing_dept?: string;
  department?: string;
  position?: string;
  phone?: string;
  location?: string;
  profile_image?: string;
  manager_id?: string;
  supervisor_id?: string;
  department_manager_id?: string;
  shift?: string;
  status?: string;
  permissions?: string[];
  gatekeeper_type?: string;
  gatekeeper_pin?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * جلب جميع الموظفين من جدول profiles
 */
export async function fetchAllEmployees(): Promise<ProfileRecord[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * جلب موظف واحد حسب ID
 */
export async function fetchEmployeeById(id: string): Promise<ProfileRecord | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * الحصول على قائمة المديرين والمشرفين (للاختيار في القوائم)
 */
export async function fetchManagersList(): Promise<ProfileRecord[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .not('rank', 'eq', 'employee')
    .order('full_name');

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * تحديث بيانات موظف (باستخدام admin API)
 */
export async function updateEmployeeProfile(id: string, updates: Partial<ProfileRecord>) {
  if (!supabaseAdmin) throw new Error('مفتاح Service Role غير متوفر');

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}

/**
 * رفع صورة ملف تعريف
 */
export async function uploadProfileImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `employees/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('public-assets')
    .upload(path, file, { upsert: true });

  if (uploadError) throw new Error('فشل رفع الصورة');

  const { data: urlData } = supabase.storage
    .from('public-assets')
    .getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * الحصول على إحصائيات سريعة
 */
export async function getEmployeeStats() {
  const { count: total } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: active } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  return {
    total: total || 0,
    active: active || 0,
  };
}

/**
 * جلب قائمة الأقسام الفريدة
 */
export async function fetchDepartmentsList(): Promise<string[]> {
  const { data } = await supabase
    .from('profiles')
    .select('manufacturing_dept')
    .not('manufacturing_dept', 'is', null);

  const unique = [...new Set((data || []).map((d: any) => d.manufacturing_dept as string).filter(Boolean))];
  return unique;
}