/**
 * مساعدات Tenant لبوابة التواصل
 * الأمان الحقيقي عبر RLS — هذا دفاع إضافي + UX
 */

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

export function getTawathulTenantId(): string {
  try {
    if (typeof window !== 'undefined') {
      const fromStorage = localStorage.getItem('tenant_id');
      if (fromStorage && fromStorage.length > 10) return fromStorage;
    }
  } catch {
    // ignore
  }
  return DEFAULT_TENANT_ID;
}

export function requireTawathulTenantId(): string {
  return getTawathulTenantId();
}

export function ensureDefaultTenantCached(): string {
  const id = getTawathulTenantId();
  try {
    if (typeof window !== 'undefined' && !localStorage.getItem('tenant_id')) {
      localStorage.setItem('tenant_id', id);
    }
  } catch {
    // ignore
  }
  return id;
}

export { DEFAULT_TENANT_ID };
