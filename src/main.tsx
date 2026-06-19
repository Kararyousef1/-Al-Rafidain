import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { registerServiceWorker } from './registerSW';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// ════════════════════════════════════════════════════════════════
//  تسجيل Service Worker (PWA)
//  ─────────────────────────────────────────────────────────────────
//  • يعمل فقط في الإنتاج (import.meta.env.PROD)
//  • يفعّل الكاش الذكي + دعم العمل بدون إنترنت
//  • يُشعر المستخدم عند توفّر تحديث جديد
//  • لا يؤثر على Supabase API / Realtime (يتم تجاوزهم)
// ════════════════════════════════════════════════════════════════
registerServiceWorker();
