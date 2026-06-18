/**
 * ════════════════════════════════════════════════════════════════
 *  عميل Supabase الإداري - نظام الرافدين HR
 *
 *  🔒 إصلاحات الأمان (v2):
 *
 *  المشكلة الأصلية:
 *  - VITE_SUPABASE_SERVICE_KEY كان يُعرَض في المتصفح مباشرة
 *  - يتجاوز جميع سياسات RLS في Supabase
 *  - أي شخص يفتح DevTools يستطيع سرقة المفتاح والسيطرة على قاعدة البيانات
 *
 *  الحل المُطبَّق:
 *  - supabaseAdmin لا يزال موجوداً لكنه يُحذَّر من استخدامه
 *  - جميع العمليات الإدارية يجب نقلها إلى Supabase Edge Functions
 *  - المفتاح يُستخدم فقط في Edge Functions (بيئة Deno الآمنة)
 *
 *  🚨 تحذير: لا تستخدم هذا الملف في بيئة الإنتاج لعمليات حساسة.
 *  استخدم Edge Functions بدلاً منه.
 *  المسار: supabase/functions/admin-create-user/index.ts
 * ════════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string | undefined;

// ══════════════════════════════════════════════════════════════
//  تحذير واضح في console أثناء التطوير
// ══════════════════════════════════════════════════════════════
if (import.meta.env.DEV && serviceKey) {
  console.warn(
    '%c⚠️ تحذير أمني: supabaseAdmin\n' +
    'VITE_SUPABASE_SERVICE_KEY موجود في المتصفح!\n' +
    'هذا يتجاوز جميع سياسات RLS.\n' +
    'انقل العمليات الإدارية إلى Edge Functions.',
    'color: orange; font-weight: bold;',
  );
}

if (import.meta.env.PROD && serviceKey) {
  // في الإنتاج: سجّل تحذيراً — لكن لا نُسقط التطبيق
  console.error(
    '🚨 خطأ أمني حرج: VITE_SUPABASE_SERVICE_KEY مكشوف في بيئة الإنتاج!\n' +
    'أزل هذا المفتاح من .env وانقل العمليات إلى Edge Functions فوراً.',
  );
}

// ══════════════════════════════════════════════════════════════
//  فحص المتطلبات
// ══════════════════════════════════════════════════════════════

const isServiceKeyAvailable = !!(supabaseUrl && serviceKey);

/**
 * يتحقق من توفر مفتاح الخدمة
 * استخدم هذا قبل أي عملية إدارية
 */
export const isServiceKeyReady = (): boolean => isServiceKeyAvailable;

/**
 * إرجاع رسالة خطأ واضحة إذا لم يكن المفتاح متاحاً
 */
export const getServiceKeyError = (): string | null => {
  if (!supabaseUrl) {
    return 'VITE_SUPABASE_URL مفقود في .env';
  }
  if (!serviceKey) {
    return (
      'مفتاح Service Role غير متوفر.\n' +
      'للعمليات الإدارية، استخدم Edge Function بدلاً من supabaseAdmin مباشرة.\n' +
      'المسار: supabase/functions/admin-create-user/'
    );
  }
  return null;
};

// ══════════════════════════════════════════════════════════════
//  إنشاء العميل الإداري
//  ⚠️ يُستخدم فقط للعمليات التي لا يمكن تنفيذها عبر Edge Functions
//     في بيئة التطوير فقط
// ══════════════════════════════════════════════════════════════

/**
 * @deprecated استخدم callAdminFunction() بدلاً منه في الإنتاج
 * هذا العميل للتطوير المحلي فقط
 */
export const supabaseAdmin = isServiceKeyAvailable
  ? createClient(supabaseUrl, serviceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;

// ══════════════════════════════════════════════════════════════
//  البديل الآمن: استدعاء Edge Functions
// ══════════════════════════════════════════════════════════════

import { supabase } from '../../sdk/supabase';

/**
 * استدعاء Edge Function إدارية بشكل آمن
 * المفتاح يبقى في Deno runtime — لا يُعرَض للمتصفح أبداً
 *
 * @example
 * const result = await callAdminFunction('admin-create-user', {
 *   email: 'user@example.com',
 *   password: 'securepass',
 *   role: 'employee',
 * });
 */
export const callAdminFunction = async <T = unknown>(
  functionName: string,
  payload: Record<string, unknown>,
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });

    if (error) {
      console.error(`Edge Function [${functionName}] error:`, error.message);
      return { data: null, error: error.message };
    }

    return { data: data as T, error: null };
  } catch (err: any) {
    console.error(`Edge Function [${functionName}] exception:`, err);
    return { data: null, error: err.message || 'خطأ غير متوقع' };
  }
};

// ══════════════════════════════════════════════════════════════
//  دوال الإدارة الآمنة (عبر Edge Functions)
// ══════════════════════════════════════════════════════════════

interface CreateUserPayload {
  email: string;
  password: string;
  full_name: string;
  role: string;
  department_id?: string;
  employee_id?: string;
}

interface CreateUserResult {
  user_id: string;
  email: string;
  message: string;
}

/**
 * إنشاء مستخدم جديد عبر Edge Function (آمن)
 * يستبدل الاستخدام المباشر لـ supabaseAdmin.auth.admin.createUser()
 */
export const adminCreateUser = async (
  payload: CreateUserPayload,
): Promise<{ data: CreateUserResult | null; error: string | null }> => {
  return callAdminFunction<CreateUserResult>('admin-create-user', payload);
};

interface UpdateUserRolePayload {
  target_user_id: string;
  new_role: string;
  updated_by: string;
}

/**
 * تغيير دور المستخدم عبر Edge Function (آمن)
 */
export const adminUpdateUserRole = async (
  payload: UpdateUserRolePayload,
): Promise<{ data: unknown; error: string | null }> => {
  return callAdminFunction('admin-update-role', payload);
};

interface DeleteUserPayload {
  target_user_id: string;
  deleted_by: string;
  reason?: string;
}

/**
 * حذف مستخدم عبر Edge Function (آمن)
 */
export const adminDeleteUser = async (
  payload: DeleteUserPayload,
): Promise<{ data: unknown; error: string | null }> => {
  return callAdminFunction('admin-delete-user', payload);
};

// ══════════════════════════════════════════════════════════════
//  تصدير افتراضي للتوافق مع الكود القديم
//  🔒 سيُرجع null إذا لم يكن المفتاح متاحاً
// ══════════════════════════════════════════════════════════════

export default supabaseAdmin;
