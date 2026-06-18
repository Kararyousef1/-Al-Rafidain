/**
 * ════════════════════════════════════════════════════════════════
 *  NotificationService - خدمة الإشعارات المركزية المُحسَّنة
 * ════════════════════════════════════════════════════════════════
 *  ✅ متكاملة مع قاعدة البيانات الجديدة
 *  ✅ تدعم جميع أنواع الإشعارات (70+ نوع)
 *  ✅ Realtime subscriptions محسَّنة
 *  ✅ Error handling مبسَّط
 * ════════════════════════════════════════════════════════════════
 */

import { supabase } from './supabase';
import { addNotification } from './notificationManager';
import type { NotificationType } from '../constants/notificationTypes';
import type { UserRole } from '../types';

// ════════════════════════════════════════════════════════════════
//  أنواع البيانات المحسَّنة
// ════════════════════════════════════════════════════════════════

export type SystemNotificationType = NotificationType;

export interface SystemNotification {
  type: SystemNotificationType;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  actionUrl?: string;
  groupKey?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
}

// ════════════════════════════════════════════════════════════════
//  دوال جلب المستخدمين (محسَّنة)
// ════════════════════════════════════════════════════════════════

/** جلب جميع المستخدمين الذين لديهم دور معين */
async function getUserIdsByRole(roles: UserRole[]): Promise<string[]> {
  const ids: string[] = [];
  
  try {
    // البحث في profiles أولاً (المصدر الأساسي)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .in('role', roles)
      .eq('status', 'active');

    if (!profileError && profileData) {
      profileData.forEach(p => {
        if (p.id && !ids.includes(p.id)) ids.push(p.id);
      });
    }

    // إذا لم نجد من profiles، نجرب employees
    if (ids.length === 0) {
      const dbRoles = roles.map(r => r === 'admin' ? 'system_admin' : r);
      
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('user_id')
        .in('role', dbRoles)
        .eq('is_active', true);

      if (!empError && empData) {
        empData.forEach(e => {
          if (e.user_id && !ids.includes(e.user_id)) ids.push(e.user_id);
        });
      }
    }

    console.log(`✅ Found ${ids.length} users for roles:`, roles);
    return ids;

  } catch (err) {
    console.error('❌ Error fetching users by role:', err);
    return [];
  }
}

/** جلب المدير المباشر لموظف */
async function getManagerId(employeeId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('manager_id')
      .eq('id', employeeId)
      .maybeSingle();

    if (error) throw error;
    return data?.manager_id || null;
  } catch (err) {
    console.error('❌ Error fetching manager:', err);
    return null;
  }
}

/** جلب جميع المشرفين والمديرين لموظف */
async function getSupervisorIds(employeeId: string): Promise<string[]> {
  const ids: string[] = [];
  
  try {
    // المشرف المباشر
    const managerId = await getManagerId(employeeId);
    if (managerId) ids.push(managerId);

    // جميع المديرين و HR
    const { data: managers } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['manager', 'hr', 'admin'])
      .eq('status', 'active');

    if (managers) {
      managers.forEach(m => {
        if (m.id && !ids.includes(m.id)) ids.push(m.id);
      });
    }

    return ids;
  } catch (err) {
    console.error('❌ Error fetching supervisors:', err);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════
//  دوال الإشعارات الأساسية (مبسَّطة)
// ════════════════════════════════════════════════════════════════

/**
 * إرسال إشعار لمستخدم واحد
 * ✅ مباشر وبسيط - بدون تعقيدات
 */
export async function notifyUser(
  userId: string,
  notification: SystemNotification
): Promise<string | null> {
  try {
    // 1️⃣ إرسال لقاعدة البيانات
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        action_url: notification.actionUrl || null,
        group_key: notification.groupKey || null,
        metadata: notification.metadata || {},
        expires_at: notification.expiresAt || null,
      })
      .select('id')
      .single();

    if (error) {
      console.warn('⚠️ Supabase notification failed, using localStorage:', error.message);
      // Fallback إلى التخزين المحلي
      const localResult = addNotification(userId, notification);
      return localResult?.id || null;
    }

    // 2️⃣ أيضاً تخزين محلي للتزامن
    addNotification(userId, notification);

    console.log(`✅ Notification sent to user ${userId}:`, notification.title);
    return data.id;

  } catch (err) {
    console.error('❌ notifyUser failed:', err);
    // Fallback إلى التخزين المحلي
    const localResult = addNotification(userId, notification);
    return localResult?.id || null;
  }
}

