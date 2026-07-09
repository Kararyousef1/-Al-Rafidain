/**
 * ════════════════════════════════════════════════════════════════
 *  LeaveService - خدمة الإجازات (نسخة SDK جديدة)
 *  مسؤولة عن: Leave Requests, Balance, Settings, Holidays
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService } from './BaseService';

class LeaveService extends BaseService {
  constructor() {
    super('leaves');
  }

  /**
   * جلب إجازات موظف معين
   */
  async findLeavesByEmployee(employeeId: string): Promise<any[]> {
    return this.findAll({
      filters: { employee_id: employeeId },
      orderBy: 'created_at',
      ascending: false,
    });
  }

  /**
   * إنشاء طلب إجازة جديد
   */
  async createLeave(data: {
    employee_id: string;
    leave_type: string;
    date_from: string;
    date_to: string;
    working_days_count?: number;
    reason?: string;
    attachment_url?: string;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }

  /**
   * الموافقة على إجازة
   */
  async approveLeave(id: string, approvedBy: string): Promise<any> {
    return this.update(id, {
      status: 'موافق',
      approved_by: approvedBy,
    } as unknown as Record<string, unknown>);
  }

  /**
   * رفض إجازة
   */
  async rejectLeave(id: string, approvedBy: string, reason?: string): Promise<any> {
    return this.update(id, {
      status: 'مرفوض',
      approved_by: approvedBy,
      rejection_reason: reason || null,
    } as unknown as Record<string, unknown>);
  }
}

// ─────────────────────────────────────────────────
//  Leave Balance Service
// ─────────────────────────────────────────────────

class LeaveBalanceService extends BaseService {
  constructor() {
    super('leave_balance');
  }

  /**
   * جلب رصيد إجازات موظف
   */
  async findBalanceByEmployee(employeeId: string, year?: number): Promise<any | null> {
    const yearValue = year || new Date().getFullYear();
    const records = await this.findAll({
      filters: { employee_id: employeeId, year: yearValue },
      limit: 1,
    });
    return records.length > 0 ? records[0] : null;
  }

  /**
   * الحصول على ملخص رصيد الإجازات
   */
  async getBalanceSummary(employeeId: string): Promise<any> {
    const currentYear = new Date().getFullYear();
    const balance = await this.findBalanceByEmployee(employeeId, currentYear);

    return {
      employee_id: employeeId,
      year: currentYear,
      annual: balance ? {
        total: balance.annual_total || 0,
        used: balance.annual_used || 0,
        pending: balance.annual_pending || 0,
        remaining: (balance.annual_total || 0) - (balance.annual_used || 0) - (balance.annual_pending || 0),
      } : { total: 0, used: 0, pending: 0, remaining: 0 },
      sick: balance ? {
        total: balance.sick_total || 30,
        used: balance.sick_used || 0,
        pending: balance.sick_pending || 0,
        remaining: (balance.sick_total || 30) - (balance.sick_used || 0) - (balance.sick_pending || 0),
      } : { total: 30, used: 0, pending: 0, remaining: 30 },
    };
  }
}

// ─────────────────────────────────────────────────
//  Leave Settings Service
// ─────────────────────────────────────────────────

class LeaveSettingsService extends BaseService {
  constructor() {
    super('leave_settings');
  }

  /**
   * جلب إعدادات نوع إجازة معين
   */
  async findSettingsByType(leaveType: string): Promise<any | null> {
    const records = await this.findAll({
      filters: { leave_type: leaveType },
      limit: 1,
    });
    return records.length > 0 ? records[0] : null;
  }

  /**
   * جلب جميع إعدادات الإجازات
   */
  async findAllSettings(): Promise<any[]> {
    return this.findAll({ orderBy: 'leave_type', ascending: true });
  }
}

// ─────────────────────────────────────────────────
//  Holiday Service
// ─────────────────────────────────────────────────

class HolidayService extends BaseService {
  constructor() {
    super('holidays');
  }

  /**
   * جلب العطل في نطاق تاريخ
   */
  async findHolidaysInRange(fromDate: string, toDate: string): Promise<any[]> {
    const all = await this.findAll({ orderBy: 'date', ascending: true });
    return all.filter((h: any) => h.date >= fromDate && h.date <= toDate);
  }

  /**
   * هل اليوم عطلة؟
   */
  async isHoliday(date: string): Promise<boolean> {
    const count = await this.count({ date });
    return count > 0;
  }
}

export const leaveService = new LeaveService();
export const leaveBalanceService = new LeaveBalanceService();
export const leaveSettingsService = new LeaveSettingsService();
export const holidayService = new HolidayService();