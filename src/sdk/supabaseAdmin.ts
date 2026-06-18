/**
 * ════════════════════════════════════════════════════════════════
 *  Supabase Admin SDK - عميل إداري بمفتاح Service Role
 *  ⚠️ يُستخدم فقط في الخادم (Server-side) أو Edge Functions
 *  في الكود الأمامي، نستخدم طرقاً آمنة عبر RPC
 * ════════════════════════════════════════════════════════════════
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string;

const isAvailable = !!(supabaseUrl && serviceKey);

if (!isAvailable) {
  console.warn(
    '⚠️ VITE_SUPABASE_SERVICE_KEY غير موجود في .env\n' +
    'وظائف الإدارة (إضافة/تعديل/حذف المستخدمين) لن تعمل.\n' +
    'أضف المفتاح في ملف .env لتفعيل الوظائف الإدارية.\n' +
    '⚠️ ملاحظة أمنية: يُفضل استخدام Edge Functions بدلاً من كشف Service Key في المتصفح.'
  );
}

/**
 * عميل إداري آمن
 * يُستخدم فقط عندما يكون Service Key متاحاً
 */
function createAdminClient(): SupabaseClient | null {
  if (!supabaseUrl || !serviceKey) return null;
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export const supabaseAdmin = createAdminClient();

/** التحقق من توفر الخدمة الإدارية */
export const isAdminAvailable = () => !!supabaseAdmin;