/**
 * ════════════════════════════════════════════════════════════════
 *  IncidentService - خدمة إدارة البلاغات (نسخة SDK جديدة)
 *  مسؤولة عن: CRUD للبلاغات والتعليقات
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService } from './BaseService';

class IncidentService extends BaseService {
  constructor() {
    super('incidents');
  }

  /**
   * جلب بلاغات موظف معين
   */
  async findByEmployee(employeeId: string): Promise<any[]> {
    return this.findAll({
      filters: { employee_id: employeeId },
      orderBy: 'created_at',
      ascending: false,
    });
  }

  /**
   * جلب البلاغات المعلقة
   */
  async findPending(): Promise<any[]> {
    return this.findAll({
      filters: { status: 'pending' },
      orderBy: 'created_at',
      ascending: false,
    });
  }

  /**
   * إنشاء بلاغ جديد
   */
  async createIncident(data: {
    title: string;
    description: string;
    category?: string;
    severity?: string;
    employee_id?: string;
    is_anonymous?: boolean;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }

  /**
   * تحديث حالة بلاغ
   */
  async updateStatus(id: string, status: string): Promise<any> {
    const updateData: Record<string, unknown> = { status };
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }
    return this.update(id, updateData);
  }

  /**
   * إحصائيات سريعة
   */
  async getStats(): Promise<{ total: number; pending: number; resolved: number }> {
    const total = await this.count();
    const pending = await this.count({ status: 'pending' });
    const resolved = await this.count({ status: 'resolved' });
    return { total, pending, resolved };
  }
}

export const incidentService = new IncidentService();