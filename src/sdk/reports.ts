/**
 * ════════════════════════════════════════════════════════════════
 *  Reports SDK - دوال التقارير والتحليلات
 * ════════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase';

/**
 * جلب جميع البلاغات (incidents) مع بيانات المبلغ
 */
export async function fetchAllIncidents() {
  const { data, error } = await supabase
    .from('incidents')
    .select('*, reporter:profiles!reported_by(full_name, department)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * جلب جميع إدخالات الصحة النفسية مع بيانات الموظف
 */
export async function fetchAllWellnessEntries() {
  const { data, error } = await supabase
    .from('wellness_entries')
    .select('*, profiles(full_name, department)')
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * جلب سجلات الحضور مع بيانات الموظف
 */
export async function fetchAllTimeLogs() {
  const { data, error } = await supabase
    .from('time_logs')
    .select('*, profiles!employee_id(full_name, department)')
    .order('timestamp', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * جلب إحصائيات سريعة للوحة التحكم
 */
export async function fetchDashboardStats() {
  const [
    { count: problemsCount },
    { count: resolvedCount },
    { count: wellnessCount },
    { count: employeesCount },
  ] = await Promise.all([
    supabase.from('incidents').select('*', { count: 'exact', head: true }),
    supabase.from('incidents').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    supabase.from('wellness_entries').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  return {
    problemsCount: problemsCount || 0,
    resolvedCount: resolvedCount || 0,
    wellnessCount: wellnessCount || 0,
    employeesCount: employeesCount || 0,
  };
}