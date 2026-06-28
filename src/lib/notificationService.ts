/**
 * ════════════════════════════════════════════════════════════════
 *  NotificationService - خدمة الإشعارات المركزية (مُعاد كتابته بالكامل)
 * ════════════════════════════════════════════════════════════════
 *  ✅ يستخدم RPC الآمن (create_notification_safe)
 *  ✅ تحويل تلقائي employee_id → user_id
 *  ✅ لا كتابة مزدوجة (Supabase أولاً، localStorage للكاش فقط)
 *  ✅ Realtime subscriptions محسَّنة
 *  ✅ دعم 70+ نوع إشعار
 * ════════════════════════════════════════════════════════════════
 */
import { supabase } from './supabase';
import type { AppNotification, NotificationType } from '../constants/notificationTypes';
import type { UserRole } from '../types';
// ════════════════════════════════════════════════════════════════
//  تحويل مركزي: snake_case (السيرفر) → camelCase (الواجهة)
// ════════════════════════════════════════════════════════════════
interface RawServerNotification {
  id: string;
  user_id?: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  action_url?: string;
  group_key?: string;
  metadata?: Record<string, unknown>;
  expires_at?: string;
}

/**
 * تحويل البيانات الخام من السيرفر (snake_case) إلى AppNotification (camelCase)
 * هذه الدالة هي المصدر الوحيد للتحويل — يجب استخدامها في كل مكان
 */
export function transformServerNotification(raw: RawServerNotification): AppNotification {
  return {
    id: raw.id,
    userId: raw.user_id || '',
    type: raw.type as NotificationType,
    priority: (raw.priority as AppNotification['priority']) || 'normal',
    title: raw.title,
    message: raw.message,
    read: raw.is_read || false,
    readAt: raw.read_at,
    createdAt: raw.created_at,
    actionUrl: raw.action_url,
    groupKey: raw.group_key,
    metadata: raw.metadata || {},
    expiresAt: raw.expires_at,
  };
}

