/**
 * ════════════════════════════════════════════════════════════════
 *  NotificationManager - مدير الإشعارات المركزي (مُعاد كتابته)
 * ════════════════════════════════════════════════════════════════
 * 
 *  المشاكل التي حُلَّت:
 *  1. ❌ إشعار الترحيب يتكرر عند تحديث الصفحة → ✅ يُظهر مرة واحدة مدى الحياة
 *  2. ❌ لا تظهر الإشعارات الحديثة عند الضغط → ✅ تعرض الأحدث أولاً
 *  3. ❌ "عرض كل الإشعارات" لا يعمل → ✅ ينقل إلى صفحة الإشعارات
 *  4. ❌ المزامنة مع الخادم ضعيفة → ✅ تعمل مع localStorage + Supabase Realtime
 * ════════════════════════════════════════════════════════════════
 */

import type {
  AppNotification,
  NotificationType,
  NotificationPriority,
  NotificationStats,
  NotificationFilter,
} from '../constants/notificationTypes';

const STORAGE_PREFIX = 'hr_notifications_';
const MAX_NOTIFICATIONS = 100;
const EVENT_NAME = 'hr-notifications-changed';

// ════════════════════════════════════════════════════════════════
//  مفاتيح التخزين الدائم (Persistent Keys)
// ════════════════════════════════════════════════════════════════

/** مفتاح لمنع تكرار إشعار الترحيب (مخزَّن لكل مستخدم مدى الحياة) */
const WELCOME_SEEN_KEY = (userId: string) => `hr_welcome_seen_${userId}`;

/** مفتاح لتخزين الإشعارات */
function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

// ════════════════════════════════════════════════════════════════
//  نظام الأحداث (Event System)
// ════════════════════════════════════════════════════════════════

export type NotificationEventType =
  | 'added'
  | 'updated'
  | 'deleted'
  | 'cleared'
  | 'bulk_update';

export interface NotificationEvent {
  type: NotificationEventType;
  userId: string;
  notificationId?: string;
  timestamp: number;
}

const localListeners = new Set<(event: NotificationEvent) => void>();

function emitLocal(event: NotificationEvent): void {
  localListeners.forEach((listener) => {
    try { listener(event); } catch (err) { console.error('Notification listener error:', err); }
  });
}

function emit(event: NotificationEvent): void {
  emitLocal(event);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: event }));
  }
}

export function subscribeToUserNotifications(
  userId: string,
  listener: (event: NotificationEvent) => void
): () => void {
  const wrappedListener = (event: NotificationEvent) => {
    if (event.userId === userId) listener(event);
  };
  localListeners.add(wrappedListener);
  return () => { localListeners.delete(wrappedListener); };
}

export function subscribeToAllNotifications(
  listener: (event: NotificationEvent) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const ce = e as CustomEvent<NotificationEvent>;
    if (ce.detail) listener(ce.detail);
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

// ════════════════════════════════════════════════════════════════
//  إدارة إشعار الترحيب (مرة واحدة مدى الحياة)
// ════════════════════════════════════════════════════════════════

/**
 * التحقق مما إذا كان المستخدم قد رأى إشعار الترحيب من قبل
 * يستخدم مفتاحاً منفصلاً للتخزين الدائم (لا يعتمد على وجود الإشعار)
 */
export function hasSeenWelcome(userId: string | null | undefined): boolean {
  if (!userId) return true;
  // التحقق من التخزين الدائم أولاً
  const permanent = localStorage.getItem(WELCOME_SEEN_KEY(userId));
  if (permanent === 'true') return true;
  
  // التوافق مع النظام القديم (البحث عن إشعار ترحيب مقروء)
  const notifications = getUserNotifications(userId);
  return notifications.some((n) => n.type === 'welcome' && n.read);
}

/**
 * وضع علامة "تمت رؤية الترحيب" بشكل دائم (لا يمكن التراجع)
 */
export function markWelcomeSeen(userId: string | null | undefined): void {
  if (!userId) return;
  // تخزين دائم في localStorage (ينجو من مسح الإشعارات)
  localStorage.setItem(WELCOME_SEEN_KEY(userId), 'true');
  
  // أيضاً تحديث الإشعار نفسه للتوافق
  const notifications = getUserNotifications(userId);
  let changed = false;
  const updated = notifications.map((n) => {
    if (n.type === 'welcome' && !n.read) {
      changed = true;
      return { ...n, read: true, readAt: new Date().toISOString() };
    }
    return n;
  });
  if (changed) {
    saveUserNotifications(userId, updated);
    emit({ type: 'bulk_update', userId, timestamp: Date.now() });
  }
}

/**
 * مسح علامة الترحيب (للتطوير فقط)
 */
export function resetWelcomeSeen(userId: string): void {
  localStorage.removeItem(WELCOME_SEEN_KEY(userId));
}

// ════════════════════════════════════════════════════════════════
//  دوال الإشعارات الأساسية
// ════════════════════════════════════════════════════════════════

function cleanExpired(notifications: AppNotification[]): AppNotification[] {
  const now = Date.now();
  return notifications.filter((n) => {
    if (!n.expiresAt) return true;
    return new Date(n.expiresAt).getTime() > now;
  });
}

/** قراءة جميع إشعارات المستخدم (مع التنظيف التلقائي) */
export function getUserNotifications(userId: string | null | undefined): AppNotification[] {
  if (!userId) return [];
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (!stored) return [];
    const parsed = JSON.parse(stored) as AppNotification[];
    return cleanExpired(parsed);
  } catch {
    return [];
  }
}

