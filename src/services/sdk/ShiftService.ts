/**
 * ════════════════════════════════════════════════════════════════
 *  ShiftService - خدمة الورديات (نسخة SDK جديدة)
 *  Domain: Shift
 *  تشمل: shift_assignments
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService } from './BaseService';

class ShiftAssignmentService extends BaseService {
  constructor() { super('shift_assignments'); }
  async findAllAssignments(): Promise<any[]> {
    return this.findAll({ orderBy: 'created_at', ascending: false });
  }
  async upsertAssignment(data: Record<string, unknown>): Promise<any> {
    return this.create(data);
  }
}

export const shiftAssignmentService = new ShiftAssignmentService();