import { Menu, Bell, Search, Sun, Moon, Sunset, ChevronDown } from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const viewTitles: Record<string, string> = {
  'employee-dashboard': 'لوحة التحكم',
  'employee-problems': 'مشاكلي المرفوعة',
  'employee-wellness': 'متتبع الصحة النفسية',
  'employee-survey': 'الاستبيانات',
  'employee-training': 'التدريب والتطوير',
  'employee-sops': 'إجراءات التشغيل القياسية (SOPs)',
  'employee-ai-chat': 'محادثة الذكاء الاصطناعي',
  'employee-contact': 'تواصل مع الموارد البشرية',
  'employee-profile': 'الملف الشخصي',
  'hr-dashboard': 'لوحة موارد بشرية',
  'hr-problems': 'المشاكل المرفوعة',
  'hr-analytics': 'التحليلات والإحصاءات',
  'hr-team': 'فريق العمل',
  'hr-talent-market': 'سجل المؤهلات والكفاءات',
  'hr-communication': 'صندوق البريد',
  'gatekeeper-portal': 'بوابة تسجيل الحركة',
  'hr-movement-analysis': 'تحليل حركة الموظفين',
  'hr-reports': 'التقارير',
  'admin-dashboard': 'لوحة المشرف',
  'admin-cms': 'إدارة صفحة الزوار',
  'admin-employees': 'إدارة الموظفين',
  'admin-permissions': 'شجرة الصلاحيات',
  'admin-gatekeeper-permissions': 'صلاحيات المدراء والمشرفين',
  'admin-reports': 'التقارير الكاملة',
  'admin-settings': 'إعدادات النظام',
  'admin-audit-log': 'سجل العمليات',
  'admin-sops': 'إدارة إجراءات SOP',
  'admin-sops-reports': 'تقارير SOPs',
  'admin-ai-config': 'إعداد الذكاء الاصطناعي',
  'developer-dashboard': 'وحدة تحكم المطور',
  'developer-attendance': 'سجل الحضور',
  'developer-logs': 'مراقبة الأخطاء',
  'developer-db': 'إدارة قاعدة البيانات',
  'supervisor-breaks': 'توقيع خروج الموظفين',
  'problem-detail': 'تفاصيل المشكلة',
  'new-problem': 'رفع مشكلة جديدة',
};

export default function Header() {
  const { user } = useAuthStore();
  const { toggleSidebar, sidebarOpen, activeView, notifications, markNotificationRead } = useUIStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const unread = notifications.filter(n => !n.read);

  const today = format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar });
  
  const hour = new Date().getHours();
  const getGreeting = () => {
    if (hour >= 5 && hour < 12) return { text: 'صباح الخير', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', textColor: 'text-amber-700' };
    if (hour >= 12 && hour < 17) return { text: 'مساء الخير', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100', textColor: 'text-orange-700' };
    if (hour >= 17 && hour < 21) return { text: 'مساء النور', icon: Sunset, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', textColor: 'text-purple-700' };
    return { text: 'ليلة طيبة', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', textColor: 'text-indigo-700' };
  };
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // اسم المستخدم الصحيح - من البروفايل الحقيقي
  const displayName = user?.full_name || user?.name || 'مستخدم';
  const userRole = user?.role || '';

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-100 shadow-sm
      transition-all duration-300
      ${sidebarOpen ? 'mr-64' : 'mr-0 lg:mr-16'}
    `}>
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Right: toggle + title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors flex-shrink-0"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-800 truncate max-w-[150px] sm:max-w-[300px]">
              {activeView.startsWith('problem-detail') ? 'تفاصيل المشكلة' : viewTitles[activeView] || 'لوحة التحكم'}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">{today}</p>
          </div>
        </div>

        {/* Left */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Search - Desktop only */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-44 xl:w-52">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input type="text" placeholder="بحث سريع..." className="bg-transparent text-sm text-slate-600 outline-none placeholder-slate-400 flex-1 min-w-0" />
          </div>

          {/* Greeting - Desktop only */}
          <div className={`hidden lg:flex items-center gap-1.5 ${greeting.bg} border ${greeting.border} rounded-xl px-3 py-1.5`}>
            <GreetingIcon size={14} className={greeting.color} />
            <span className={`text-xs ${greeting.textColor} font-medium`}>{greeting.text}</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Bell size={18} />
              {unread.length > 0 && (
                <span className="absolute top-1.5 left-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            {showNotifs && (
              <div className="absolute left-0 top-12 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <span className="font-bold text-slate-800 text-sm">الإشعارات</span>
                  {unread.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">{unread.length} جديد</span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.slice(0, 5).map(notif => (
                    <div key={notif.id} onClick={() => markNotificationRead(notif.id)}
                      className={`p-3 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-indigo-50/50' : ''}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.type === 'success' ? 'bg-emerald-500' : notif.type === 'warning' ? 'bg-amber-500' : notif.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{notif.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">لا توجد إشعارات</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
              {displayName.charAt(0)}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-700 leading-tight truncate max-w-[120px]">{displayName}</p>
              <p className="text-xs text-slate-400 truncate max-w-[120px]">{user?.position || userRole}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}