/**
 * إرسال إشعار لمجموعة من الأدوار
 */
export async function notifyRole(
  roles: UserRole[],
  notification: SystemNotification
): Promise<string[]> {
  try {
    const userIds = await getUserIdsByRole(roles);
    if (userIds.length === 0) {
      console.warn('⚠️ No users found for roles:', roles);
      return [];
    }

    const results: string[] = [];

    // إرسال متوازي لجميع المستخدمين
    const promises = userIds.map(async (userId) => {
      const result = await notifyUser(userId, notification);
      if (result) results.push(result);
    });

    await Promise.allSettled(promises); // لا نتوقف عند فشل أحدهم

    console.log(`✅ Notified ${results.length}/${userIds.length} users in roles:`, roles);
    return results;

  } catch (err) {
    console.error('❌ notifyRole failed:', err);
    return [];
  }
}

/**
 * إرسال إشعار للمدير المباشر
 */
export async function notifyManager(
  employeeId: string,
  notification: SystemNotification
): Promise<string | null> {
  try {
    const managerId = await getManagerId(employeeId);
    
    if (!managerId) {
      // إذا لم يوجد مدير، نرسل لـ HR
      console.log('⚠️ No manager found, notifying HR instead');
      const hrResults = await notifyRole(['hr', 'admin'], {
        ...notification,
        title: `[بدون مشرف] ${notification.title}`,
      });
      return hrResults[0] || null;
    }

    return await notifyUser(managerId, notification);

  } catch (err) {
    console.error('❌ notifyManager failed:', err);
    return null;
  }
}

/**
 * إرسال إشعار لجميع المشرفين
 */
export async function notifySupervisors(
  employeeId: string,
  notification: SystemNotification
): Promise<string[]> {
  try {
    const supervisorIds = await getSupervisorIds(employeeId);
    const results: string[] = [];

    const promises = supervisorIds.map(async (supId) => {
      const result = await notifyUser(supId, notification);
      if (result) results.push(result);
    });

    await Promise.allSettled(promises);

    console.log(`✅ Notified ${results.length} supervisors for employee ${employeeId}`);
    return results;

  } catch (err) {
    console.error('❌ notifySupervisors failed:', err);
    return [];
  }
}

// ════════════════════════════════════════════════════════════════
//  Realtime Subscriptions (محسَّنة)
// ════════════════════════════════════════════════════════════════

let realtimeChannel: any = null;

/**
 * الاشتراك في إشعارات Realtime للمستخدم
 */
export function subscribeToRealtimeNotifications(
  userId: string,
  onNotification: (notification: any) => void
): () => void {
  if (!userId) return () => {};

  // إلغاء الاشتراك السابق
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }

  // اشتراك جديد
  realtimeChannel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('🔔 New notification via Realtime:', payload.new);
        const newNotif = payload.new;

        // تخزين محلي للتزامن
        addNotification(userId, {
          type: newNotif.type,
          priority: newNotif.priority,
          title: newNotif.title,
          message: newNotif.message,
          actionUrl: newNotif.action_url,
          groupKey: newNotif.group_key,
          metadata: newNotif.metadata,
        });

        onNotification(newNotif);
      }
    )
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime notifications subscribed for:', userId);
      } else if (status === 'CLOSED') {
        console.log('🔴 Realtime notifications disconnected');
      }
    });

  // دالة إلغاء الاشتراك
  return () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
      console.log('🔴 Realtime notifications unsubscribed');
    }
  };
}

