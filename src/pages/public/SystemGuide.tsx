import { useState } from 'react';
import { LayoutDashboard, Users, FileText, Heart, Bot, GraduationCap, ClipboardList, MessageSquare, BarChart3, Briefcase, ShieldCheck, UserCheck, Bell, ChevronLeft, Megaphone } from 'lucide-react';

const panels = [
  {
    id: 'employee',
    title: 'لوحة الموظف',
    titleEn: 'Employee Panel',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-blue-700',
    description: 'هذه هي الواجهة الرئيسية للموظف، وتحتوي على:',
    features: [
      '📊 لوحة التحكم - ملخص الأنشطة والإحصائيات',
      '📝 المشاكل والطلبات - رفع وتتبع المشاكل',
      '� التبليغات - الأخبار والإعلانات الداخلية',
      '�💚 الصحة النفسية - متابعة الحالة النفسية',
      '🤖 المساعد الذكي - محادثة مع AI',
      '🎓 مركز التدريب - دورات تدريبية',
      '📋 الاستبيانات - استبيانات الموظفين',
      '💬 تواصل معنا - تواصل مع الإدارة',
      '📄 طلبات الإجازة - تقديم طلبات الإجازة'
    ]
  },
  {
    id: 'hr',
    title: 'لوحة الموارد البشرية',
    titleEn: 'HR Panel',
    icon: Users,
    color: 'from-emerald-500 to-emerald-700',
    description: 'لوحة إدارة الموارد البشرية وتحتوي على:',
    features: [
      '📊 لوحة التحكم - مؤشرات الأداء الرئيسية',
      '� التبليغات - الأخبار والإعلانات',
      '�📈 تحليل الحركة - تحليل حركة الموظفين',
      '👥 فريق العمل - إدارة فرق العمل',
      '📊 التقارير - تقارير الموارد البشرية',
      '💼 سجل المؤهلات - متابعة مؤهلات الموظفين',
      '📬 صندوق البريد - تواصل داخلي'
    ]
  },
  {
    id: 'admin',
    title: 'لوحة المشرف',
    titleEn: 'Admin Panel',
    icon: ShieldCheck,
    color: 'from-red-500 to-red-700',
    description: 'لوحة إدارة النظام بالكامل وتحتوي على:',
    features: [
      '📊 لوحة التحكم - نظرة عامة على النظام',
      '🌐 إدارة صفحة الزوار - تعديل الصفحة الرئيسية',
      '� التبليغات - الأخبار والإعلانات',
      '�👥 إدارة الموظفين - إضافة/حذف/تعديل المستخدمين',
      '🔐 شجرة الصلاحيات - إدارة صلاحيات الوصول',
      '⚙️ الإعدادات - إعدادات النظام',
      '📋 سجل العمليات - تتبع التغييرات',
      '🗄️ قاعدة البيانات - إدارة DB'
    ]
  },
  {
    id: 'notifications',
    title: 'التبليغات',
    titleEn: 'Notifications',
    icon: Megaphone,
    color: 'from-amber-500 to-orange-600',
    description: 'صفحة التبليغات والأخبار:',
    features: [
      '� نشر التبليغات النصية',
      '🖼️ رفع الصور مع التبليغ',
      '🎬 رفع الفيديو',
      '📊 استفتاءات وآراء',
      '🔔 إشعارات فورية',
      '📡 متاحة لجميع المستخدمين'
    ]
  },
  {
    id: 'gatekeeper',
    title: 'بوابة الحركة',
    titleEn: 'Gatekeeper Portal',
    icon: UserCheck,
    color: 'from-cyan-500 to-cyan-700',
    description: 'بوابة تسجيل حركة الدخول والخروج:',
    features: [
      '🚶 تسجيل دخول الموظفين',
      '🚶 تسجيل خروج الموظفين',
      '👤 تسجيل حركة الزوار',
      '📊 تقارير الحركة اليومية'
    ]
  },
  {
    id: 'developer',
    title: 'لوحة المطور',
    titleEn: 'Developer Dashboard',
    icon: Bot,
    color: 'from-purple-500 to-purple-700',
    description: 'لوحة خاصة بالمطورين وتحتوي على:',
    features: [
      '💻 لوحة التحكم - معلومات تقنية',
      '� إدارة المستخدمين والصلاحيات',
      '🗄️ قاعدة البيانات والاستعلامات',
      '� سجل العمليات والتدقيق',
      '�️ الطرفية (Terminal)',
      '⚙️ إعدادات الأمان',
      '🔐 وصول برمز PIN (9999)'
    ]
  }
];

export default function SystemGuide({ onSkip }: { onSkip: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = panels[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-4xl bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <LayoutDashboard className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">مرحباً بك في نظام وادي الرافدين</h1>
          <p className="text-gray-400">لقد جهزنا لك هذه الخريطة لتعرف كيفية عمل النظام</p>
        </div>

        <div className="flex gap-2 mb-8 justify-center">
          {panels.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-indigo-500' : 'w-4 bg-white/20'}`} />
          ))}
        </div>

        <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${current.color} mb-6`}>
            <current.icon size={18} className="text-white" />
            <span className="text-white font-bold">{current.title}</span>
            <span className="text-white/60 text-sm">({current.titleEn})</span>
          </div>
          <p className="text-gray-300 mb-6 text-lg">{current.description}</p>
          <div className="grid md:grid-cols-2 gap-3">
            {current.features.map((feature, i) => (
              <div key={i} className="bg-white/5 rounded-xl px-4 py-3 border border-white/5 flex items-center gap-3">
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mt-8">
          <button onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft size={20} /> السابق
          </button>
          <div className="text-gray-500 text-sm">{currentIndex + 1} / {panels.length}</div>
          {currentIndex < panels.length - 1 ? (
            <button onClick={() => setCurrentIndex(prev => Math.min(panels.length - 1, prev + 1))}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-colors">
              التالي <ChevronLeft size={20} />
            </button>
          ) : (
            <button onClick={onSkip}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-colors">
              ✨ بدء استخدام النظام
            </button>
          )}
        </div>
        <button onClick={onSkip} className="block mx-auto mt-4 text-gray-500 hover:text-gray-300 text-sm transition-colors">تخطي الشرح</button>
      </div>
    </div>
  );
}