// ════════════════════════════════════════════════════════════════
//  أنواع البيانات
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
//  دوال جلب المستخدمين
// ════════════════════════════════════════════════════════════════
/** جلب جميع المستخدمين الذين لديهم دور معين */
async function getUserIdsByRole(roles: UserRole[]): Promise<string[]> {
  const ids: string[] = [];
  
  try {
    // البحث في profiles (auth.users.id)
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
    // Fallback: البحث في employees ثم التحويل
    if (ids.length === 0) {
      const dbRoles = roles.map(r => r === 'admin' ? 'system_admin' : r);
      
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('user_id')
        .in('role', dbRoles)
        .eq('is_active', true)
        .not('user_id', 'is', null);
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
async function getManagerId(employeeIdOrUserId: string): Promise<string | null> {
  try {
    // محاولة 1: البحث في profiles مباشرة
    const { data: profileData } = await supabase
      .from('profiles')
      .select('manager_id')
      .eq('id', employeeIdOrUserId)
      .maybeSingle();
    if (profileData?.manager_id) return profileData.manager_id;
    // محاولة 2: البحث في employees ثم جلب manager_id
    const { data: empData } = await supabase
      .from('employees')
      .select('manager_id, user_id')
      .or(`id.eq.${employeeIdOrUserId},user_id.eq.${employeeIdOrUserId}`)
      .maybeSingle();
    if (empData?.manager_id) {
      // تحويل manager employee_id → user_id
      const { data: managerData } = await supabase
        .from('employees')
        .select('user_id')
        .eq('id', empData.manager_id)
        .maybeSingle();
      
      return managerData?.user_id || null;
    }
    return null;
  } catch (err) {
    console.error('❌ Error fetching manager:', err);
    return null;
  }
}
/** جلب جميع المشرفين (المدير المباشر + HR + Admin) */
async function getSupervisorIds(employeeIdOrUserId: string): Promise<string[]> {
  const ids: string[] = [];
  
  try {
    // المشرف المباشر
    const managerId = await getManagerId(employeeIdOrUserId);
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
//  دوال الإشعارات الأساسية (مُعاد كتابتها)
// ════════════════════════════════════════════════════════════════
/**
 * إرسال إشعار لمستخدم واحد
 * 
 * ✅ يقبل employee_id أو user_id (تحويل تلقائي)
 * ✅ يستخدم RPC الآمن create_notification_safe
 * ✅ لا كتابة مزدوجة (Supabase فقط، localStorage يتزامن عبر Realtime)
 * 
 * @param targetUserId - يمكن أن يكون employee.id أو auth.users.id
 * @param notification - بيانات الإشعار
 * @returns معرف الإشعار (BIGINT) أو null عند الفشل
 */
export async function notifyUser(
  targetUserId: string,
  notification: SystemNotification
): Promise<string | null> {
  if (!targetUserId) {
    console.warn('⚠️ notifyUser: targetUserId is empty');
    return null;
  }
  try {
    // استخدام RPC الآمن (يحوّل employee_id → user_id تلقائياً)
    const { data, error } = await supabase.rpc('create_notification_safe', {
      p_target_user: targetUserId,
      p_type: notification.type,
      p_priority: notification.priority,
      p_title: notification.title,
      p_message: notification.message,
      p_action_url: notification.actionUrl || null,
      p_group_key: notification.groupKey || null,
      p_metadata: notification.metadata || {},
      p_expires_at: notification.expiresAt || null,
    });
    if (error) {
      console.error('❌ notifyUser RPC failed:', error);
      return null;
    }
    console.log(`✅ Notification created (ID: ${data}):`, notification.title);
    return data?.toString() || null;
  } catch (err) {
    console.error('❌ notifyUser exception:', err);
    return null;
  }
}
/**
 * إرسال إشعار لمجموعة من الأدوار
 * 
 * @param roles - الأدوار المستهدفة ['hr', 'admin', ...]
 * @param notification - بيانات الإشعار
 * @returns قائمة معرفات الإشعارات الناجحة
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
    // إرسال متوازي
    const promises = userIds.map(async (userId) => {
      const result = await notifyUser(userId, notification);
      if (result) results.push(result);
    });
    await Promise.allSettled(promises);
    console.log(`✅ Notified ${results.length}/${userIds.length} users in roles:`, roles);
    return results;
  } catch (err) {
    console.error('❌ notifyRole failed:', err);
    return [];
  }
}
/**
 * إرسال إشعار للمدير المباشر
 * 
 * @param employeeIdOrUserId - معرف الموظف (employee.id أو user_id)
 * @param notification - بيانات الإشعار
 */
export async function notifyManager(
  employeeIdOrUserId: string,
  notification: SystemNotification
): Promise<string | null> {
  try {
    const managerId = await getManagerId(employeeIdOrUserId);
    
    if (!managerId) {
      // Fallback: إرسال لـ HR
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
 * إرسال إشعار لجميع المشرفين (المدير المباشر + HR + Admin)
 */
export async function notifySupervisors(
  employeeIdOrUserId: string,
  notification: SystemNotification
): Promise<string[]> {
  try {
    const supervisorIds = await getSupervisorIds(employeeIdOrUserId);
    if (supervisorIds.length === 0) {
      console.warn('⚠️ No supervisors found');
      return [];
    }
    const results: string[] = [];
    const promises = supervisorIds.map(async (supId) => {
      const result = await notifyUser(supId, notification);
      if (result) results.push(result);
    });
    await Promise.allSettled(promises);
    console.log(`✅ Notified ${results.length} supervisors`);
    return results;
  } catch (err) {
    console.error('❌ notifySupervisors failed:', err);
    return [];
  }
}
// ════════════════════════════════════════════════════════════════
//  Realtime Subscriptions
// ════════════════════════════════════════════════════════════════
let realtimeChannel: any = null;
/**
 * الاشتراك في إشعارات Realtime للمستخدم
 * البيانات تُحوّل تلقائياً عبر transformServerNotification
 */
export function subscribeToRealtimeNotifications(
  userId: string,
  onNotification: (notification: AppNotification) => void
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
        if (payload.new) {
          const notif = transformServerNotification(payload.new as unknown as RawServerNotification);
          onNotification(notif);
        }
      }
    )
    .subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        // نشط
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime error - check if table is in publication');
      }
    });
  // دالة إلغاء الاشتراك
  return () => {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };
}
// ════════════════════════════════════════════════════════════════
//  دوال إدارة الإشعارات
// ════════════════════════════════════════════════════════════════
/**
 * جلب إشعارات المستخدم من Supabase (مع تحويل مركزي)
 */
export async function fetchNotificationsFromServer(
  userId: string,
  limit = 50,
  unreadOnly = false
): Promise<AppNotification[]> {
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

    const notifications = (data || []).map((n) => transformServerNotification(n as unknown as RawServerNotification));
    return notifications;
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
  notificationId: string | number
): Promise<boolean> {
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
    
    console.log(`✅ Marked notification ${notificationId} as read`);
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
  notificationId: string | number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);
    if (error) throw error;
    
    console.log(`✅ Deleted notification ${notificationId}`);
    return true;
  } catch (err) {
    console.error('❌ Failed to delete notification:', err);
    return false;
  }
}
/**
 * حذف جميع إشعارات المستخدم من السيرفر (عملية واحدة)
 */
export async function deleteAllNotificationsOnServer(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .select('id');
    if (error) throw error;

    return data?.length || 0;
  } catch (err) {
    console.error('❌ Failed to delete all notifications:', err);
    return 0;
  }
}

