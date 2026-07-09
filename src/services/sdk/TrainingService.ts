/**
 * ════════════════════════════════════════════════════════════════
 *  TrainingService - خدمة المجال التدريبي (نسخة SDK جديدة)
 *  Domain: Training
 *  تشمل: courses, course_progress
 *  employee_certifications موجودة مسبقاً في CertificationService
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService } from './BaseService';

// ─────────────────────────────────────────────────
//  Courses
// ─────────────────────────────────────────────────

class CourseService extends BaseService {
  constructor() {
    super('courses');
  }

  /**
   * جلب جميع الدورات
   */
  async findAllCourses(): Promise<any[]> {
    return this.findAll({
      orderBy: 'created_at',
      ascending: false,
    });
  }

  /**
   * إنشاء دورة جديدة
   */
  async createCourse(data: {
    title: string;
    description?: string;
    category?: string;
    duration_hours?: number;
    max_participants?: number;
    created_by?: string;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }

  /**
   * تحديث دورة
   */
  async updateCourse(id: string, data: Record<string, unknown>): Promise<any> {
    return this.update(id, data);
  }

  /**
   * حذف دورة
   */
  async deleteCourse(id: string): Promise<boolean> {
    return this.delete(id);
  }

  /**
   * تبديل حالة التفعيل
   */
  async toggleActive(id: string, active: boolean): Promise<any> {
    return this.update(id, { active } as unknown as Record<string, unknown>);
  }
}

// ─────────────────────────────────────────────────
//  Course Progress
// ─────────────────────────────────────────────────

class CourseProgressService extends BaseService {
  constructor() {
    super('course_progress');
  }

  /**
   * جلب جميع تقدمات الدورات
   */
  async findAllProgress(): Promise<any[]> {
    return this.findAll({
      orderBy: 'created_at',
      ascending: false,
    });
  }
}

// ─────────────────────────────────────────────────
//  التصدير
// ─────────────────────────────────────────────────

export const courseService = new CourseService();
export const courseProgressService = new CourseProgressService();