/**
 * بوابة التواصل (Tawathul) — نقطة التصدير الموحدة
 */

export { default as TawathulPortalPage } from './pages/TawathulPortalPage';
export { default as TawathulAdminPage } from './pages/TawathulAdminPage';
export { default as OpenEntityDiscussionButton } from './components/OpenEntityDiscussionButton';
export { useTawathulStore } from './stores/tawathulStore';
export { useTawathulMessages } from './hooks/useTawathulMessages';
export {
  tawathulConversationService,
  tawathulMessageService,
  tawathulNotificationService,
  tawathulAdminService,
} from './services';
export {
  canAccessTawathul,
  canAdminTawathul,
  TAWATHUL_PERMISSIONS,
} from './permissions';
export {
  ensureDefaultTenantCached,
  getTawathulTenantId,
  DEFAULT_TENANT_ID,
} from './utils/tenant';
export type * from './types';