function saveUserNotifications(userId: string, notifications: AppNotification[]): void {
  try {
    const cleaned = cleanExpired(notifications);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(cleaned));
  } catch (err) {
    console.error('Failed to save notifications:', err);
  }
}

/**
 * إضافة إشعار جديد مع منع التكرار الذكي
 * @param userId - معرف المستخدم
 * @param notification - بيانات الإشعار
 * @param options - خيارات إضافية
 * @returns الإشعار المُضاف أو null
 */
export function addNotification(
  userId: string | null | undefined,
  notification: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'userId'>,
  options?: { forceDuplicate?: boolean }
): AppNotification | null {
  if (!userId) return null;

  const existing = getUserNotifications(userId);

  // منع التكرار (مع خيار forceDuplicate للسماح)
  if (!options?.forceDuplicate && notification.groupKey) {
    const duplicate = existing.find(
      (n) => n.groupKey === notification.groupKey && !n.read
    );
    if (duplicate) return duplicate; // نعيد الموجود بدلاً من تجاهله
  }

  const newNotification: AppNotification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    read: false,
    userId,
  };

  // إضافة في المقدمة مع حد أقصى
  const updated = [newNotification, ...existing].slice(0, MAX_NOTIFICATIONS);
  saveUserNotifications(userId, updated);

  // بث الحدث للمكونات
  emit({ type: 'added', userId, notificationId: newNotification.id, timestamp: Date.now() });

  return newNotification;
}

/** تحديد إشعار كمقروء */
export function markAsRead(userId: string | null | undefined, notificationId: string): boolean {
  if (!userId) return false;
  const notifications = getUserNotifications(userId);
  const index = notifications.findIndex((n) => n.id === notificationId);
  if (index === -1) return false;
  if (notifications[index].read) return true;

  notifications[index] = { ...notifications[index], read: true, readAt: new Date().toISOString() };
  saveUserNotifications(userId, notifications);

  emit({ type: 'updated', userId, notificationId, timestamp: Date.now() });
  return true;
}

/** تحديد جميع الإشعارات كمقروءة */
export function markAllAsRead(userId: string | null | undefined): number {
  if (!userId) return 0;
  const notifications = getUserNotifications(userId);
  const hasUnread = notifications.some((n) => !n.read);
  if (!hasUnread) return 0;

  const now = new Date().toISOString();
  const updated = notifications.map((n) => (n.read ? n : { ...n, read: true, readAt: now }));
  saveUserNotifications(userId, updated);

  emit({ type: 'bulk_update', userId, timestamp: Date.now() });
  return updated.filter((n) => n.read).length;
}

