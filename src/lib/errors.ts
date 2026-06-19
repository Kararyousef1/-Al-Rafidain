/**
 * ════════════════════════════════════════════════════════════════
 *  errors.ts - أدوات موحّدة لمعالجة الأخطاء
 * ════════════════════════════════════════════════════════════════
 *
 *  💡 لماذا هذا الملف؟
 *  ─────────────────────────────────────────────────────────────────
 *  أكثر `any` انتشاراً في المشروع هو نمط:
 *      catch (err: any) { alert(err.message) }
 *
 *  TypeScript يفضّل `catch (err: unknown)` لكن هذا يعني أنك لا
 *  تستطيع الوصول لـ err.message مباشرةً. هذا الملف يحل المشكلة
 *  بدالة آمنة تُستخدم في كل مكان.
 *  ════════════════════════════════════════════════════════════════
 */

/**
 * استخراج رسالة خطأ آمنة من أي مصدر (Error, string, unknown, Supabase error).
 *
 * @example
 * // قبل (any):
 *   catch (err: any) { alert(err.message) }
 *
 * // بعد (unknown + أداة آمنة):
 *   catch (err: unknown) { alert(getErrorMessage(err)) }
 */
export function getErrorMessage(err: unknown, fallback = 'حدث خطأ غير متوقع'): string {
  // Error قياسي
  if (err instanceof Error) {
    return err.message || fallback;
  }

  // خطأ Supabase / PostgREST (له message و code)
  if (isSupabaseError(err)) {
    const code = err.code ? `[${err.code}] ` : '';
    return `${code}${err.message || fallback}`;
  }

  // كائن له message مباشرةً
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }

  // نص مباشر
  if (typeof err === 'string' && err.trim()) return err;

  return fallback;
}

/**
 * التحقق الآمن إن كان الخطأ خطأ Supabase.
 */
export function isSupabaseError(err: unknown): err is { message: string; code?: string; details?: string } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  );
}

/**
 * فحص إن كان الخطأ خطأ شبكة/اتصال (لعرض رسائل مناسبة للمستخدم).
 */
export function isNetworkError(err: unknown): boolean {
  const msg = getErrorMessage(err).toLowerCase();
  return (
    msg.includes('failed to fetch') ||
    msg.includes('network') ||
    msg.includes('networkerror') ||
    msg.includes('internet') ||
    msg.includes('timeout')
  );
}

/**
 * رسالة خطأ مخصّصة للمستخدم (عربية) حسب نوع الخطأ.
 * مثالي للتمرير مباشرةً إلى addToast().
 *
 * @example
 *   catch (err: unknown) {
 *     addToast(getUserFriendlyError(err), 'error');
 *   }
 */
export function getUserFriendlyError(err: unknown): string {
  if (isNetworkError(err)) {
    return 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.';
  }

  const msg = getErrorMessage(err);

  // أخطاء Supabase الشائعة → ترجمة عربية
  if (msg.includes('JWT')) return 'انتهت الجلسة. الرجاء تسجيل الدخول مرة أخرى.';
  if (msg.includes('permission') || msg.includes('policy') || msg.includes('rls')) {
    return 'ليست لديك صلاحية لهذا الإجراء.';
  }
  if (msg.includes('row-level security')) return 'تم رفض الوصول. تحقق من صلاحياتك.';

  return msg;
}
