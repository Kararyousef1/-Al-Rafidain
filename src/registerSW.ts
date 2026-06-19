/**
 * ════════════════════════════════════════════════════════════════
 *  registerSW.ts - تسجيل Service Worker
 * ════════════════════════════════════════════════════════════════
 *
 *  يستورد في نقطة دخول التطبيق (main.tsx) ويُسجّل الـ SW في الإنتاج فقط.
 *  يُظهر إشعاراً للمستخدم عند توفّر تحديث جديد.
 *  ════════════════════════════════════════════════════════════════
 */

export function registerServiceWorker(): void {
  // فقط في بيئة الإنتاج + المتصفحات الداعمة
  if (
    import.meta.env.PROD &&
    'serviceWorker' in navigator
  ) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.info('[SW] تم تسجيل Service Worker بنجاح');

          // فحص التحديثات كل ساعة
          setInterval(() => {
            registration.update().catch(() => {
              /* تجاهل أخطاء الفحص الصامتة */
            });
          }, 60 * 60 * 1000);

          // عند توفّر تحديث جديد
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              // التحديث نُزّل وجاهز للتفعيل
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                notifyUpdateAvailable(registration);
              }
            });
          });
        })
        .catch((err) => {
          console.warn('[SW] فشل تسجيل Service Worker:', err);
        });

      // عند تفعيل SW جديد → أعد التحميل لتفعيله
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    });
  }
}

// إشعار المستخدم بوجود تحديث (يدوي لتفادي إعادة التحميل المفاجئ)
function notifyUpdateAvailable(registration: ServiceWorkerRegistration): void {
  // محاولة استخدام addToast من المتجر إن وُجد، وإلا fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = (window as any).__UI_STORE__;
    if (store?.getState?.()?.addToast) {
      store.getState().addToast('يتوفّر إصدار جديد — أعد التحميل للتحديث', 'info');
      return;
    }
  } catch {
    /* تجاهل */
  }

  // Fallback: طلب تأكيد بسيط
  if (confirm('يتوفّر إصدار جديد من التطبيق. هل تريد التحديث الآن؟')) {
    registration.waiting?.postMessage('SKIP_WAITING');
  }
}
