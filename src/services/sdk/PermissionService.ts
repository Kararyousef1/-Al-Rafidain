/**
 * ════════════════════════════════════════════════════════════════
 *  PermissionService - خدمة الزمنيات والأذونات (نسخة SDK جديدة)
 *  مسؤولة عن: Permission Requests, Approval, History
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService } from './BaseService';

class PermissionService extends BaseService {
  constructor() {
    super('permissions');
  }

  /**
   * جلب زمنيات موظف معين
   */
  async findPermissionsByEmployee(employeeId: string): Promise<any[]> {
    return this.findAll({
      filters: { employee_id: employeeId },
      orderBy: 'date',
      ascending: false,
    });
  }

  /**
   * إنشاء طلب زمنية جديد
   */
  async createPermission(data: {
    employee_id: string;
    date: string;
    permission_type: string;
    expected_out_time: string;
    expected_return_time?: string;
    reason: string;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }

  /**
   * الموافقة على زمنية
   */
  async approvePermission(id: string, approvedBy: string): Promise<any> {
    return this.update(id, {
      status: 'موافق',
      approved_by: approvedBy,
    } as unknown as Record<string, unknown>);
  }

  /**
   * رفض زمنية
   */
  async rejectPermission(id: string, approvedBy: string, reason?: string): Promise<any> {
    return this.update(id, {
      status: 'مرفوض',
      approved_by: approvedBy,
      rejection_reason: reason || null,
    } as unknown as Record<string, unknown>);
  }

  /**
   * إحصائيات الزمنيات لموظف
   */
  async getPermissionStats(employeeId: string): Promise<any> {
    const permissions = await this.findPermissionsByEmployee(employeeId);
    return {
      total: permissions.length,
      approved: permissions.filter((p: any) => p.status === 'موافق').length,
      rejected: permissions.filter((p: any) => p.status === 'مرفوض').length,
      pending: permissions.filter((p: any) => p.status === 'انتظار').length,
    };
  }
}

// ─────────────────────────────────────────────────
//  Permission Request Service (طلبات الزمنيات)
// ─────────────────────────────────────────────────

class PermissionRequestService extends BaseService {
  constructor() {
    super('permissions_request');
  }

  /**
   * جلب طلبات زمنية موظف
   */
  async findRequestsByEmployee(employeeId: string): Promise<any[]> {
    return this.findAll({
      filters: { employee_id: employeeId },
      orderBy: 'created_at',
      ascending: false,
    });
  }

  /**
   * إنشاء طلب زمنية
   */
  async createRequest(data: {
    employee_id: string;
    employee_name?: string;
    employee_department?: string;
    date: string;
    permission_type: string;
    expected_out_time: string;
    expected_return_time?: string;
    reason: string;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }

  /**
   * الموافقة على طلب زمنية
   */
  async approveRequest(id: string, approvedBy: string): Promise<any> {
    return this.update(id, {
      status: 'موافق',
      approved_by: approvedBy,
      reviewed_at: new Date().toISOString(),
    } as unknown as Record<string, unknown>);
  }

  /**
   * رفض طلب زمنية
   */
  async rejectRequest(id: string, approvedBy: string, reason?: string): Promise<any> {
    return this.update(id, {
      status: 'مرفوض',
      approved_by: approvedBy,
      rejection_reason: reason || null,
      reviewed_at: new Date().toISOString(),
    } as unknown as Record<string, unknown>);
  }
}

export const permissionService = new PermissionService();
export const permissionRequestService = new PermissionRequestService();