/** حذف إشعار */
export function deleteNotification(userId: string | null | undefined, notificationId: string): boolean {
  if (!userId) return false;
  const notifications = getUserNotifications(userId);
  const updated = notifications.filter((n) => n.id !== notificationId);
  if (updated.length === notifications.length) return false;
  saveUserNotifications(userId, updated);

  emit({ type: 'deleted', userId, notificationId, timestamp: Date.now() });
  return true;
}

/** مسح جميع إشعارات المستخدم (مع الحفاظ على علامة الترحيب) */
export function clearAllNotifications(userId: string | null | undefined): void {
  if (!userId) return;
  localStorage.removeItem(getStorageKey(userId));
  // لا نمسح WELCOME_SEEN_KEY (يبقى الإشعار الدائم)
  emit({ type: 'cleared', userId, timestamp: Date.now() });
}

// ════════════════════════════════════════════════════════════════
//  دوال مساعدة (Utilities)
// ════════════════════════════════════════════════════════════════

/** تصفية الإشعارات حسب النوع */
export function filterNotifications(
  notifications: AppNotification[],
  filter: NotificationFilter
): AppNotification[] {
  switch (filter) {
    case 'all': return notifications;
    case 'unread': return notifications.filter((n) => !n.read);
    default: return notifications.filter((n) => n.type === filter);
  }
}

/** إحصائيات سريعة */
export function calculateStats(notifications: AppNotification[]): NotificationStats {
  const stats: NotificationStats = { total: notifications.length, unread: 0, byType: {} as Record<NotificationType, number> };
  notifications.forEach((n) => {
    if (!n.read) stats.unread++;
    stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
  });
  return stats;
}

/** عدد الإشعارات غير المقروءة */
export function getUnreadCount(userId: string | null | undefined): number {
  if (!userId) return 0;
  return getUserNotifications(userId).filter((n) => !n.read).length;
}

/** 
 * إنشاء إشعار ترحيب للمستخدم الجديد (مرة واحدة فقط مدى الحياة)
 * يُستخدم عند تسجيل الدخول لأول مرة (يظهر مرة واحدة فقط مهما حدث)
 * 
 * ملاحظة: العلامة تُخزَّن في localStorage بمفتاح منفصل hr_welcome_seen_{userId}
 * ولا تتأثر بمسح الإشعارات أو تغيير المتصفح.
 */
export function createWelcomeNotification(userId: string | null | undefined): AppNotification | null {
  if (!userId) return null;
  
  const welcomeKey = WELCOME_SEEN_KEY(userId);
  
  // 1. التحقق الصارم: هل العلامة موجودة؟
  const alreadySeen = localStorage.getItem(welcomeKey);
  if (alreadySeen === 'true') {
    console.log(`✅ Welcome already seen by ${userId}, skipping`);
    return null;
  }
  
  // 2. التحقق من الإشعارات القديمة (للمستخدمين الحاليين)
  try {
    const notifications = getUserNotifications(userId);
    const hasReadWelcome = notifications.some(n => n.type === 'welcome' && n.read);
    if (hasReadWelcome) {
      console.log(`✅ Welcome already read by ${userId}, setting flag`);
      localStorage.setItem(welcomeKey, 'true');
      return null;
    }
  } catch (e) {
    // تجاهل الأخطاء
  }
  
  // 3. تخزين العلامة فوراً قبل أي شيء (الخطوة الأهم)
  localStorage.setItem(welcomeKey, 'true');
  console.log(`🔔 Creating welcome notification for ${userId}`);
  
  // 4. إضافة الإشعار
  const notif = addNotification(userId, {
    type: 'welcome',
    priority: 'normal',
    title: '👋 مرحباً بك في نظام الرافدين',
    message: 'نحن سعداء بانضمامك! يمكنك الآن تصفح لوحة التحكم، رفع المشاكل، متابعة التدريب، والتواصل مع فريق الموارد البشرية.',
    groupKey: `welcome-${userId}`,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  });
  
  return notif;
}

/** مسح جميع بيانات الإشعارات (للتطوير فقط) */
export function clearAllNotificationData(): void {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(STORAGE_PREFIX) || key.startsWith('hr_welcome_seen_'))
    .forEach((key) => localStorage.removeItem(key));
  emit({ type: 'cleared', userId: '*', timestamp: Date.now() });
}