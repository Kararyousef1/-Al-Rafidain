/**
 * صلاحيات بوابة التواصل (Tawathul)
 * منفصلة عن مصفوفة HR العامة — تُدمج عبر مفاتيح المنصة
 */

export const TAWATHUL_PERMISSIONS = [
  'tawathul',                 // الدخول للبوابة
  'tawathul-admin',           // إدارة إعدادات/قنوات الشركة
  'tawathul-create-dm',
  'tawathul-create-group',
  'tawathul-create-channel',
  'tawathul-open-entity',     // فتح نقاش على سجل ERP
  'tawathul-delete-message',
] as const;

export type TawathulPermission = typeof TAWATHUL_PERMISSIONS[number];

/** أدوار المنصة التي تدخل البوابة افتراضياً */
export const TAWATHUL_DEFAULT_ACCESS_ROLES = [
  'employee',
  'supervisor',
  'manager',
  'hr',
  'admin',
  'developer',
] as const;

export function canAccessTawathul(
  role: string | undefined,
  userPermissions?: string[] | null,
): boolean {
  if (userPermissions?.includes('tawathul') || userPermissions?.includes('tawathul-admin')) {
    return true;
  }
  if (!role) return false;
  return (TAWATHUL_DEFAULT_ACCESS_ROLES as readonly string[]).includes(role);
}

export function canAdminTawathul(
  role: string | undefined,
  userPermissions?: string[] | null,
): boolean {
  if (userPermissions?.includes('tawathul-admin')) return true;
  return role === 'admin' || role === 'hr' || role === 'developer';
}
