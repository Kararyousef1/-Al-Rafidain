/**
 * ════════════════════════════════════════════════════════════════
 *  useNotificationSubscription - Hook موحد للإشعارات
 * ════════════════════════════════════════════════════════════════
 *
 *  يُدير:
 *  - جلب الإشعارات من السيرفر
 *  - الاشتراك في Realtime (اشتراك واحد فقط)
 *  - عمليات: قراءة، قراءة الكل، حذف، حذف الكل
 *  - إعادة المزامنة عند عودة التبويب للتركيز
 *
 *  الاستخدام:
 *  ```
 *  const { notifications, unreadCount, loading, markAsRead, markAllRead, deleteNotification, clearAll, refresh } = useNotificationSubscription(userId);
 *  ```
 *
 *  أو مع خيارات:
 *  ```
 *  const { notifications, ... } = useNotificationSubscription(userId, { limit: 20, realtime: true });
 *  ```
 * ════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  fetchNotificationsFromServer,
  subscribeToRealtimeNotifications,
  markAsReadOnServer,
  markAllAsReadOnServer,
  deleteNotificationOnServer,
  deleteAllNotificationsOnServer,
} from '../lib/notificationService';
import type { AppNotification } from '../constants/notificationTypes';

interface UseNotificationOptions {
  /** عدد الإشعارات المطلوبة (default: 50) */
  limit?: number;
  /** تفعيل Realtime (default: true) */
  realtime?: boolean;
  /** تفعيل إعادة المزامنة عند التركيز (default: true) */
  refetchOnFocus?: boolean;
}

interface UseNotificationReturn {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export function useNotificationSubscription(
  userId: string | null | undefined,
  options?: UseNotificationOptions
): UseNotificationReturn {
  const { limit = 50, realtime = true, refetchOnFocus = true } = options || {};

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  // ─── جلب الإشعارات ──────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNotificationsFromServer(userId, limit);
      if (!cancelledRef.current) setNotifications(data);
    } catch (err) {
      if (!cancelledRef.current) setError('تعذّر تحميل الإشعارات');
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [userId, limit]);

  // ─── الجلب الأولي + Realtime ────────────────────────────────
  useEffect(() => {
    cancelledRef.current = false;

    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    refresh();

    // اشتراك Realtime واحد فقط
    if (!realtime) return;
    const unsubscribe = subscribeToRealtimeNotifications(
      userId,
      (newNotif: AppNotification) => {
        if (cancelledRef.current) return;
        setNotifications((prev) => {
          if (prev.some((n) => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
      }
    );

    // إعادة المزامنة عند التركيز
    if (!refetchOnFocus) return;
    const handleFocus = () => { if (!cancelledRef.current) refresh(); };
    window.addEventListener('focus', handleFocus);

    return () => {
      cancelledRef.current = true;
      unsubscribe();
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId, realtime, refetchOnFocus, refresh]);

  // ─── العمليات (Optimistic + Server + استرجاع) ────────────────

  const markAsRead = useCallback(async (id: string) => {
    if (!userId) return;
    const snapshot = notifications;
    setNotifications((cur) =>
      cur.map((n) => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
    );
    try {
      await markAsReadOnServer(userId, id);
    } catch {
      setNotifications(snapshot);
      setError('تعذّر تحديث حالة الإشعار');
    }
  }, [userId, notifications]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const snapshot = notifications;
    const now = new Date().toISOString();
    setNotifications((cur) => cur.map((n) => (n.read ? n : { ...n, read: true, readAt: now })));
    try {
      await markAllAsReadOnServer(userId);
    } catch {
      setNotifications(snapshot);
      setError('تعذّر تحديث الإشعارات');
    }
  }, [userId, notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    if (!userId) return;
    const snapshot = notifications;
    setNotifications((cur) => cur.filter((n) => n.id !== id));
    try {
      await deleteNotificationOnServer(userId, id);
    } catch {
      setNotifications(snapshot);
      setError('تعذّر حذف الإشعار');
    }
  }, [userId, notifications]);

  const clearAll = useCallback(async () => {
    if (!userId) return;
    const snapshot = notifications;
    setNotifications([]);
    try {
      await deleteAllNotificationsOnServer(userId);
    } catch {
      setNotifications(snapshot);
      setError('تعذّر حذف الإشعارات');
      await refresh();
    }
  }, [userId, notifications, refresh]);

  // ─── المشتقات ──────────────────────────────────────────────
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh,
    markAsRead,
    markAllRead,
    deleteNotification,
    clearAll,
  };
}
