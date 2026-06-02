import { createClient } from '@supabase/supabase-js';

// ════════════════════════════════════════════════════════════════
//  عميل Supabase بصلاحيات الخدمة (Service Role)
//  يُستخدم حصرياً في لوحة الإدارة لإنشاء/تعديل/حذف حسابات المستخدمين
//  الحقيقية في نظام المصادقة (auth.users) دون التأثير على جلسة المدير
//  الحالي ودون الحاجة لتأكيد البريد الإلكتروني.
//
//  ملاحظة أمنية: مفتاح الخدمة قوي جداً. هذا الإعداد مناسب للتشغيل
//  المحلي/الداخلي للنظام. في بيئة إنتاج عامة يُفضّل نقل هذه العمليات
//  إلى Edge Function على الخادم.
// ════════════════════════════════════════════════════════════════

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const serviceKey = (import.meta as any).env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error(
    '❌ متغيرات Supabase الخاصة بالإدارة مفقودة!\n' +
    'أضف في ملف .env.local:\n' +
    'VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
    'VITE_SUPABASE_SERVICE_KEY=eyJ... (Service Role Key)'
  );
}

// عميل منفصل تماماً لا يحفظ جلسة حتى لا يبدّل جلسة المدير الحالي
export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export default supabaseAdmin;
