/**
 * التحقق من أن المستخدم محلي (حساب تجريبي)
 * المستخدم المحلي لديه ID يبدأ بـ 'temp-test-'
 * ملاحظة: تم تغيير الحسابات المحلية السابقة لتصبح موظفين فعليين (emp-)
 */
export function isLocalUser(userId?: string): boolean {
  if (!userId) return false;
  return userId.startsWith('temp-test-');
}
