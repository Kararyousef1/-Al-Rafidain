/**
 * ════════════════════════════════════════════════════════════════
 *  DepartmentService + SpecialtyService (Organization Domain)
 *  - DepartmentService: إدارة الأقسام
 *  - SpecialtyService: إدارة الاختصاصات الوظيفية
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService } from './BaseService';

// ─────────────────────────────────────────────────
//  Departments
// ─────────────────────────────────────────────────

class DepartmentService extends BaseService {
  constructor() {
    super('departments');
  }

  /**
   * جلب جميع الأقسام النشطة
   */
  async findAllActive(): Promise<any[]> {
    return this.findAll({
      filters: { is_active: true },
      orderBy: 'name_ar',
      ascending: true,
    });
  }

  /**
   * جلب قسم مع مديره
   */
  async findWithManager(id: string): Promise<any | null> {
    return this.findById(id);
  }

  /**
   * إنشاء قسم جديد
   */
  async createDepartment(data: {
    name_ar: string;
    name_en?: string;
    manager_id?: string;
    parent_department_id?: string;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }

  /**
   * تحديث قسم
   */
  async updateDepartment(id: string, data: Record<string, unknown>): Promise<any> {
    return this.update(id, data);
  }

  /**
   * تعطيل قسم
   */
  async deactivateDepartment(id: string): Promise<any> {
    return this.update(id, { is_active: false } as unknown as Record<string, unknown>);
  }
}

// ─────────────────────────────────────────────────
//  Specialties (الاختصاصات الوظيفية)
// ─────────────────────────────────────────────────

class SpecialtyService extends BaseService {
  constructor() {
    super('specialties');
  }

  /**
   * جلب جميع الاختصاصات
   */
  async findAllSpecialties(): Promise<any[]> {
    return this.findAll({
      orderBy: 'created_at',
      ascending: true,
    });
  }

  /**
   * إنشاء اختصاص جديد
   */
  async createSpecialty(data: {
    name: string;
    department: string;
    role_level: string;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }

  /**
   * حذف اختصاص
   */
  async deleteSpecialty(id: string): Promise<boolean> {
    return this.delete(id);
  }
}

export const departmentService = new DepartmentService();
export const specialtyService = new SpecialtyService();
