/**
 * ════════════════════════════════════════════════════════════════
 *  AttendanceService - خدمة الحضور والانصراف (نسخة SDK جديدة)
 *  مسؤولة عن: Attendance Logs, Summary, Statistics
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService } from './BaseService';

class AttendanceService extends BaseService {
  constructor() {
    super('attendance_logs');
  }

  // ─────────────────────────────────────────────────
  //  Attendance Logs
  // ─────────────────────────────────────────────────

  /**
   * جلب سجلات الحضور لموظف معين
   */
  async findLogsByEmployee(employeeId: string, options?: {
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }): Promise<any[]> {
    return this.findAll({
      filters: { employee_id: employeeId },
      orderBy: 'punch_time',
      ascending: false,
      limit: options?.limit || 100,
    });
  }

  /**
   * جلب آخر بصمة لموظف
   */
  async findLastPunch(employeeId: string): Promise<any | null> {
    const logs = await this.findAll({
      filters: { employee_id: employeeId },
      orderBy: 'punch_time',
      ascending: false,
      limit: 1,
    });
    return logs.length > 0 ? logs[0] : null;
  }

  /**
   * إنشاء سجل حضور جديد
   */
  async recordPunch(data: {
    employee_id: string;
    punch_time: string;
    shift_type?: string;
    shift_date: string;
    device_id?: string;
    verification_type?: string;
    source?: string;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }
}

// ─────────────────────────────────────────────────
//  Attendance Summary Service
// ─────────────────────────────────────────────────

class AttendanceSummaryService extends BaseService {
  constructor() {
    super('attendance_summary');
  }

  /**
   * جلب ملخص الحضور لموظف في نطاق تاريخ
   */
  async findSummaryByEmployee(employeeId: string, options?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<any[]> {
    return this.findAll({
      filters: { employee_id: employeeId },
      orderBy: 'shift_date',
      ascending: false,
    });
  }

  /**
   * إحصائيات الحضور ليوم معين
   */
  async getDailyStats(date: string): Promise<any> {
    const records = await this.findAll({
      filters: { shift_date: date },
    });

    const total = records.length;
    const present = records.filter((r: any) => r.status === 'حضور_بوقت').length;
    const late = records.filter((r: any) => r.status === 'متأخر').length;
    const absent = records.filter((r: any) => r.status === 'غائب').length;

    return { date, total, present, late, absent };
  }

  /**
   * تحديث ملخص الموظف ليوم معين
   */
  async updateSummary(employeeId: string, shiftDate: string, data: Record<string, unknown>): Promise<any> {
    const records = await this.findAll({
      filters: { employee_id: employeeId, shift_date: shiftDate },
      limit: 1,
    });

    if (records.length > 0) {
      return this.update(records[0].id, data);
    }

    return this.create({
      employee_id: employeeId,
      shift_date: shiftDate,
      ...data,
    } as unknown as Record<string, unknown>);
  }
}

export const attendanceService = new AttendanceService();
export const attendanceSummaryService = new AttendanceSummaryService();