// ════════════════════════════════════════════════════════════════
//  دوال إدارة الإشعارات من السيرفر
// ════════════════════════════════════════════════════════════════

/**
 * جلب إشعارات المستخدم من Supabase
 */
export async function fetchNotificationsFromServer(
  userId: string,
  limit = 50,
  unreadOnly = false
): Promise<any[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    console.log(`✅ Loaded ${data?.length || 0} notifications from server`);
    return data || [];

  } catch (err) {
    console.error('❌ Failed to fetch server notifications:', err);
    return [];
  }
}

/**
 * تحديد إشعار كمقروء على السيرفر
 */
export async function markAsReadOnServer(
  userId: string,
  notificationId: string
): Promise<boolean> {
  // تجاهل الـ IDs المحلية (تبدأ بـ notif_)
  if (!notificationId || notificationId.startsWith('notif_')) return true;

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
    
    console.log(`✅ Marked notification as read: ${notificationId}`);
    return true;

  } catch (err) {
    console.error('❌ Failed to mark as read:', err);
    return false;
  }
}

/**
 * تحديد جميع الإشعارات كمقروءة
 */
export async function markAllAsReadOnServer(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select('id');

    if (error) throw error;
    
    const count = data?.length || 0;
    console.log(`✅ Marked ${count} notifications as read`);
    return count;

  } catch (err) {
    console.error('❌ Failed to mark all as read:', err);
    return 0;
  }
}

/**
 * حذف إشعار من السيرفر
 */
export async function deleteNotificationOnServer(
  userId: string,
  notificationId: string
): Promise<boolean> {
  // تجاهل الـ IDs المحلية
  if (!notificationId || notificationId.startsWith('notif_')) return true;

  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) throw error;
    
    console.log(`✅ Deleted notification: ${notificationId}`);
    return true;

  } catch (err) {
    console.error('❌ Failed to delete notification:', err);
    return false;
  }
}

/**
 * تنظيف الإشعارات القديمة (مجدولة)
 */
export async function cleanOldNotifications(daysOld = 90): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate)
      .select('id');

    if (error) throw error;
    
    const count = data?.length || 0;
    console.log(`🧹 Cleaned ${count} old notifications (${daysOld}+ days)`);
    return count;

  } catch (err) {
    console.error('❌ Failed to clean old notifications:', err);
    return 0;
  }
}

// ════════════════════════════════════════════════════════════════
//  دالة اختبار شاملة للنظام
// ════════════════════════════════════════════════════════════════

/**
 * اختبار شامل لنظام الإشعارات الجديد
 */
export async function testNotificationSystem(testUserId: string): Promise<void> {
  console.log('🧪 بدء اختبار نظام الإشعارات الجديد...');

  try {
    // اختبار 1: إرسال إشعار واحد
    console.log('📝 اختبار 1: إرسال إشعار واحد');
    const result1 = await notifyUser(testUserId, {
      type: 'system',
      priority: 'normal',
      title: '🧪 اختبار النظام الجديد',
      message: 'هذا اختبار للتأكد من عمل النظام بعد الإصلاحات',
      groupKey: 'system_test',
    });
    console.log(result1 ? '✅ نجح' : '❌ فشل');

    // اختبار 2: جلب الإشعارات
    console.log('📥 اختبار 2: جلب الإشعارات');
    const notifications = await fetchNotificationsFromServer(testUserId, 10);
    console.log(`✅ تم جلب ${notifications.length} إشعار`);

    // اختبار 3: تحديد كمقروء
    if (notifications.length > 0 && result1) {
      console.log('👁️ اختبار 3: تحديد كمقروء');
      const readResult = await markAsReadOnServer(testUserId, result1);
      console.log(readResult ? '✅ نجح' : '❌ فشل');
    }

    console.log('🎉 انتهى الاختبار!');
  } catch (err) {
    console.error('❌ فشل الاختبار:', err);
  }
}