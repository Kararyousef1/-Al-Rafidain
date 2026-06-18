/**
 * ════════════════════════════════════════════════════════════════
 *  NotificationBell - جرس الإشعارات المحسَّن
 * ════════════════════════════════════════════════════════════════
 *  ✅ متكامل مع نظام الإشعارات الجديد
 *  ✅ يحمّل من Supabase + localStorage
 *  ✅ Realtime subscriptions تلقائية
 *  ✅ تزامن فوري عبر الأجهزة
 * ════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2, ChevronLeft, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useUIStore, useAuthStore } from '../../store';

interface NotificationBellProps {
  userId?: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  maxDisplay?: number;
}

export default function NotificationBell({
  userId: propUserId,
  size = 'md',
  showBadge = true,
  maxDisplay = 5,
}: NotificationBellProps) {
  // ═══════════════ الحالة والمتغيرات ═══════════════
  const { user } = useAuthStore();
  const {
    notifications,
    setActiveView,
    loadNotificationsFromServer,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    markNotificationReadEnhanced,
    markAllReadEnhanced,
    deleteNotificationEnhanced,
    syncNotifications,
  } = useUIStore();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // استخدام userId من props أو user الحالي
  const currentUserId = propUserId || user?.id;

  // ═══════════════ التهيئة والـ Effects ═══════════════

  /**
   * تهيئة الإشعارات عند تحميل المكون
   */
  useEffect(() => {
    if (!currentUserId || hasInitialized) return;

    const initializeNotifications = async () => {
      setLoading(true);
      try {
        console.log('🔔 Initializing NotificationBell for user:', currentUserId);
        
        // 1. تحميل من السيرفر
        await loadNotificationsFromServer(currentUserId);
        
        // 2. بدء Realtime subscription
        subscribeToNotifications(currentUserId);
        
        setHasInitialized(true);
        console.log('✅ NotificationBell initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeNotifications();

    // تنظيف عند إلغاء المكون
    return () => {
      unsubscribeFromNotifications();
    };
  }, [currentUserId, hasInitialized, loadNotificationsFromServer, subscribeToNotifications, unsubscribeFromNotifications]);

  /**
   * إغلاق القائمة عند النقر خارجها
   */
  useEffect(() => {
    if (!open) return;
    
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  /**
   * تحديث الإشعارات عند فتح الجرس
   */
  useEffect(() => {
    if (open && currentUserId && hasInitialized) {
      // مزامنة سريعة عند فتح القائمة
      syncNotifications(currentUserId);
    }
  }, [open, currentUserId, hasInitialized, syncNotifications]);

  // ═══════════════ دوال المعالجة ═══════════════

  /**
   * فتح/إغلاق قائمة الإشعارات
   */
  const toggleDropdown = () => {
    setOpen(!open);
  };

  /**
   * التعامل مع النقر على إشعار
   */
  const handleNotificationClick = async (notifId: string, actionUrl?: string) => {
    if (!currentUserId) return;

    // تحديد كمقروء
    await markNotificationReadEnhanced(currentUserId, notifId);

    // التنقل إذا كان هناك رابط
    if (actionUrl) {
      setActiveView(actionUrl);
    } else {
      // الانتقال لصفحة الإشعارات إذا لم يكن هناك رابط محدد
      setActiveView('my-notifications');
    }

    setOpen(false);
  };

  /**
   * تحديد جميع الإشعارات كمقروءة
   */
  const handleMarkAllRead = async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      await markAllReadEnhanced(currentUserId);
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('❌ Failed to mark all as read:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * حذف إشعار
   */
  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    if (!currentUserId) return;

    try {
      await deleteNotificationEnhanced(currentUserId, notifId);
      console.log('✅ Notification deleted:', notifId);
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
    }
  };

  /**
   * الانتقال لصفحة الإشعارات الكاملة
   */
  const goToNotificationsPage = () => {
    setOpen(false);
    setActiveView('my-notifications');
  };

  /**
   * إعادة تحميل الإشعارات يدوياً
   */
  const handleRefresh = async () => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      await syncNotifications(currentUserId);
      console.log('🔄 Notifications refreshed manually');
    } catch (error) {
      console.error('❌ Failed to refresh notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════ المتغيرات المحسوبة ═══════════════

  // فلترة الإشعارات للمستخدم الحالي
  const userNotifications = notifications.filter(n => 
    !n.userId || n.userId === currentUserId
  );

  // عدد غير المقروءة
  const unreadCount = userNotifications.filter(n => !n.read).length;

  // الإشعارات المعروضة (محدودة بالعدد الأقصى)
  const displayedNotifications = userNotifications.slice(0, maxDisplay);

  // حجم الأيقونة
  const iconSize = size === 'sm' ? 16 : size === 'md' ? 18 : 20;

  // ═══════════════ التحقق من المتطلبات ═══════════════

  if (!currentUserId) {
    return null; // لا نعرض الجرس إذا لم يكن هناك مستخدم
  }

  // ═══════════════ العرض الرئيسي ═══════════════

  return (
    <div className="relative" ref={dropdownRef}>
      {/* زر الجرس */}
      <button
        onClick={toggleDropdown}
        disabled={loading && !hasInitialized}
        className={`relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors ${
          loading && !hasInitialized ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        aria-label={`الإشعارات ${unreadCount > 0 ? `- ${unreadCount} جديد` : ''}`}
        title={`الإشعارات ${unreadCount > 0 ? `(${unreadCount} غير مقروء)` : ''}`}
      >
        {loading && !hasInitialized ? (
          <RefreshCw size={iconSize} className="animate-spin" />
        ) : (
          <Bell size={iconSize} />
        )}
        
        {/* عداد الإشعارات غير المقروءة */}
        {showBadge && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* القائمة المنسدلة */}
      {open && (
        <div className="absolute left-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-5 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-slate-500" />
              <span className="font-bold text-slate-800 text-sm">الإشعارات</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} جديد
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {/* زر التحديث */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="text-xs text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
                title="إعادة تحميل"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </button>
              
              {/* تحديد الكل كمقروء */}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  <CheckCheck size={12} />
                  تحديد الكل
                </button>
              )}
            </div>
          </div>

          {/* قائمة الإشعارات */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {displayedNotifications.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Bell size={32} className="mx-auto text-slate-200 mb-2" />
                <p className="text-sm text-slate-400 font-medium">
                  {hasInitialized ? 'لا توجد إشعارات' : 'جاري التحميل...'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.id, notif.actionUrl)}
                  className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors group relative ${
                    !notif.read ? 'bg-indigo-50/30 border-r-2 border-indigo-400' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* نقطة الحالة */}
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                        notif.read 
                          ? 'bg-slate-300' 
                          : 'bg-indigo-500 animate-pulse'
                      }`}
                    />
                    
                    {/* محتوى الإشعار */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${
                        notif.read 
                          ? 'text-slate-600 font-medium' 
                          : 'text-slate-800 font-bold'
                      }`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-2">
                        <span>
                          {format(new Date(notif.createdAt), 'dd MMM، HH:mm', { locale: ar })}
                        </span>
                        {notif.priority && notif.priority !== 'normal' && (
                          <span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase ${
                            notif.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                            notif.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {notif.priority === 'urgent' ? 'عاجل' :
                             notif.priority === 'high' ? 'مهم' : 'منخفض'}
                          </span>
                        )}
                      </p>
                    </div>
                    
                    {/* زر الحذف */}
                    <button
                      onClick={(e) => handleDeleteNotification(e, notif.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all flex-shrink-0 p-1 hover:bg-red-50 rounded"
                      title="حذف الإشعار"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {displayedNotifications.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50">
              <button
                onClick={goToNotificationsPage}
                className="w-full text-center text-xs text-indigo-600 hover:text-indigo-700 font-bold py-2 flex items-center justify-center gap-1 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                عرض كل الإشعارات
                {userNotifications.length > maxDisplay && (
                  <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px]">
                    +{userNotifications.length - maxDisplay}
                  </span>
                )}
                <ChevronLeft size={14} className="rotate-180" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}