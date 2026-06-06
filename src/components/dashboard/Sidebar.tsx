import { useState, useEffect } from 'react';
import {
  LayoutDashboard, FileText, MessageSquare, ClipboardList, Heart, Bot,
  User, Users, BarChart2, TrendingUp, Radio, FileBarChart, Settings,
  ShieldCheck, Cpu, ChevronRight, LogOut, Bell, Building2, Star, Terminal, Database, AlertOctagon, BookOpen, BarChart3, Globe, Award, X, ArrowRightLeft, Clock, CheckCircle2, Layers
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { UserRole } from '../../types';
import { supabase } from '../../lib/supabase';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  roles: UserRole[];
  badge?: number;
  section?: string;
  permKey?: string; // مفتاح الصلاحية المطابق لما في لوحة الإدارة
}

const navItems: NavItem[] = [
  // Employee
  { id: 'employee-dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['employee'], section: 'employee', permKey: 'dashboard' },
  { id: 'employee-problems', label: 'مشاكلي', icon: FileText, roles: ['employee'], section: 'employee', badge: 2, permKey: 'problems' },
  { id: 'employee-wellness', label: 'الصحة النفسية', icon: Heart, roles: ['employee'], section: 'employee', permKey: 'wellness' },
  { id: 'employee-survey', label: 'الاستبيانات', icon: ClipboardList, roles: ['employee'], section: 'employee', permKey: 'survey' },
  { id: 'employee-training', label: 'التدريب والتطوير', icon: BookOpen, roles: ['employee'], section: 'employee', permKey: 'training' },
  { id: 'employee-sops', label: 'إجراءات SOP', icon: FileText, roles: ['employee'], section: 'employee', permKey: 'sops' },
  { id: 'employee-ai-chat', label: 'محادثة AI', icon: Bot, roles: ['employee'], section: 'employee', permKey: 'ai-chat' },
  { id: 'employee-contact', label: 'تواصل مع HR', icon: MessageSquare, roles: ['employee'], section: 'employee', permKey: 'contact' },
  { id: 'employee-profile', label: 'ملفي الشخصي', icon: User, roles: ['employee'], section: 'employee', permKey: 'profile' },
  { id: 'employee-attendance', label: 'حضوري', icon: Clock, roles: ['employee'], section: 'employee', permKey: 'attendance' },
  { id: 'employee-leave-requests', label: 'طلب إجازة', icon: FileText, roles: ['employee'], section: 'employee', permKey: 'leave-requests' },
  // HR
  { id: 'hr-dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['hr'], section: 'hr', permKey: 'dashboard' },
  { id: 'hr-movement-analysis', label: 'تحليل الحركة', icon: BarChart3, roles: ['hr'], section: 'hr', permKey: 'movement-analysis' },
  { id: 'hr-problems', label: 'المشاكل المرفوعة', icon: FileText, roles: ['hr'], section: 'hr', badge: 4, permKey: 'problems' },
  { id: 'hr-analytics', label: 'التحليلات', icon: BarChart2, roles: ['hr'], section: 'hr', permKey: 'analytics' },
  { id: 'hr-team', label: 'فريق العمل', icon: Users, roles: ['hr'], section: 'hr', permKey: 'team' },
  { id: 'hr-talent-market', label: 'سجل المؤهلات', icon: Award, roles: ['hr'], section: 'hr', permKey: 'talent-market' },
  { id: 'hr-communication', label: 'صندوق البريد', icon: MessageSquare, roles: ['hr'], section: 'hr', permKey: 'communication' },
  { id: 'hr-reports', label: 'التقارير', icon: FileBarChart, roles: ['hr'], section: 'hr', permKey: 'reports' },
  { id: 'hr-attendance', label: 'سجلات الحضور', icon: Clock, roles: ['hr', 'admin'], section: 'hr', permKey: 'attendance' },
  { id: 'hr-leave-requests', label: 'طلبات الإجازة', icon: FileText, roles: ['hr', 'admin'], section: 'hr', permKey: 'leave-requests' },
  // Supervisor
  { id: 'supervisor-breaks', label: 'توقيع خروج الموظفين', icon: ArrowRightLeft, roles: ['supervisor', 'manager'], section: 'supervisor', permKey: 'supervisor-breaks' },
  { id: 'supervisor-leave-requests', label: 'إجازات فريقي', icon: FileText, roles: ['supervisor', 'manager'], section: 'supervisor', permKey: 'leave-requests' },
  // Gatekeeper
  { id: 'gatekeeper-portal', label: 'بوابة الحركة', icon: Users, roles: ['gatekeeper'], section: 'gatekeeper', permKey: 'gatekeeper-portal' },
  // Notifications for all
  { id: 'notifications', label: 'التبليغات', icon: MessageSquare, roles: ['employee', 'hr', 'admin', 'gatekeeper', 'developer', 'supervisor', 'manager'], section: 'notifications', permKey: 'notifications' },
  // Admin
  { id: 'admin-dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['admin'], section: 'admin', permKey: 'dashboard' },
  { id: 'admin-cms', label: 'إدارة صفحة الزوار', icon: Globe, roles: ['admin'], section: 'admin', permKey: 'cms' },
  { id: 'admin-employees', label: 'إدارة الموظفين', icon: Users, roles: ['admin'], section: 'admin', permKey: 'employees' },
  { id: 'admin-permissions', label: 'شجرة الصلاحيات', icon: ShieldCheck, roles: ['admin'], section: 'admin', permKey: 'permissions' },
  { id: 'admin-gatekeeper-permissions', label: 'صلاحيات المدراء والمشرفين', icon: ShieldCheck, roles: ['admin'], section: 'admin', permKey: 'gatekeeper-permissions' },
  { id: 'admin-reports', label: 'تقارير النظام', icon: FileBarChart, roles: ['admin'], section: 'admin', permKey: 'reports' },
  { id: 'admin-settings', label: 'الإعدادات', icon: Settings, roles: ['admin'], section: 'admin', permKey: 'settings' },
  { id: 'admin-audit-log', label: 'سجل العمليات', icon: ShieldCheck, roles: ['admin'], section: 'admin', permKey: 'audit-log' },
  { id: 'admin-sops', label: 'إدارة SOPs', icon: FileText, roles: ['admin'], section: 'admin', permKey: 'sops' },
  { id: 'admin-sops-reports', label: 'تقارير SOPs', icon: BarChart3, roles: ['admin'], section: 'admin', permKey: 'sops-reports' },
  { id: 'admin-ai-config', label: 'إعداد الذكاء الاصطناعي', icon: Cpu, roles: ['admin'], section: 'admin', permKey: 'ai-config' },
  // Developer
  { id: 'developer-dashboard', label: 'وحدة تحكم المطور', icon: Terminal, roles: ['developer'], section: 'developer', permKey: 'developer-dashboard' },
  { id: 'developer-attendance', label: 'سجل الحضور والبصمة', icon: Clock, roles: ['developer', 'admin', 'hr'], section: 'developer', permKey: 'developer-attendance' },
  { id: 'developer-logs', label: 'مراقبة الأخطاء', icon: AlertOctagon, roles: ['developer'], section: 'developer', permKey: 'developer-logs' },
  { id: 'developer-db', label: 'إدارة قاعدة البيانات', icon: Database, roles: ['developer'], section: 'developer', permKey: 'developer-db' },
  { id: 'developer-structure', label: 'هيكلية النظام', icon: Layers, roles: ['developer'], section: 'developer', permKey: 'developer-structure' },
];

const roleLabels: Record<UserRole, string> = {
  employee: 'بوابة الموظف',
  hr: 'لوحة الموارد البشرية',
  admin: 'لوحة المشرف',
  gatekeeper: 'بوابة تسجيل الحركة',
  developer: 'بيئة التطوير المركزية',
  supervisor: 'لوحة المشرف',
  manager: 'لوحة المدير',
};

const roleColors: Record<UserRole, string> = {
  employee: 'from-indigo-500 to-purple-600',
  hr: 'from-emerald-500 to-teal-600',
  admin: 'from-orange-500 to-red-500',
  gatekeeper: 'from-cyan-500 to-blue-600',
  developer: 'from-slate-800 to-black',
  supervisor: 'from-blue-500 to-blue-700',
  manager: 'from-amber-500 to-orange-600',
};

const roleBgs: Record<UserRole, string> = {
  employee: 'from-indigo-50 to-purple-50',
  hr: 'from-emerald-50 to-teal-50',
  admin: 'from-orange-50 to-red-50',
  gatekeeper: 'from-cyan-50 to-blue-50',
  developer: 'from-slate-100 to-slate-200',
  supervisor: 'from-blue-50 to-blue-100',
  manager: 'from-amber-50 to-orange-50',
};

// الصلاحيات الافتراضية لكل دور في حال لم يتم تحديد صلاحيات مخصصة للمستخدم
// يجب أن تكون متطابقة مع ما في store/index.ts و AdminEmployeesPage.tsx
const defaultPermissions: Record<UserRole, string[]> = {
  employee: ['dashboard', 'problems', 'wellness', 'survey', 'training', 'sops', 'ai-chat', 'contact', 'profile', 'notifications', 'attendance', 'leave-requests'],
  hr: ['dashboard', 'movement-analysis', 'problems', 'analytics', 'team', 'talent-market', 'communication', 'reports', 'notifications', 'attendance'],
  gatekeeper: ['gatekeeper-portal', 'notifications'],
  admin: ['dashboard', 'cms', 'employees', 'permissions', 'gatekeeper-permissions', 'reports', 'settings', 'audit-log', 'sops', 'sops-reports', 'ai-config', 'notifications', 'gallery-video', 'attendance', 'leave-requests', 'developer-db'],
  developer: ['developer-dashboard', 'developer-attendance', 'developer-logs', 'developer-db', 'notifications', 'dashboard'],
  supervisor: ['dashboard', 'problems', 'team', 'reports', 'supervisor-breaks', 'profile', 'attendance', 'leave-requests', 'notifications'],
  manager: ['dashboard', 'problems', 'team', 'reports', 'analytics', 'supervisor-breaks', 'profile', 'attendance', 'leave-requests', 'notifications'],
};

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const refreshUser = useAuthStore.getState().refreshUser;
  const { sidebarOpen, activeView, setActiveView, notifications, setSidebarOpen } = useUIStore();
  const [dynamicBadges, setDynamicBadges] = useState({ problems: 0, messages: 0 });
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  // إعادة تحميل بيانات المستخدم بشكل دوري لضمان تحديث الصلاحيات
  useEffect(() => {
    // تحميل فوري عند بداية تحميل الـ Sidebar
    refreshUser();
    
    const interval = setInterval(() => {
      refreshUser();
    }, 15000); // كل 15 ثانية (بدلاً من 30 للتجاوب الأسرع)
    return () => clearInterval(interval);
  }, [refreshUser]);

  useEffect(() => {
    if (user?.role !== 'hr') return;

    const fetchBadges = async () => {
      const [
        { count: problemsCount },
        { count: messagesCount }
      ] = await Promise.all([
        supabase.from('incidents').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('hr_messages').select('id', { count: 'exact' }).eq('status', 'new')
      ]);
      setDynamicBadges({ problems: problemsCount || 0, messages: messagesCount || 0 });
    };

    fetchBadges();
    const channel = supabase.channel('hr-badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, fetchBadges)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hr_messages' }, fetchBadges)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const userItems: NavItem[] = [
    ...navItems,
    // Add dynamic tab for supervisors with gatekeeper permission
    ...(user.can_manage_breaks ? [{ id: 'supervisor-breaks', label: 'توقيع خروج الموظفين', icon: ArrowRightLeft, roles: [user.role || 'employee'], section: 'supervisor', permKey: 'supervisor-breaks' } as NavItem] : [])
  ]
    .filter(item => {
      // التحقق الأساسي من الدور (مع توفير قيمة افتراضية 'employee' في حال كان الدور غير معرف)
      const userRole = (user.role as UserRole) || 'employee';
      if (!item.roles.includes(userRole)) return false;

      // الصلاحيات الفعالة: دمج الصلاحيات من قاعدة البيانات مع الصلاحيات الافتراضية
      // الصلاحيات من قاعدة البيانات تحل محل الافتراضية (تتحكم كلياً)
      const customPermissions = (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) ? user.permissions : null;
      const effectivePermissions = customPermissions ?? defaultPermissions[userRole] ?? defaultPermissions['employee'];

      // إذا كان للعنصر مفتاح صلاحية محدد، نتحقق من وجوده في الصلاحيات الفعالة
      if (item.permKey) {
        return effectivePermissions.includes(item.permKey);
      }
      
      // إذا لم يكن هناك مفتاح صلاحية محدد، نسمح به افتراضياً
      return true;
    })
    .map(item => {
      if (item.id === 'hr-problems') return { ...item, badge: dynamicBadges.problems > 0 ? dynamicBadges.problems : undefined } as NavItem;
      if (item.id === 'hr-communication') return { ...item, badge: dynamicBadges.messages > 0 ? dynamicBadges.messages : undefined } as NavItem;
      return item;
    });

  return (
    <aside className={`
      fixed right-0 top-0 h-full z-40 transition-all duration-300 flex flex-col
      ${sidebarOpen ? 'w-64' : 'w-0 lg:w-16 overflow-hidden lg:overflow-visible'}
      bg-white border-l border-slate-100 shadow-xl
    `}>
      {/* Header / Logo */}
      <div className={`p-4 border-b border-slate-100 bg-gradient-to-br ${roleColors[user.role]} flex items-center justify-between`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden flex-1">
              <p className="text-white font-bold text-sm leading-tight">الرافدين</p>
              <p className="text-white/70 text-xs truncate">{roleLabels[user.role]}</p>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors flex-shrink-0">
            <X size={18} />
          </button>
        )}
      </div>

      {/* User Info */}
      {sidebarOpen && (
        <div className={`p-4 border-b border-slate-100 bg-gradient-to-br ${roleBgs[user.role]}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleColors[user.role]} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
              {(user?.name || user?.full_name || 'U').charAt(0)}
            </div>
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <p className="text-slate-800 font-semibold text-sm truncate">{user?.full_name || user?.name || 'مستخدم'}</p>
                  <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={10} className="text-white" />
                  </span>
                </div>
                <p className="text-slate-500 text-xs truncate">{user?.position || user?.role || ''}</p>
              </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-1">
          {userItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id || (item.id === 'employee-problems' && activeView.startsWith('problem-detail') && user.role === 'employee') || (item.id === 'hr-problems' && activeView.startsWith('problem-detail') && user.role === 'hr');
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? `sidebar-item-active`
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }
                `}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                {sidebarOpen && (
                  <>
                    <span className="text-sm font-medium flex-1 text-right">{item.label}</span>
                    {item.badge && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-red-100 text-red-600'}`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight size={14} className="text-white/70" />}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-slate-100 space-y-1">
        {sidebarOpen && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-slate-50 rounded-xl p-2.5 flex items-center gap-2">
              <Star size={14} className="text-amber-500" />
              <span className="text-xs text-slate-600 font-medium">الصحة: {user.wellnessScore || 0}%</span>
            </div>
            <button
              onClick={() => setActiveView('notifications')}
              className="relative p-2.5 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount}</span>
              )}
            </button>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          title={!sidebarOpen ? 'تسجيل الخروج' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {sidebarOpen && <span className="text-sm font-medium">تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
  );
}
