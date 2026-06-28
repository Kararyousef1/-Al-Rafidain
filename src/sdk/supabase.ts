/**
 * ════════════════════════════════════════════════════════════════
 *  Supabase SDK - تهيئة عميل Supabase الأساسي
 *  هذا الملف هو المصدر الوحيد لعميل Supabase العام
 * ════════════════════════════════════════════════════════════════
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ متغيرات Supabase مفقودة!\n' +
    'أضف في ملف .env:\n' +
    'VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=eyJ...'
  );
}

/** العميل الأساسي (مصادقة المستخدمين العاديين) */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: 'kayan-hr-session',
  },
  global: {
    headers: {
      'x-app-name': 'kayan-hr-system',
    },
  },
  db: {
    schema: 'public',
  },
});

// التحقق من الاتصال (فقط في وضع التطوير)

export default supabase;