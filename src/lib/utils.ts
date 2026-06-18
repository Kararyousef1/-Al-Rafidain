/**
 * التحقق من أن المستخدم محلي (حساب تجريبي)
 * المستخدم المحلي لديه ID يبدأ بـ 'temp-test-' أو 'local-'
 */
export function isLocalUser(userId?: string): boolean {
  if (!userId) return false;
  return userId.startsWith('temp-test-') || userId.startsWith('local-');
}