/**
 * تنظيف الإشعارات القديمة (مجدولة)
 * @param _daysOld - محجوز للتوافق مع واجهات سابقة (غير مستخدم حالياً، السيرفر يحذف المنتهي الصلاحية فقط)
 */
export async function cleanOldNotifications(_daysOld = 90): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_notifications');
    if (error) throw error;

    const count = data || 0;
    console.log(`🧹 Cleaned ${count} expired notifications`);
    return count;
  } catch (err) {
    console.error('❌ Failed to clean old notifications:', err);
    return 0;
  }
}
// ════════════════════════════════════════════════════════════════
//  دالة اختبار شاملة
// ════════════════════════════════════════════════════════════════
/**
 * اختبار نظام الإشعارات الجديد
 * 
 * الاستخدام في Console:
 * ```
 * import { testNotificationSystem } from './lib/notificationService';
 * testNotificationSystem('your-user-id-here');
 * ```
 */
export async function testNotificationSystem(testUserId: string): Promise<void> {
  console.log('🧪 بدء اختبار نظام الإشعارات...');
  try {
    // اختبار 1: إرسال إشعار
    console.log('📝 Test 1: إرسال إشعار واحد');
    const result1 = await notifyUser(testUserId, {
      type: 'system',
      priority: 'normal',
      title: '🧪 اختبار النظام المُصلَح',
      message: 'إذا ظهر هذا الإشعار بدون تكرار، فالنظام يعمل بشكل صحيح!',
      groupKey: 'test-notification',
    });
    console.log(result1 ? '✅ نجح' : '❌ فشل');
    // اختبار 2: جلب الإشعارات
    console.log('📥 Test 2: جلب الإشعارات');
    const notifications = await fetchNotificationsFromServer(testUserId, 10);
    console.log(`✅ تم جلب ${notifications.length} إشعار`);
    // اختبار 3: تحديد كمقروء
    if (notifications.length > 0 && result1) {
      console.log('👁️ Test 3: تحديد كمقروء');
      const readResult = await markAsReadOnServer(testUserId, result1);
      console.log(readResult ? '✅ نجح' : '❌ فشل');
    }
    console.log('🎉 انتهى الاختبار بنجاح!');
  } catch (err) {
    console.error('❌ فشل الاختبار:', err);
  }
}