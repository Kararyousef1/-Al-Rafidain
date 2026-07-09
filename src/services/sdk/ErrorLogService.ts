/**
 * ════════════════════════════════════════════════════════════════
 *  ErrorLogService - خدمة سجل الأخطاء (نسخة SDK جديدة)
 *  مسؤولة عن: CRUD لجدول error_logs
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService } from './BaseService';

class ErrorLogService extends BaseService {
  constructor() {
    super('error_logs');
  }

  /**
   * تسجيل خطأ جديد
   */
  async logError(data: {
    message: string;
    stack?: string;
    url?: string;
    user_id?: string;
    metadata?: Record<string, unknown>;
  }): Promise<any> {
    return this.create({
      message: data.message,
      stack: data.stack || null,
      url: data.url || null,
      user_id: data.user_id || null,
      metadata: data.metadata || null,
      created_at: new Date().toISOString(),
    } as unknown as Record<string, unknown>);
  }
}

export const errorLogService = new ErrorLogService();