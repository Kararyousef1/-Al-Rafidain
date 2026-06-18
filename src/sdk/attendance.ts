/**
 * ════════════════════════════════════════════════════════════════
 *  Attendance SDK - دوال الحضور والانصراف
 * ════════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase';

export interface AttendanceRecord {
  id: number;
  employee_id: string;
  punch_time: string;
  punch_type: string;
  shift_type: string;
  shift_date: string;
  device_id?: string;
  verification_type: string;
  source: string;
  created_at: string;
}

export interface AttendanceSummary {
  id: number;
  employee_id: string;
  shift_date: string;
  shift_type?: string;
  check_in?: string;
  check_out?: string;
  total_hours?: number;
  late_minutes?: number;
  early_leave_minutes?: number;
  overtime_minutes?: number;
  status: string;
  updated_at: string;
}

/**
 * جلب سجلات الحضور لموظف معين
 */
export async function fetchEmployeeAttendance(
  employeeId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AttendanceRecord[]> {
  let query = supabase
    .from('attendance_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .order('punch_time', { ascending: false });

  if (dateFrom) query = query.gte('shift_date', dateFrom);
  if (dateTo) query = query.lte('shift_date', dateTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * جلب ملخص الحضور لموظف في نطاق تاريخي
 */
export async function fetchAttendanceSummary(
  employeeId: string,
  dateFrom: string,
  dateTo: string
): Promise<AttendanceSummary[]> {
  const { data, error } = await supabase
    .from('attendance_summary')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('shift_date', dateFrom)
    .lte('shift_date', dateTo)
    .order('shift_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * جلب ملخص الحضور ليوم محدد (جميع الموظفين)
 */
export async function fetchDailyAttendance(date: string): Promise<AttendanceSummary[]> {
  const { data, error } = await supabase
    .from('attendance_summary')
    .select('*, employees!inner(first_name, last_name, employee_code)')
    .eq('shift_date', date);

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * إحصائيات الحضور السريعة ليوم معين
 */
export async function getDailyStats(date: string) {
  const { data, error } = await supabase
    .rpc('get_daily_attendance_stats', { p_date: date });

  if (error) throw new Error(error.message);
  return data;
}