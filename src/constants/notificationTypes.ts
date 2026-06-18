/**
 * ════════════════════════════════════════════════════════════════
 *  أنواع الإشعارات المركزية - Notification Types
 * ════════════════════════════════════════════════════════════════
 *  تعريف موحد لجميع أنواع الإشعارات في النظام
 * ════════════════════════════════════════════════════════════════
 */

/** نوع الإشعار - محدد بدقة لكل حالة استخدام */
export type NotificationType =
  | 'welcome'           // ترحيب بتسجيل الدخول (مرة واحدة فقط)
  | 'login'            // إشعار تسجيل دخول جديد
  | 'logout'           // إشعار تسجيل خروج
  | 'profile_update'   // تحديث الملف الشخصي
  | 'permission_update' // تحديث الصلاحيات
  | 'system'           // إشعار نظام عام
  | 'info'             // معلومات عامة
  | 'success'          // نجاح عملية
  | 'warning'          // تحذير
  | 'error'            // خطأ
  // 👇 إشعارات المشاكل (Problems)
  | 'problem_created'
  | 'problem_updated'
  | 'problem_comment'
  | 'problem_resolved'
  | 'problem_reopened'
  | 'problem_overdue'
  // 👇 إشعارات الإجازات (Leave Requests)
  | 'leave_requested'
  | 'leave_approved'
  | 'leave_rejected'
  | 'leave_expiring'
  | 'leave_balance_low'
  // 👇 إشعارات التعيينات
  | 'assigned_to_you'
  | 'unassigned_from_you'
  // 👇 إشعارات SOPs
  | 'sop_created'
  | 'sop_approved'
  | 'sop_assigned'
  | 'sop_rejected'
  | 'sop_expiring'
  // 👇 إشعارات التدريب
  | 'training_completed'
  | 'training_assigned'
  | 'training_due'
  | 'training_overdue'
  | 'training_cert_ready'
  // 👇 إشعارات الاستبيانات
  | 'survey_published'
  | 'survey_reminder'
  | 'survey_deadline_soon'
  | 'survey_results_ready'
  // 👇 إشعارات العافية
  | 'wellness_update'
  | 'wellness_alert'
  | 'wellness_improvement'
  | 'wellness_checkin_reminder'
  // 👇 إشعارات الحضور
  | 'attendance_recorded'
  | 'attendance_violation'
  | 'attendance_late'
  | 'attendance_absent'
  | 'attendance_overtime'
  // 👇 إشعارات الحارس
  | 'gatekeeper_entry'
  | 'gatekeeper_exit'
  | 'gatekeeper_visitor'
  | 'gatekeeper_suspicious'
  // 👇 إشعارات الإعلانات
  | 'announcement_published'
  | 'announcement_urgent'
  | 'announcement_birthday'
  | 'announcement_ramadan'
  | 'announcement_holiday'
  // 👇 إشعارات الكشك
  | 'kiosk_session'
  | 'kiosk_alert'
  | 'kiosk_break_reminder'
  // 👇 إشعارات الموظفين
  | 'employee_approved'
  | 'employee_rejected'
  | 'employee_onboarding'
  | 'employee_anniversary'
  // 👇 إشعارات اجتماعات
  | 'meeting_scheduled'
  | 'meeting_reminder'
  | 'meeting_cancelled'
  | 'meeting_rescheduled'
  | 'meeting_minutes_ready'
  // 👇 إشعارات مهام
  | 'task_assigned'
  | 'task_overdue'
  | 'task_completed'
  | 'task_reminder'
  // 👇 إشعارات النظام
  | 'system_maintenance'
  | 'system_update'
  | 'system_security_alert'
  | 'system_backup_completed'
  | 'system_error'
  // 👇 إشعارات التقييم
  | 'evaluation_pending'
  | 'evaluation_completed'
  | 'evaluation_reminder'
  // 👇 إشعارات الرواتب
  | 'salary_paid'
  | 'salary_slip_ready'
  | 'salary_bonus'
  // 👇 إشعارات خاصة بالمطورين
  | 'developer_deploy_ready'
  | 'developer_db_backup'
  | 'developer_api_error';

/** مستوى أهمية الإشعار */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

/** واجهة الإشعار الموحدة */
export interface AppNotification {
  /** معرف فريد للإشعار */
  id: string;
  /** نوع الإشعار */
  type: NotificationType;
  /** أولوية الإشعار */
  priority: NotificationPriority;
  /** عنوان الإشعار */
  title: string;
  /** محتوى الإشعار */
  message: string;
  /** هل تمت قراءة الإشعار؟ */
  read: boolean;
  /** تاريخ الإنشاء (ISO) */
  createdAt: string;
  /** تاريخ القراءة (ISO) - اختياري */
  readAt?: string;
  /** معرف المستخدم المستهدف (null = جميع المستخدمين) */
  userId: string | null;
  /** رابط الإجراء (اختياري) */
  actionUrl?: string;
  /** معرف مجموعة الإشعارات (لتجنب التكرار) */
  groupKey?: string;
  /** تاريخ انتهاء الصلاحية (ISO) - اختياري */
  expiresAt?: string;
  /** بيانات إضافية مرنة */
  metadata?: Record<string, unknown>;
}

/** نوع فلتر الإشعارات */
export type NotificationFilter = 'all' | 'unread' | NotificationType;

/** إحصائيات الإشعارات */
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}
