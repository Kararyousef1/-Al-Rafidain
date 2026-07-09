/**
 * ════════════════════════════════════════════════════════════════
 *  WellnessService - خدمة العافية (نسخة SDK جديدة)
 *  مسؤولة عن: Wellness Log, Wellness Entries
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService } from './BaseService';

class WellnessService extends BaseService {
  constructor() {
    super('wellness_log');
  }

  /**
   * جلب سجلات العافية لموظف
   */
  async findByEmployee(employeeId: string, limit: number = 30): Promise<any[]> {
    return this.findAll({
      filters: { employee_id: employeeId },
      orderBy: 'date',
      ascending: false,
      limit,
    });
  }

  /**
   * إضافة سجل عافية جديد
   */
  async logEntry(data: {
    employee_id: string;
    score: number;
    mood: string;
    stress: number;
    energy: number;
    notes?: string;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }

  /**
   * متوسط درجات العافية
   */
  async getAverageScore(employeeId: string): Promise<number> {
    const entries = await this.findByEmployee(employeeId, 30);
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum: number, e: any) => sum + (e.score || 0), 0);
    return Math.round(total / entries.length);
  }
}

// ─────────────────────────────────────────────────
//  Wellness Entries Service (جدول wellness_entries)
//  موسّع ضمن نفس Domain Wellness
// ─────────────────────────────────────────────────

class WellnessEntryService extends BaseService {
  constructor() {
    super('wellness_entries');
  }

  /**
   * جلب جميع سجلات العافية
   */
  async findAllEntries(): Promise<any[]> {
    return this.findAll({
      orderBy: 'date',
      ascending: false,
    });
  }

  /**
   * جلب سجلات العافية لموظف
   */
  async findByEmployee(employeeId: string): Promise<any[]> {
    return this.findAll({
      filters: { employee_id: employeeId },
      orderBy: 'date',
      ascending: false,
    });
  }

  /**
   * جلب سجل اليوم لمستخدم (حسب user_id + date)
   */
  async getTodayEntry(userId: string, date: string): Promise<any | null> {
    const records = await this.findAll({
      filters: { user_id: userId, date },
      limit: 1,
    });
    return records.length > 0 ? records[0] : null;
  }

  /**
   * حفظ سجل اليوم (إنشاء أو تحديث)
   */
  async saveEntry(userId: string, data: Record<string, unknown>): Promise<any> {
    const date = data.date as string;
    const existing = await this.getTodayEntry(userId, date);
    if (existing) {
      return this.update(existing.id, { ...data, updated_at: new Date().toISOString() });
    }
    return this.create({ ...data, user_id: userId, created_at: new Date().toISOString() });
  }

  /**
   * جلب سجلات مستخدم
   */
  async findByUser(userId: string, limit: number = 30): Promise<any[]> {
    return this.findAll({
      filters: { user_id: userId },
      orderBy: 'date',
      ascending: false,
      limit,
    });
  }

  /**
   * حذف سجل مع التأكد من ملكيته
   */
  async deleteEntry(id: string, userId?: string): Promise<boolean> {
    if (userId) {
      const entry = await this.findById(id);
      if (!entry || entry.user_id !== userId) return false;
    }
    return this.delete(id);
  }

  /**
   * إحصائيات سريعة (متوسط آخر N سجل)
   */
  async getStats(userId: string, days: number = 7): Promise<{ avgScore: number; count: number }> {
    const records = await this.findByUser(userId, days);
    const scores = records.map((r: any) => r.score || 0);
    const count = scores.length;
    const avgScore = count > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / count) : 0;
    return { avgScore, count };
  }
}

export const wellnessService = new WellnessService();
export const wellnessEntryService = new WellnessEntryService();
