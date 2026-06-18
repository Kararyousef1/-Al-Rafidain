import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ════════════════════════════════════════════════════════════════
//  عميل Supabase بصلاحيات الخدمة (Service Role)
//  يُستخدم حصرياً في لوحة الإدارة لإنشاء/تعديل/حذف حسابات المستخدمين
//  الحقيقية في نظام المصادقة (auth.users) دون التأثير على جلسة المدير
//  الحالي ودون الحاجة لتأكيد البريد الإلكتروني.
// ════════════════════════════════════════════════════════════════

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const serviceKey = (import.meta as any).env.VITE_SUPABASE_SERVICE_KEY;

// التحقق من وجود المفتاح بشكل آمن (بدون إسقاط التطبيق)
const isServiceKeyAvailable = !!(supabaseUrl && serviceKey);

if (!isServiceKeyAvailable) {
  console.warn(
    '⚠️ VITE_SUPABASE_SERVICE_KEY غير موجود في .env\n' +
    'وظائف الإدارة (إضافة/تعديل/حذف المستخدمين) لن تعمل.\n' +
    'أضف المفتاح في ملف .env لتفعيل الوظائف الإدارية.'
  );
}

// عميل افتراضي آمن (يسمح بالقراءة فقط)
const createSafeClient = (): SupabaseClient => {
  if (!supabaseUrl) {
    throw new Error('❌ VITE_SUPABASE_URL مفقود!');
  }
  if (!serviceKey) {
    throw new Error(
      '❌ VITE_SUPABASE_SERVICE_KEY مفقود!\n' +
      'مفتاح Service Role مطلوب للعمليات الإدارية (إضافة/تعديل/حذف المستخدمين).\n' +
      'أضف VITE_SUPABASE_SERVICE_KEY في ملف .env.\n' +
      'يمكنك الحصول عليه من Supabase Dashboard > Settings > API'
    );
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

// العميل الإداري - يعمل بشكل آمن
export const supabaseAdmin = createSafeClient();

// دالة للتحقق من توفر المفتاح الإداري
export const isServiceKeyReady = () => isServiceKeyAvailable;

// رسالة خطأ واضحة إذا حاول المستخدم عمليات إدارية بدون مفتاح
export const getServiceKeyError = (): string | null => {
  if (!isServiceKeyAvailable) {
    return 'مفتاح Service Role غير متوفر. أضف VITE_SUPABASE_SERVICE_KEY في ملف .env لتفعيل العمليات الإدارية.';
  }
  return null;
};

export default supabaseAdmin;
