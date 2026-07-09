/**
 * اختبارات وحدة لـ NotificationManager
 * ════════════════════════════════════════════════════════════════
 *  يختبر:
 *  - تخزين/استرجاع الإشعارات لكل مستخدم
 *  - منع التكرار (groupKey)
 *  - تتبع القراءة
 *  - منطق الترحيب (يظهر مرة واحدة فقط)
 *  - انتهاء الصلاحية
 *  - عزل المستخدمين عن بعضهم
 * ════════════════════════════════════════════════════════════════
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getUserNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  filterNotifications,
  calculateStats,
  hasSeenWelcome,
  markWelcomeSeen,
  clearAllNotificationData,
} from '../services/notifications/notificationManager';
import type { AppNotification } from '../core/constants/notificationTypes';

const USER_1 = 'user-123';
const USER_2 = 'user-456';

beforeEach(() => {
  clearAllNotificationData();
});

describe('NotificationManager', () => {
  describe('Storage Isolation', () => {
    it('should store notifications per user separately', () => {
      addNotification(USER_1, { type: 'info', priority: 'normal', title: 'A', message: 'm1' });
      addNotification(USER_2, { type: 'info', priority: 'normal', title: 'B', message: 'm2' });

      const user1Notifs = getUserNotifications(USER_1);
      const user2Notifs = getUserNotifications(USER_2);

      expect(user1Notifs).toHaveLength(1);
      expect(user1Notifs[0].title).toBe('A');
      expect(user2Notifs).toHaveLength(1);
      expect(user2Notifs[0].title).toBe('B');
    });

    it('should return empty array for non-existent user', () => {
      expect(getUserNotifications(null)).toEqual([]);
      expect(getUserNotifications(undefined)).toEqual([]);
      expect(getUserNotifications('non-existent')).toEqual([]);
    });
  });

  describe('addNotification', () => {
    it('should add a new notification', () => {
      const result = addNotification(USER_1, {
        type: 'success',
        priority: 'normal',
        title: 'تم بنجاح',
        message: 'تم الحفظ',
      });

      expect(result).not.toBeNull();
      expect(result?.title).toBe('تم بنجاح');
      expect(result?.read).toBe(false);
      expect(result?.userId).toBe(USER_1);
      expect(result?.id).toBeDefined();
    });

    it('should add to the front (newest first)', () => {
      addNotification(USER_1, { type: 'info', priority: 'normal', title: 'A', message: 'm1' });
      addNotification(USER_1, { type: 'info', priority: 'normal', title: 'B', message: 'm2' });
      addNotification(USER_1, { type: 'info', priority: 'normal', title: 'C', message: 'm3' });

      const notifs = getUserNotifications(USER_1);
      expect(notifs.map((n) => n.title)).toEqual(['C', 'B', 'A']);
    });

    it('should prevent duplicate via groupKey (unread)', () => {
      const result1 = addNotification(USER_1, {
        type: 'welcome',
        priority: 'normal',
        title: 'Welcome',
        message: 'Hi',
        groupKey: 'welcome-user-1',
      });
      const result2 = addNotification(USER_1, {
        type: 'welcome',
        priority: 'normal',
        title: 'Welcome',
        message: 'Hi again',
        groupKey: 'welcome-user-1',
      });

      expect(result1).not.toBeNull();
      expect(result2).toBeNull(); // تم رفض المكرر
      expect(getUserNotifications(USER_1)).toHaveLength(1);
    });

    it('should allow new notification after previous is read', () => {
      const first = addNotification(USER_1, {
        type: 'info',
        priority: 'normal',
        title: 'A',
        message: 'm1',
        groupKey: 'test',
      });
      if (first) markAsRead(USER_1, first.id);

      const second = addNotification(USER_1, {
        type: 'info',
        priority: 'normal',
        title: 'B',
        message: 'm2',
        groupKey: 'test',
      });

      expect(second).not.toBeNull();
      expect(getUserNotifications(USER_1)).toHaveLength(2);
    });

    it('should limit to 100 notifications max', () => {
      for (let i = 0; i < 110; i++) {
        addNotification(USER_1, {
          type: 'info',
          priority: 'normal',
          title: `N${i}`,
          message: `m${i}`,
        });
      }
      expect(getUserNotifications(USER_1)).toHaveLength(100);
    });

    it('should return null when userId is missing', () => {
      const result = addNotification(null, {
        type: 'info',
        priority: 'normal',
        title: 'A',
        message: 'm',
      });
      expect(result).toBeNull();
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', () => {
      const notif = addNotification(USER_1, {
        type: 'info',
        priority: 'normal',
        title: 'A',
        message: 'm',
      });
      expect(notif).not.toBeNull();
      if (notif) {
        const result = markAsRead(USER_1, notif.id);
        expect(result).toBe(true);
        const updated = getUserNotifications(USER_1);
        expect(updated[0].read).toBe(true);
        expect(updated[0].readAt).toBeDefined();
      }
    });

    it('should return false for non-existent notification', () => {
      expect(markAsRead(USER_1, 'non-existent')).toBe(false);
    });

    it('should return false for null userId', () => {
      expect(markAsRead(null, 'any')).toBe(false);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all as read', () => {
      addNotification(USER_1, { type: 'info', priority: 'normal', title: 'A', message: 'm' });
      addNotification(USER_1, { type: 'info', priority: 'normal', title: 'B', message: 'm' });
      addNotification(USER_1, { type: 'info', priority: 'normal', title: 'C', message: 'm' });

      const count = markAllAsRead(USER_1);
      expect(count).toBe(3);
      const notifs = getUserNotifications(USER_1);
      expect(notifs.every((n) => n.read)).toBe(true);
    });

    it('should handle empty notifications', () => {
      const count = markAllAsRead(USER_1);
      expect(count).toBe(0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', () => {
      const notif = addNotification(USER_1, {
        type: 'info',
        priority: 'normal',
        title: 'A',
        message: 'm',
      });
      if (notif) {
        const result = deleteNotification(USER_1, notif.id);
        expect(result).toBe(true);
        expect(getUserNotifications(USER_1)).toHaveLength(0);
      }
    });

    it('should return false for non-existent id', () => {
      expect(deleteNotification(USER_1, 'non-existent')).toBe(false);
    });
  });

  describe('Welcome Logic (مرة واحدة فقط)', () => {
    it('should return false initially', () => {
      expect(hasSeenWelcome(USER_1)).toBe(false);
    });

    it('should return true after welcome is added and seen', () => {
      addNotification(USER_1, {
        type: 'welcome',
        priority: 'normal',
        title: 'مرحبا',
        message: 'hi',
        groupKey: `welcome-${USER_1}`,
      });

      // قبل وضع علامة - لم ير
      expect(hasSeenWelcome(USER_1)).toBe(false);

      // بعد وضع العلامة - رأى
      markWelcomeSeen(USER_1);
      expect(hasSeenWelcome(USER_1)).toBe(true);
    });

    it('should prevent duplicate welcome via groupKey', () => {
      const r1 = addNotification(USER_1, {
        type: 'welcome',
        priority: 'normal',
        title: 'Welcome',
        message: 'Hi',
        groupKey: `welcome-${USER_1}`,
      });
      const r2 = addNotification(USER_1, {
        type: 'welcome',
        priority: 'normal',
        title: 'Welcome',
        message: 'Hi again',
        groupKey: `welcome-${USER_1}`,
      });

      expect(r1).not.toBeNull();
      expect(r2).toBeNull();
    });

    it('should return true for null user (no welcome to show)', () => {
      expect(hasSeenWelcome(null)).toBe(true);
      expect(hasSeenWelcome(undefined)).toBe(true);
    });
  });

  describe('filterNotifications', () => {
    let testNotifs: AppNotification[];

    beforeEach(() => {
      clearAllNotificationData();
      addNotification(USER_1, { type: 'info', priority: 'normal', title: 'A', message: 'm' });
      addNotification(USER_1, { type: 'warning', priority: 'high', title: 'B', message: 'm' });
      addNotification(USER_1, { type: 'success', priority: 'normal', title: 'C', message: 'm' });
      testNotifs = getUserNotifications(USER_1);
      // Mark first as read
      markAsRead(USER_1, testNotifs[2].id); // 'A'
    });

    it('should return all for "all" filter', () => {
      const filtered = filterNotifications(getUserNotifications(USER_1), 'all');
      expect(filtered).toHaveLength(3);
    });

    it('should return only unread for "unread" filter', () => {
      const filtered = filterNotifications(getUserNotifications(USER_1), 'unread');
      expect(filtered).toHaveLength(2);
    });

    it('should return only specific type for type filter', () => {
      const filtered = filterNotifications(getUserNotifications(USER_1), 'warning');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe('B');
    });
  });

  describe('calculateStats', () => {
    it('should calculate correct stats', () => {
      addNotification(USER_1, { type: 'info', priority: 'normal', title: 'A', message: 'm' });
      addNotification(USER_1, { type: 'info', priority: 'normal', title: 'B', message: 'm' });
      addNotification(USER_1, { type: 'warning', priority: 'high', title: 'C', message: 'm' });

      const notifs = getUserNotifications(USER_1);
      const stats = calculateStats(notifs);

      expect(stats.total).toBe(3);
      expect(stats.unread).toBe(3);
      expect(stats.byType.info).toBe(2);
      expect(stats.byType.warning).toBe(1);
    });

    it('should handle empty notifications', () => {
      const stats = calculateStats([]);
      expect(stats.total).toBe(0);
      expect(stats.unread).toBe(0);
    });
  });

  describe('Expiry', () => {
    it('should clean expired notifications on read', () => {
      // إضافة إشعار منتهي الصلاحية
      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(); // أمس
      const result = addNotification(USER_1, {
        type: 'info',
        priority: 'normal',
        title: 'Expired',
        message: 'm',
        expiresAt: pastDate,
      });
      // addNotification يحفظ لكن لا يتحقق من الانتهاء - التحقق عند القراءة
      expect(result).not.toBeNull();

      // عند القراءة يتم تنظيف المنتهي
      const notifs = getUserNotifications(USER_1);
      expect(notifs).toHaveLength(0); // تم تنظيفه
    });

    it('should keep non-expired notifications', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // غداً
      addNotification(USER_1, {
        type: 'info',
        priority: 'normal',
        title: 'Future',
        message: 'm',
        expiresAt: futureDate,
      });

      const notifs = getUserNotifications(USER_1);
      expect(notifs).toHaveLength(1);
    });
  });

  describe('Security & Edge Cases', () => {
    it('should not affect other users on delete', () => {
      addNotification(USER_1, { type: 'info', priority: 'normal', title: 'A', message: 'm' });
      addNotification(USER_2, { type: 'info', priority: 'normal', title: 'B', message: 'm' });

      const notif1 = getUserNotifications(USER_1)[0];
      deleteNotification(USER_1, notif1.id);

      expect(getUserNotifications(USER_1)).toHaveLength(0);
      expect(getUserNotifications(USER_2)).toHaveLength(1);
    });

    it('should handle corrupted localStorage gracefully', () => {
      // محاكاة بيانات فاسدة بمفتاح الكاش الصحيح
      localStorage.setItem(`hr_notifications_cache_${USER_1}`, 'not-valid-json');
      const notifs = getUserNotifications(USER_1);
      expect(notifs).toEqual([]);
    });
  });
});
