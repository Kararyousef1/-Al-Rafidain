/**
 * ════════════════════════════════════════════════════════════════
 *  BaseService - الخدمة الأساسية الموحدة لطبقة SDK
 *  جميع خدمات SDK ترث من هذه الخدمة
 * ════════════════════════════════════════════════════════════════
 *
 *  الميزات:
 *  1. حقن tenant_id تلقائياً من السياق
 *  2. منع تمرير tenant_id يدوياً
 *  3. معالجة موحدة للأخطاء
 * ════════════════════════════════════════════════════════════════
 */

import { supabase } from '../supabase/supabase';

// ════════════════════════════════════════════════════════════════
//  أنواع الأخطاء الموحدة
// ════════════════════════════════════════════════════════════════

export enum SdkErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TENANT_NOT_FOUND = 'TENANT_NOT_FOUND',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class SdkError extends Error {
  constructor(
    public code: SdkErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'SdkError';
  }

  static fromSupabaseError(error: { message?: string }): SdkError {
    return new SdkError(
      SdkErrorCode.DATABASE_ERROR,
      error.message || 'خطأ في قاعدة البيانات',
    );
  }

  static permissionDenied(message?: string): SdkError {
    return new SdkError(SdkErrorCode.PERMISSION_DENIED, message || 'لا تملك صلاحية الوصول');
  }

  static notFound(message?: string): SdkError {
    return new SdkError(SdkErrorCode.NOT_FOUND, message || 'السجل غير موجود');
  }

  static validationError(message: string): SdkError {
    return new SdkError(SdkErrorCode.VALIDATION_ERROR, message);
  }
}

// ════════════════════════════════════════════════════════════════
//  حقن tenant_id (مصدر موحد واحد)
// ════════════════════════════════════════════════════════════════

/**
 * الحصول على tenant_id الحالي من السياق.
 *
 * ملاحظة أمنية: هذا المصدر يُستخدم فقط لبناء الاستعلامات.
 * الأمان الفعلي يتم عبر RLS في قاعدة البيانات.
 * tenant_id لا يأتي من المستخدم أبداً.
 */
export function getCurrentTenantId(): string | undefined {
  return localStorage.getItem('tenant_id') || undefined;
}

/**
 * التأكد من وجود tenant_id قبل تنفيذ العملية
 */
export function requireTenantId(): string {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    throw SdkError.validationError('لم يتم العثور على معلومات الشركة (Tenant ID)');
  }
  return tenantId;
}

// ════════════════════════════════════════════════════════════════
//  BaseService
// ════════════════════════════════════════════════════════════════

export class BaseService {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // ─────────────────────────────────────────────────
  //  Tenant Injection
  // ─────────────────────────────────────────────────

  /**
   * إضافة شرط tenant_id تلقائياً إلى الاستعلام.
   * يتم استدعاؤها في كل عملية CRUD.
   */
  protected addTenantFilter(query: any, skipTenantFilter?: boolean): any {
    if (skipTenantFilter) return query;
    const tenantId = getCurrentTenantId();
    if (tenantId) {
      return query.eq('tenant_id', tenantId);
    }
    return query;
  }

  /**
   * إزالة أي tenant_id من بيانات الإدخال وإضافة القيمة الصحيحة من السياق.
   * تُستخدم في عمليات INSERT.
   */
  protected injectTenantId(data: Record<string, unknown>): Record<string, unknown> {
    const tenantId = requireTenantId();
    // إزالة tenant_id إذا ورد من المستخدم (لا تثق به)
    const { tenant_id: _, ...cleanData } = data;
    return { ...cleanData, tenant_id: tenantId };
  }

  // ─────────────────────────────────────────────────
  //  CRUD Operations
  // ─────────────────────────────────────────────────

  /**
   * جلب جميع السجلات مع فلتر tenant_id تلقائي
   */
  async findAll(options?: {
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
    offset?: number;
    filters?: Record<string, unknown>;
  }): Promise<any[]> {
    try {
      let query = this.addTenantFilter(
        supabase.from(this.tableName).select('*')
      );

      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          query = query.eq(key, value);
        }
      }
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? true });
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
      }

      const { data, error } = await query;
      if (error) throw SdkError.fromSupabaseError(error);
      return data || [];
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * جلب سجل واحد بالـ ID
   */
  async findById(id: string, skipTenantFilter?: boolean): Promise<any | null> {
    try {
      const query = this.addTenantFilter(
        supabase.from(this.tableName).select('*').eq('id', id),
        skipTenantFilter
      );
      const { data, error } = await query.maybeSingle();
      if (error) throw SdkError.fromSupabaseError(error);
      return data;
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * إنشاء سجل جديد.
   * tenant_id يُحقن تلقائياً من السياق.
   * أي tenant_id من المستخدم يُتجاهل.
   */
  async create(data: Record<string, unknown>): Promise<any> {
    try {
      const safeData = this.injectTenantId(data);

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(safeData)
        .select()
        .single();

      if (error) throw SdkError.fromSupabaseError(error);
      return result;
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * تحديث سجل موجود.
   * tenant_id لا يمكن تغييره - أي قيمة من المستخدم تُتجاهل.
   */
  async update(id: string, data: Record<string, unknown>): Promise<any> {
    try {
      // إزالة tenant_id من البيانات (لا يمكن تغيير الشركة)
      const { tenant_id: _, ...safeData } = data;

      const query = this.addTenantFilter(
        supabase.from(this.tableName).update(safeData).eq('id', id)
      );

      const { data: result, error } = await query.select().single();
      if (error) throw SdkError.fromSupabaseError(error);
      return result;
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * حذف سجل.
   */
  async delete(id: string): Promise<boolean> {
    try {
      const query = this.addTenantFilter(
        supabase.from(this.tableName).delete().eq('id', id)
      );
      const { error } = await query;
      if (error) throw SdkError.fromSupabaseError(error);
      return true;
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * Soft Delete - تعيين deleted_at فقط
   */
  async softDelete(id: string): Promise<any> {
    try {
      const updateData = {
        deleted_at: new Date().toISOString(),
      };
      const query = this.addTenantFilter(
        supabase.from(this.tableName).update(updateData).eq('id', id)
      );
      const { data, error } = await query.select().single();
      if (error) throw SdkError.fromSupabaseError(error);
      return data;
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }

  /**
   * جلب عدد السجلات (مع tenant_id)
   */
  async count(extraFilter?: Record<string, unknown>): Promise<number> {
    try {
      let query = this.addTenantFilter(
        supabase.from(this.tableName).select('*', { count: 'exact', head: true })
      );
      if (extraFilter) {
        for (const [key, value] of Object.entries(extraFilter)) {
          query = query.eq(key, value);
        }
      }
      const { count, error } = await query;
      if (error) throw SdkError.fromSupabaseError(error);
      return count || 0;
    } catch (error) {
      if (error instanceof SdkError) throw error;
      throw SdkError.fromSupabaseError(error as any);
    }
  }
}