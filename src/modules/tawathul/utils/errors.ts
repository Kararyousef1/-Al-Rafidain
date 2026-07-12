import { SdkError, SdkErrorCode } from '../../../services/sdk/BaseService';

export function tawathulDbError(error: { message?: string; code?: string } | null): never {
  const msg = error?.message || 'خطأ في قاعدة البيانات';
  if (msg.includes('does not exist') || error?.code === '42P01') {
    throw new SdkError(
      SdkErrorCode.DATABASE_ERROR,
      'جداول/ميزات بوابة التواصل غير مكتملة. نفّذ 300 ثم 301 ثم 302 على Supabase',
    );
  }
  if (msg.includes('row-level security') || error?.code === '42501') {
    throw new SdkError(
      SdkErrorCode.PERMISSION_DENIED,
      'تم رفض العملية بسبب الصلاحيات (RLS). تحقق من عضويتك في المحادثة',
    );
  }
  throw SdkError.fromSupabaseError(error || { message: msg });
}

export async function requireAuthUserId(supabase: {
  auth: { getUser: () => Promise<{ data: { user: { id: string } | null }; error: any }> };
}): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw SdkError.fromSupabaseError(error);
  const id = data.user?.id;
  if (!id) {
    throw new SdkError(SdkErrorCode.PERMISSION_DENIED, 'يجب تسجيل الدخول لاستخدام بوابة التواصل');
  }
  return id;
}
