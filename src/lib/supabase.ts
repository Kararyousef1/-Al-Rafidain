import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ متغيرات Supabase مفقودة!\n' +
    'أضف في ملف .env.local:\n' +
    'VITE_SUPABASE_URL=https://xxxx.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=eyJ...'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
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

// التحقق من الاتصال عند بدء التشغيل (في وضع التطوير فقط)
if (import.meta.env.DEV) {
  supabase.auth.getSession().then(({ error }) => {
    if (error) {
      console.warn('⚠️ Supabase:', error.message);
    } else {
      console.log('✅ Supabase متصل بنجاح');
    }
  });
}

export default supabase;