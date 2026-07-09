/**
 * ════════════════════════════════════════════════════════════════
 *  NotificationService - خدمة الإشعارات (نسخة SDK جديدة)
 *  مسؤولة عن: إرسال, قراءة, تعليم كمقروء, حذف الإشعارات
 * ════════════════════════════════════════════════════════════════
 */

import { BaseService } from './BaseService';

class NotificationService extends BaseService {
  constructor() {
    super('notifications');
  }

  /**
   * جلب إشعارات المستخدم الحالي
   */
  async findMyNotifications(userId: string): Promise<any[]> {
    return this.findAll({
      filters: { user_id: userId },
      orderBy: 'created_at',
      ascending: false,
    });
  }

  /**
   * جلب الإشعارات غير المقروءة
   */
  async findUnreadNotifications(userId: string): Promise<any[]> {
    return this.findAll({
      filters: { user_id: userId, is_read: false },
      orderBy: 'created_at',
      ascending: false,
    });
  }

  /**
   * إنشاء إشعار جديد
   */
  async createNotification(data: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    related_table?: string;
    related_id?: string;
  }): Promise<any> {
    return this.create(data as unknown as Record<string, unknown>);
  }

  /**
   * تعليم إشعار كمقروء
   */
  async markAsRead(notificationId: string): Promise<any> {
    return this.update(notificationId, { is_read: true } as unknown as Record<string, unknown>);
  }

  /**
   * تعليم جميع الإشعارات كمقروءة
   */
  async markAllAsRead(userId: string): Promise<void> {
    const unread = await this.findUnreadNotifications(userId);
    for (const notification of unread) {
      await this.markAsRead(notification.id);
    }
  }

  /**
   * حذف إشعار
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    return this.delete(notificationId);
  }

  /**
   * عدد الإشعارات غير المقروءة
   */
  async countUnread(userId: string): Promise<number> {
    return this.count({ user_id: userId, is_read: false });
  }
}

export const notificationService = new NotificationService();