/**
 * ════════════════════════════════════════════════════════════════
 *  GatekeeperService - خدمة البوابة والحركة (نسخة SDK جديدة)
 *  Domain: Gatekeeper
 *  تشمل: gatekeeper_sessions, gatekeeper_visitor_logs, movements_log, employee_breaks
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService, getCurrentTenantId } from './BaseService';
import { supabase } from '../supabase/supabase';

// ─────────────────────────────────────────────────
//  Gatekeeper Sessions
// ─────────────────────────────────────────────────

class GatekeeperSessionService extends BaseService {
  constructor() {
    super('gatekeeper_sessions');
  }

  /**
   * جلب الجلسات النشطة
   */
  async findActiveSessions(): Promise<any[]> {
    return this.findAll({
      filters: { is_active: true },
      orderBy: 'started_at',
      ascending: false,
    });
  }

  /**
   * جلب الجلسات المنتهية
   */
  async findEndedSessions(): Promise<any[]> {
    return this.findAll({
      filters: { is_active: false },
      orderBy: 'ended_at',
      ascending: false,
    });
  }

  /**
   * إنشاء جلسة جديدة
   */
  async createSession(data: Record<string, unknown>): Promise<any> {
    return this.create(data);
  }

  /**
   * إنهاء جلسة
   */
  async endSession(id: string): Promise<any> {
    return this.update(id, {
      is_active: false,
      ended_at: new Date().toISOString(),
    } as unknown as Record<string, unknown>);
  }

  /**
   * تحديث حالة التسليم
   */
  async updateHandoverStatus(id: string, status: string, tempPin?: string): Promise<any> {
    const data: Record<string, unknown> = { handover_status: status };
    if (tempPin) data.temp_pin = tempPin;
    return this.update(id, data);
  }
}

// ─────────────────────────────────────────────────
//  Gatekeeper Visitor Logs
// ─────────────────────────────────────────────────

class GatekeeperVisitorLogService extends BaseService {
  constructor() {
    super('gatekeeper_visitor_logs');
  }

  /**
   * جلب سجلات الزوار
   */
  async findVisitorLogs(options?: {
    sessionId?: string;
    fromDate?: string;
  }): Promise<any[]> {
    const filters: Record<string, unknown> = {};
    if (options?.sessionId) filters.session_id = options.sessionId;
    return this.findAll({
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      orderBy: 'check_in_time',
      ascending: false,
    });
  }

  /**
   * إنشاء سجل زائر جديد
   */
  async createVisitorLog(data: Record<string, unknown>): Promise<any> {
    return this.create(data);
  }

  /**
   * تحديث حالة سجل الزائر
   */
  async updateVisitorLogStatus(id: string, status: string): Promise<any> {
    return this.update(id, { status, check_out_time: new Date().toISOString() } as unknown as Record<string, unknown>);
  }

  /**
   * حذف سجل زائر
   */
  async deleteVisitorLog(id: string): Promise<boolean> {
    return this.delete(id);
  }

  /**
   * عدد الزوار منذ تاريخ محدد
   */
  async countVisitorsSince(fromDate: string): Promise<number> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('check_in_time', fromDate);

      const tenantId = getCurrentTenantId();
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('GatekeeperVisitorLogService.countVisitorsSince error:', error);
      return 0;
    }
  }
}

// ─────────────────────────────────────────────────
//  Movements Log
// ─────────────────────────────────────────────────

class MovementLogService extends BaseService {
  constructor() {
    super('movements_log');
  }

  /**
   * جلب سجلات الحركة
   */
  async findMovements(options?: {
    fromDate?: string;
    employeeId?: string;
  }): Promise<any[]> {
    const filters: Record<string, unknown> = {};
    if (options?.employeeId) filters.employee_id = options.employeeId;
    return this.findAll({
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      orderBy: 'departure_at',
      ascending: false,
    });
  }

  /**
   * تسجيل حركة جديدة
   */
  async recordMovement(data: Record<string, unknown>): Promise<any> {
    return this.create(data);
  }

  /**
   * تسجيل عودة
   */
  async recordReturn(id: string | number, notes?: string): Promise<any> {
    return this.update(String(id), {
      returned_at: new Date().toISOString(),
      notes: notes || null,
    } as unknown as Record<string, unknown>);
  }

  /**
   * عدد الحركات منذ تاريخ محدد
   */
  async countMovementsSince(fromDate: string): Promise<number> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('departure_at', fromDate);

      const tenantId = getCurrentTenantId();
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('MovementLogService.countMovementsSince error:', error);
      return 0;
    }
  }
}

// ─────────────────────────────────────────────────
//  Employee Breaks
// ─────────────────────────────────────────────────

class EmployeeBreakService extends BaseService {
  constructor() {
    super('employee_breaks');
  }

  /**
   * جلب الاستراحات النشطة
   */
  async findActiveBreaks(): Promise<any[]> {
    return this.findAll({
      filters: { status: 'active' },
      orderBy: 'started_at',
      ascending: false,
    });
  }

  /**
   * تحديث حالة الاستراحة
   */
  async updateBreakStatus(id: string, status: string, outTime?: string): Promise<any> {
    const data: Record<string, unknown> = { status };
    if (outTime) data.out_time = outTime;
    return this.update(id, data);
  }
}

// ─────────────────────────────────────────────────
//  التصدير
// ─────────────────────────────────────────────────

export const gatekeeperSessionService = new GatekeeperSessionService();
export const gatekeeperVisitorLogService = new GatekeeperVisitorLogService();
export const movementLogService = new MovementLogService();
export const employeeBreakService = new EmployeeBreakService();