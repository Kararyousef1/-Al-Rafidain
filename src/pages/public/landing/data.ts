/**
 * data.ts — كل البيانات الثابتة لصفحة الهبوط في مكان واحد.
 * محتوى البوابات/الخطط/الخدمات هو نفسه المحتوى الأصلي دون حذف أي عنصر.
 * تم إزالة البيانات الوهمية (إحصائيات، آراء عملاء، قطاعات) — أضف بياناتك الحقيقية لاحقاً.
 */
import {
  Users, BarChart3, Shield, Globe, Activity, MessageSquare, Smartphone,
  Cpu, UserCheck, TrendingUp, Building2, Star, Clock, Lock, Award, Zap,
} from 'lucide-react';
import type {
  PortalData, PlanData, ServiceData, StatData, IndustryData,
  TestimonialData, FaqItem, ScreenshotTab, LocalizedText,
} from './types';

// ─── بيانات البوابات (بدون أي تغيير عن الأصل) ───────────────────────
export const PORTALS: PortalData[] = [
  {
    id: 'employee',
    icon: UserCheck,
    color: '#6366f1',
    gradient: 'from-indigo-500 to-violet-600',
    title: { ar: 'بوابة الموظف', en: 'Employee Portal', ku: 'دەروازەی کارمەند' },
    desc: {
      ar: 'مركز الموظف الذاتي — سجّل حضورك، تابع إجازاتك، راجع راتبك، وأنجز مهامك اليومية من مكان واحد دون الحاجة لمراجعة HR.',
      en: 'Employee self-service hub — clock in/out, track leave, view payslips, and complete daily tasks without visiting HR.',
      ku: 'ناوەندی خودیاری کارمەند — ئامادەبوون تۆمار بکە، مۆڵەتەکانت بشارەوە، مووچەکەت ببینە.',
    },
    features: {
      ar: ['تسجيل الحضور والانصراف', 'طلبات الإجازة والإذن', 'كشف الراتب الشهري', 'متابعة المهام والتدريب', 'التقارير الشخصية'],
      en: ['Attendance & check-out', 'Leave & permission requests', 'Monthly payslip', 'Task & training tracking', 'Personal reports'],
      ku: ['ئامادەبوون تۆمار کردن', 'داواکاری مۆڵەت', 'پسوولەی مانگانە', 'شوێنکەوتنی ئەرک', 'ڕاپۆرتی کەسی'],
    },
  },
  {
    id: 'hr',
    icon: Users,
    color: '#0ea5e9',
    gradient: 'from-sky-500 to-cyan-600',
    title: { ar: 'بوابة الموارد البشرية', en: 'HR Portal', ku: 'دەروازەی چاوەڕوانی مرۆیی' },
    desc: {
      ar: 'لوحة تحكم شاملة لفريق HR — أدر ملفات الموظفين، راجع الطلبات، أنشئ التقارير، وتابع مؤشرات الأداء بنقرة واحدة.',
      en: 'Comprehensive control panel for HR teams — manage employee files, review requests, generate reports, and track KPIs at a glance.',
      ku: 'پانێلی کنترۆلی گشتگیر بۆ تیمی HR — فایلی کارمەند بەڕێوەبکە، داواکاری بگەڕێنەوە.',
    },
    features: {
      ar: ['إدارة ملفات الموظفين', 'الموافقة على الطلبات', 'تقارير الحضور والغياب', 'مؤشرات الأداء KPI', 'خطط التدريب والتطوير'],
      en: ['Employee file management', 'Request approvals', 'Attendance reports', 'KPI dashboards', 'Training plans'],
      ku: ['بەڕێوەبردنی فایلی کارمەند', 'پەسەندکردنی داواکاری', 'ڕاپۆرتی ئامادەبوون', 'داشبۆردی KPI', 'پلانی ئامۆژگاری'],
    },
  },
  {
    id: 'admin',
    icon: BarChart3,
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    title: { ar: 'بوابة الإدارة', en: 'Admin Portal', ku: 'دەروازەی بەڕێوەبەرایەتی' },
    desc: {
      ar: 'تقارير وتحليلات تساعدك على اتخاذ القرارات الصحيحة — صورة كاملة عن أداء المؤسسة، التكاليف، والإنتاجية في لحظات.',
      en: 'Reports and analytics that help you make the right decisions — a complete picture of organizational performance, costs, and productivity at a glance.',
      ku: 'ڕاپۆرت و شیکاری کە یارمەتیت دەدەن بڕیاری دروست بدەیت — وێنەی تەواو لە کارایی دامەزراوەکەت.',
    },
    features: {
      ar: ['لوحات تحكم تنفيذية', 'تحليل التكاليف والإنتاجية', 'تقارير PDF/Excel', 'مؤشرات الأداء الإجمالية', 'إدارة الصلاحيات'],
      en: ['Executive dashboards', 'Cost & productivity analysis', 'PDF/Excel reports', 'Overall KPIs', 'Permissions management'],
      ku: ['داشبۆردی جێبەجێکار', 'شیکاری تێچوون', 'ڕاپۆرتی PDF/Excel', 'KPIی گشتی', 'بەڕێوەبردنی مۆڵەت'],
    },
  },
  {
    id: 'movement',
    icon: Activity,
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-600',
    title: { ar: 'بوابة الحركة', en: 'Movement Portal', ku: 'دەروازەی جووڵەکان' },
    desc: {
      ar: 'تتبع حركة وسلوك الموظفين ولوجستيات الشركة — سجل الدخول والخروج، تابع الزيارات، وأدر حركة الموظفين الخارجية بدقة متناهية.',
      en: 'Track employee movement, behavior, and company logistics — log entries/exits, monitor visits, and manage external employee movement with precision.',
      ku: 'جووڵەی کارمەند و پێوەندییەکانی کۆمپانیا شوێن بکە — تۆمارکردنی هاتوچۆ، بینینی سەردانەکان.',
    },
    features: {
      ar: ['بوابة أمنية ذكية', 'تسجيل الزوار', 'تتبع حركة الموظفين الخارجية', 'سجلات الدخول والخروج', 'تقارير الحركة اليومية'],
      en: ['Smart security gate', 'Visitor registration', 'External movement tracking', 'Entry/exit logs', 'Daily movement reports'],
      ku: ['دەروازەی ئەمنی زیرەک', 'تۆمارکردنی میوان', 'شوێنکەوتنی جووڵەی دەرەکی', 'تۆمارەکانی هاتوچۆ', 'ڕاپۆرتی ڕۆژانە'],
    },
  },
  {
    id: 'tech',
    icon: Cpu,
    color: '#8b5cf6',
    gradient: 'from-violet-500 to-purple-600',
    title: { ar: 'البوابة التقنية', en: 'Tech Portal', ku: 'دەروازەی تەکنیکی' },
    desc: {
      ar: 'مركز تحكم للفريق التقني — إدارة البنية التحتية، مراقبة الأنظمة، سجلات الأخطاء، والتحديثات التقنية من واجهة موحدة.',
      en: 'Control center for the technical team — manage infrastructure, monitor systems, error logs, and technical updates from a unified interface.',
      ku: 'ناوەندی کنترۆل بۆ تیمی تەکنیکی — بنیادنەهاتووی بەڕێوەببرە، سیستەم چاودێری بکە.',
    },
    features: {
      ar: ['إدارة الصلاحيات والأدوار', 'سجلات النظام والأخطاء', 'مراقبة الأداء التقني', 'إعدادات النظام المتقدمة', 'تقارير الأمن السيبراني'],
      en: ['Roles & permissions management', 'System & error logs', 'Technical performance monitoring', 'Advanced system settings', 'Cybersecurity reports'],
      ku: ['بەڕێوەبردنی ڕۆڵ و مۆڵەت', 'تۆمارەکانی سیستەم', 'چاودێریی کارایی تەکنیکی', 'ڕێکخستنی پێشکەوتوو', 'ڕاپۆرتی ئەمنییەت'],
    },
  },
  {
    id: 'communication',
    icon: MessageSquare,
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-600',
    title: { ar: 'بوابة التواصل', en: 'Communication Portal', ku: 'دەروازەی پەیوەندی' },
    desc: {
      ar: 'أداة تعاون متكاملة تشبه Asana — أدر المشاريع، وزّع المهام، تابع التقدم، وتواصل مع فريقك في الوقت الفعلي.',
      en: 'A complete collaboration tool like Asana — manage projects, assign tasks, track progress, and communicate with your team in real time.',
      ku: 'ئامرازی هاوکاری یەکگرتوو وەک Asana — پرۆژەکان بەڕێوەببرە، ئەرکەکان دابەش بکە، پێشکەوتن شوێن بکە.',
    },
    features: {
      ar: ['إدارة المشاريع والمهام', 'قنوات التواصل الداخلي', 'جداول ولوحات Kanban', 'تتبع التقدم الفعلي', 'إشعارات فورية'],
      en: ['Project & task management', 'Internal communication channels', 'Kanban boards & schedules', 'Real-time progress tracking', 'Instant notifications'],
      ku: ['بەڕێوەبردنی پرۆژە', 'شوێنەکانی پەیوەندی ناوخۆیی', 'لووحەکانی Kanban', 'شوێنکەوتنی پێشکەوتن', 'ئاگادارکردنەوەی فوری'],
    },
  },
];

// ─── خطط الأسعار (الأسعار خاصة — تُحدد عند التواصل) ─────────────────
export const PLANS: PlanData[] = [
  {
    id: 'low',
    name: { ar: 'LOW', en: 'LOW', ku: 'LOW' },
    range: { ar: '١٠ - ٢٠ موظف', en: '10 - 20 Employees', ku: '١٠ - ٢٠ کارمەند' },
    desc: { ar: 'مثالي للشركات الناشئة والفرق الصغيرة المتنامية', en: 'Perfect for startups and growing small teams', ku: 'گونجاوترین بۆ کۆمپانیا نوێبونیاتەکان و تیمە بچووکەکان' },
    features: {
      ar: ['٣ بوابات أساسية (الموظف، HR، الإدارة)', 'تقارير أساسية', 'دعم فني عبر البريد الإلكتروني', 'دعم كامل للغات الثلاث'],
      en: ['3 core portals (Employee, HR, Admin)', 'Basic reports', 'Email support', 'Full 3-language support'],
      ku: ['٣ دەروازەی بنەڕەتی (کارمەند، HR، بەڕێوەبەرایەتی)', 'ڕاپۆرتی بنەڕەت', 'پشتگیری ئیمەیڵ', 'پشتگیری تەواوی ٣ زمان'],
    },
    highlight: false,
    badge: null,
  },
  {
    id: 'medium',
    name: { ar: 'MEDIUM', en: 'MEDIUM', ku: 'MEDIUM' },
    range: { ar: '٢٠ - ١٠٠ موظف', en: '20 - 100 Employees', ku: '٢٠ - ١٠٠ کارمەند' },
    desc: { ar: 'للشركات المتوسطة التي تحتاج إدارة متكاملة لكل الأقسام', en: 'For mid-size companies that need complete department-wide management', ku: 'بۆ کۆمپانیا ناوەندییەکان کە پێویستیان بە بەڕێوەبردنی تەواوە' },
    features: {
      ar: ['جميع البوابات الستة ✅', 'تقارير متقدمة + PDF', 'دعم فني بأولوية', 'نسخ احتياطي يومي', 'تكامل مع أنظمة خارجية'],
      en: ['All 6 portals ✅', 'Advanced reports + PDF', 'Priority support', 'Daily backup', 'External system integration'],
      ku: ['هەموو ٦ دەروازەکە ✅', 'ڕاپۆرتی پێشکەوتوو', 'پشتگیری پێشینەدار', 'پاڵپشتی ڕۆژانە', 'یەکگرتن لەگەڵ سیستەمی دەرەکی'],
    },
    highlight: true,
    badge: { ar: 'الأكثر طلباً', en: 'Most Popular', ku: 'زۆرترین داواکاری' },
  },
  {
    id: 'max',
    name: { ar: 'MAX', en: 'MAX', ku: 'MAX' },
    range: { ar: '١٠٠ - ٣٠٠ موظف', en: '100 - 300 Employees', ku: '١٠٠ - ٣٠٠ کارمەند' },
    desc: { ar: 'للمؤسسات الكبيرة ذات الفرق متعددة الأقسام والفروع', en: 'For large organizations with multiple departments and branches', ku: 'بۆ دامەزراوە گەورەکان بە چەندین بەش و لق' },
    features: {
      ar: ['جميع البوابات الستة ✅', 'تحليلات ولوحات KPI متقدمة', 'مدير حساب مخصص', 'نسخ احتياطي فوري', 'تكامل API متقدم'],
      en: ['All 6 portals ✅', 'Advanced KPI analytics', 'Dedicated account manager', 'Real-time backup', 'Advanced API integration'],
      ku: ['هەموو ٦ دەروازەکە ✅', 'شیکاری پێشکەوتووی KPI', 'بەڕێوەبەری هەژماری تایبەت', 'پاڵپشتی ڕاستەوخۆ', 'یەکگرتنی API پێشکەوتوو'],
    },
    highlight: false,
    badge: null,
  },
  {
    id: 'extra',
    name: { ar: 'EXTRA', en: 'EXTRA', ku: 'EXTRA' },
    range: { ar: 'أكثر من ٣٠٠ موظف', en: '300+ Employees', ku: 'زیاتر لە ٣٠٠ کارمەند' },
    desc: { ar: 'حل مخصص بالكامل للمجموعات والمؤسسات الضخمة', en: 'A fully custom solution for large groups and enterprises', ku: 'چارەسەرێکی تەواو تایبەت بۆ گروپ و کۆمپانیا زۆر گەورەکان' },
    features: {
      ar: ['بوابات غير محدودة', 'خادم خاص مخصص', 'فريق دعم مخصص على مدار الساعة', 'تدريب وتأهيل شامل', 'تطوير حلول مخصصة بالكامل'],
      en: ['Unlimited portals', 'Dedicated private server', 'Dedicated 24/7 support team', 'Full onboarding & training', 'Fully custom solution development'],
      ku: ['دەروازەی نامحدود', 'سێرڤەری تایبەتی خۆی', 'تیمی پشتگیری تایبەت ٢٤/٧', 'ڕاهێنان و ئامادەکردنی تەواو', 'گەشەپێدانی چارەسەری تایبەت بە تەواوی'],
    },
    highlight: false,
    badge: { ar: 'حل خاص', en: 'Custom', ku: 'تایبەت' },
  },
];

/** قيمة خلية في جدول المقارنة: علامة صح/خطأ، أو نص ثابت (رقم)، أو نص مترجم */
export type CompareValue = boolean | string | LocalizedText;

export interface CompareRow {
  label: LocalizedText;
  low: CompareValue;
  medium: CompareValue;
  max: CompareValue;
  extra: CompareValue;
}

/** صفوف جدول مقارنة الخطط — تُستخدم في قسم Pricing لعرض مقارنة تفصيلية */
export const PLAN_COMPARISON: CompareRow[] = [
  {
    label: { ar: 'عدد البوابات المفعّلة', en: 'Active portals', ku: 'ژمارەی دەروازە' },
    low: '3', medium: '6', max: '6',
    extra: { ar: 'غير محدود', en: 'Unlimited', ku: 'نامحدود' },
  },
  {
    label: { ar: 'التقارير', en: 'Reports', ku: 'ڕاپۆرت' },
    low: { ar: 'أساسية', en: 'Basic', ku: 'بنەڕەت' },
    medium: { ar: 'متقدمة + PDF', en: 'Advanced + PDF', ku: 'پێشکەوتوو' },
    max: { ar: 'تحليلات KPI', en: 'KPI analytics', ku: 'شیکاری KPI' },
    extra: { ar: 'مخصصة بالكامل', en: 'Fully custom', ku: 'تایبەت' },
  },
  {
    label: { ar: 'النسخ الاحتياطي', en: 'Backups', ku: 'پاڵپشت' },
    low: false,
    medium: { ar: 'يومي', en: 'Daily', ku: 'ڕۆژانە' },
    max: { ar: 'فوري', en: 'Real-time', ku: 'ڕاستەوخۆ' },
    extra: { ar: 'فوري', en: 'Real-time', ku: 'ڕاستەوخۆ' },
  },
  {
    label: { ar: 'الدعم الفني', en: 'Support', ku: 'پشتگیری' },
    low: { ar: 'بريد إلكتروني', en: 'Email', ku: 'ئیمەیڵ' },
    medium: { ar: 'بأولوية', en: 'Priority', ku: 'پێشینەدار' },
    max: { ar: 'مدير حساب', en: 'Account manager', ku: 'بەڕێوەبەری هەژمار' },
    extra: { ar: '٢٤/٧ مخصص', en: '24/7 dedicated', ku: '٢٤/٧ تایبەت' },
  },
  { label: { ar: 'تكامل API', en: 'API integration', ku: 'یەکگرتنی API' }, low: false, medium: true, max: true, extra: true },
  { label: { ar: 'خادم مخصص', en: 'Dedicated server', ku: 'سێرڤەری تایبەت' }, low: false, medium: false, max: false, extra: true },
];

// ─── الخدمات الإضافية ─────────────────────────────────────────────
export const EXTRA_SERVICES: ServiceData[] = [
  {
    icon: Globe,
    color: '#6366f1',
    title: { ar: 'تصميم وإنشاء مواقع إلكترونية', en: 'Web Design & Development', ku: 'دیزاین و دروستکردنی مالپەڕ' },
    desc: { ar: 'احصل على موقع احترافي يعكس هوية شركتك', en: 'Get a professional website that reflects your brand identity', ku: 'مالپەڕێکی پیشەیی بەدەست بهێنە کە ناسنامەی برانتت نیشان بدات' },
    promo: { ar: '🎁 اشترك واحصل على موقعك مجاناً', en: '🎁 Subscribe & Get a Free Website', ku: '🎁 بەشداری بکە و مالپەڕی بە خۆراو وەربگرە' },
    badge: { ar: 'مجاناً مع الاشتراك', en: 'Free with Plan', ku: 'خۆراو لەگەڵ ئەبۆنمەنت' },
  },
  {
    icon: Smartphone,
    color: '#0ea5e9',
    title: { ar: 'تطوير تطبيقات إدارة مخصصة', en: 'Custom Management App Development', ku: 'گەشەپێدانی ئەپی بەڕێوەبردنی تایبەت' },
    desc: { ar: 'نصمم وننشئ تطبيق ويب أو موبايل مخصص بالكامل لإدارة مؤسستك حسب احتياجاتك الفعلية', en: 'We design and build a fully custom web or mobile app to manage your organization, built around your real needs', ku: 'ئێمە ئەپێکی وێب یان مۆبایلی تایبەت دروست دەکەین بۆ بەڕێوەبردنی دامەزراوەکەت' },
    promo: { ar: '⚙️ من الفكرة إلى الإطلاق', en: '⚙️ From Idea to Launch', ku: '⚙️ لە بیرۆکەوە بۆ دەستپێکردن' },
    badge: { ar: 'حل مخصص', en: 'Custom Build', ku: 'دروستکراوی تایبەت' },
  },
  {
    icon: TrendingUp,
    color: '#f59e0b',
    title: { ar: 'استشارات تقنية وتحول رقمي', en: 'Technical Consulting & Digital Transformation', ku: 'ڕاوێژکاری تەکنیکی و گۆڕانکاری دیجیتاڵ' },
    desc: { ar: 'نساعدك على تحديد المسار الرقمي الأمثل لمؤسستك وربط أنظمتك بكفاءة أعلى', en: 'We help you define the right digital roadmap for your organization and connect your systems more efficiently', ku: 'یارمەتیت دەدەین ڕێگای دیجیتاڵی گونجاو بۆ دامەزراوەکەت دیاری بکەیت' },
    promo: { ar: '📈 استراتيجية مبنية على بياناتك', en: '📈 Strategy Built Around Your Data', ku: '📈 ستراتیژی بەپێی داتاکانت' },
    badge: { ar: 'فريق خبراء', en: 'Expert Team', ku: 'تیمی شارەزا' },
  },
  {
    icon: Shield,
    color: '#10b981',
    title: { ar: 'الأمن السيبراني', en: 'Cybersecurity Services', ku: 'خزمەتگوزاریی ئەمنییەتی سایبەر' },
    desc: { ar: 'حماية متكاملة لبيانات شركتك — تشفير، مراقبة، وإدارة أذونات متقدمة', en: 'Complete protection for your company data — encryption, monitoring, and advanced permission management', ku: 'پاراستنی تەواو بۆ داتاکانی کۆمپانیاکەت' },
    promo: { ar: '🛡️ حماية 24/7 لبياناتك', en: '🛡️ 24/7 Data Protection', ku: '🛡️ پاراستنی داتا ٢٤/٧' },
    badge: { ar: 'متوفر', en: 'Available', ku: 'بەردەستە' },
  },
];

// ─── إحصائيات الثقة ─────────────────────────────────────────────────
// ℹ️ مصفوفة فارغة — أضف إحصائياتك الحقيقية هنا لاحقاً
export const STATS: StatData[] = [];

// ─── القطاعات التي نمثّلها ──────────────────────────────────────────
// ℹ️ مصفوفة فارغة — أضف القطاعات التي تخدمها أو شعارات العملاء لاحقاً
export const INDUSTRIES: IndustryData[] = [];

// ─── آراء العملاء ───────────────────────────────────────────────────
// ℹ️ مصفوفة فارغة — أضف آراء عملاء حقيقيين لاحقاً
export const TESTIMONIALS: TestimonialData[] = [];

// ─── الأسئلة الشائعة ──────────────────────────────────────────────
export const FAQS: FaqItem[] = [
  {
    id: 'f1',
    q: { ar: 'هل يمكن تخصيص النظام حسب احتياجات مؤسستي؟', en: 'Can the system be customized to my organization\u2019s needs?', ku: 'ئایا سیستەمەکە دەتوانرێت بگونجێنرێت؟' },
    a: {
      ar: 'نعم. بعد الاشتراك يمكن تخصيص الحقول والتقارير وسير العمل حسب طبيعة عملك، وللمؤسسات الكبيرة نقدّم تطوير حلول مخصصة بالكامل ضمن خطة EXTRA.',
      en: 'Yes. After you subscribe, fields, reports, and workflows can be tailored to your business. For large organizations, we offer fully custom solution development under the EXTRA plan.',
      ku: 'بەڵێ، دوای بەشداریکردن دەتوانرێت خانەکان و ڕاپۆرتەکان بگونجێنرێن.',
    },
  },
  {
    id: 'f2',
    q: { ar: 'هل بياناتنا آمنة؟ وأين تُخزَّن؟', en: 'Is our data secure? Where is it stored?', ku: 'ئایا داتاکانمان پارێزراون؟' },
    a: {
      ar: 'بياناتك مشفّرة ومخزّنة على خوادم تُراقب على مدار الساعة، ومع خطتَي MAX وEXTRA نوفّر خادماً مخصصاً بالكامل لمؤسستك.',
      en: 'Your data is encrypted and stored on servers monitored around the clock. With MAX and EXTRA plans, we provide a fully dedicated server for your organization.',
      ku: 'داتاکانت کۆدکراو و لەسەر سێرڤەرێکی چاودێریکراو هەڵدەگیرێن.',
    },
  },
  {
    id: 'f3',
    q: { ar: 'كم يستغرق الإعداد والتشغيل؟', en: 'How long does setup and onboarding take?', ku: 'ئامادەکردن چەند کات دەخایەنێت؟' },
    a: {
      ar: 'عادة بين يوم وأسبوع حسب حجم بياناتك وعدد البوابات المفعّلة، مع دعم كامل من فريقنا خلال مرحلة الإعداد.',
      en: 'Usually between one day and one week, depending on your data volume and the number of active portals, with full support from our team throughout setup.',
      ku: 'بەگشتی نێوان یەک ڕۆژ و یەک هەفتە.',
    },
  },
  {
    id: 'f4',
    q: { ar: 'هل أستطيع تغيير خطتي لاحقاً؟', en: 'Can I change my plan later?', ku: 'ئایا دەتوانم پلانەکەم بگۆڕم؟' },
    a: {
      ar: 'بالتأكيد، يمكنك الترقية أو التخفيض في أي وقت دون فقدان بياناتك وبدون التزام طويل الأمد.',
      en: 'Absolutely — you can upgrade or downgrade anytime without losing your data or being locked into a long-term contract.',
      ku: 'بەڵێ، دەتوانیت لە هەر کاتێک پلانەکەت بگۆڕیت.',
    },
  },
  {
    id: 'f5',
    q: { ar: 'ما اللغات التي يدعمها النظام؟', en: 'What languages does the system support?', ku: 'سیستەمەکە چ زمانانێک پشتگیری دەکات؟' },
    a: {
      ar: 'يدعم النظام العربية والإنجليزية والكردية بالكامل، ويمكن لكل موظف اختيار لغته الخاصة داخل حسابه.',
      en: 'The system fully supports Arabic, English, and Kurdish, and each employee can choose their own language inside their account.',
      ku: 'سیستەمەکە بە تەواوی عەرەبی، ئینگلیزی و کوردی پشتگیری دەکات.',
    },
  },
  {
    id: 'f6',
    q: { ar: 'هل توجد فترة تجريبية قبل الاشتراك؟', en: 'Is there a trial before subscribing?', ku: 'ئایا ماوەیەکی تاقیکردنەوە هەیە؟' },
    a: {
      ar: 'نعم، تواصل مع فريقنا لجدولة عرض تجريبي مباشر على بياناتك قبل اتخاذ القرار النهائي.',
      en: 'Yes — contact our team to schedule a live demo using your own data before making a final decision.',
      ku: 'بەڵێ، پەیوەندی بە تیمەکەمانەوە بکە بۆ دیمۆیەکی ڕاستەوخۆ.',
    },
  },
  {
    id: 'f7',
    q: { ar: 'كيف يتم الدعم الفني؟', en: 'How does technical support work?', ku: 'پشتگیری تەکنیکی چۆنە؟' },
    a: {
      ar: 'عبر البريد الإلكتروني في الخطط الأساسية، ودعم بأولوية أو مدير حساب مخصص في الخطط الأعلى، مع تغطية ٢٤/٧ في خطة EXTRA.',
      en: 'Via email on core plans, with priority support or a dedicated account manager on higher plans, and 24/7 coverage on the EXTRA plan.',
      ku: 'لە ڕێگەی ئیمەیڵ لە پلانە بنەڕەتییەکاندا.',
    },
  },
  {
    id: 'f8',
    q: { ar: 'هل يمكن تصدير بياناتنا إذا قررنا التوقف؟', en: 'Can we export our data if we decide to stop?', ku: 'ئایا دەتوانین داتاکانمان دەربهێنین؟' },
    a: {
      ar: 'نعم، بياناتك ملكك دائماً، ويمكنك تصديرها بالكامل بصيغة Excel أو PDF في أي وقت تشاء.',
      en: 'Yes — your data always belongs to you, and you can export it in full as Excel or PDF whenever you want.',
      ku: 'بەڵێ، داتاکانت هەمیشە هی خۆتن.',
    },
  },
];

// ─── ألسنة قسم لقطات الشاشة ──────────────────────────────────────
export const SCREENSHOT_TABS: ScreenshotTab[] = [
  { id: 'dashboard', icon: BarChart3, label: { ar: 'لوحة التحكم', en: 'Dashboard', ku: 'داشبۆرد' }, color: '#6366f1' },
  { id: 'hr', icon: Users, label: { ar: 'الموارد البشرية', en: 'HR', ku: 'HR' }, color: '#0ea5e9' },
  { id: 'employee', icon: UserCheck, label: { ar: 'الموظف', en: 'Employee', ku: 'کارمەند' }, color: '#f59e0b' },
  { id: 'analytics', icon: TrendingUp, label: { ar: 'التحليلات', en: 'Analytics', ku: 'شیکاری' }, color: '#10b981' },
  { id: 'mobile', icon: Smartphone, label: { ar: 'الجوال', en: 'Mobile', ku: 'مۆبایل' }, color: '#ec4899' },
];

/** عناصر "لماذا KYVZON" — عنوان + وصف قصير لكل ميزة */
export const WHY_REASONS = [
  { icon: Shield, title: { ar: 'بيانات آمنة ١٠٠٪', en: '100% Secure Data', ku: 'داتای ئەمن ١٠٠٪' }, desc: { ar: 'تشفير كامل ونسخ احتياطي منتظم لكل بياناتك', en: 'Full encryption and regular backups for all your data', ku: 'کۆدکردنی تەواو و پاڵپشتی بەردەوام' } },
  { icon: Zap, title: { ar: 'أداء عالٍ وسريع', en: 'High Performance', ku: 'کارایی بەرز' }, desc: { ar: 'واجهات سريعة الاستجابة حتى مع آلاف السجلات', en: 'Fast, responsive interfaces even with thousands of records', ku: 'ڕووکاری خێرا تەنانەت لەگەڵ هەزاران تۆمار' } },
  { icon: Globe, title: { ar: '٣ لغات مدعومة', en: '3 Languages', ku: '٣ زمان پشتگیریکراو' }, desc: { ar: 'العربية والإنجليزية والكردية بواجهة واحدة', en: 'Arabic, English, and Kurdish in one unified interface', ku: 'عەرەبی، ئینگلیزی و کوردی لە یەک ڕووکار' } },
  { icon: Clock, title: { ar: 'دعم ٢٤/٧', en: '24/7 Support', ku: 'پشتگیری ٢٤/٧' }, desc: { ar: 'فريق دعم محلي يفهم سياق سوقك', en: 'A local support team that understands your market', ku: 'تیمی پشتگیری ناوخۆیی' } },
  { icon: Lock, title: { ar: 'خوادم مخصصة', en: 'Dedicated Servers', ku: 'سێرڤەری تایبەت' }, desc: { ar: 'متاحة للمؤسسات الكبيرة عند الحاجة', en: 'Available for large organizations when needed', ku: 'بەردەست بۆ دامەزراوە گەورەکان' } },
  { icon: Award, title: { ar: 'تحديثات مستمرة', en: 'Continuous Updates', ku: 'نوێکردنەوەی بەردەوام' }, desc: { ar: 'ميزات جديدة بانتظام دون تكلفة إضافية', en: 'New features regularly, at no extra cost', ku: 'تایبەتمەندی نوێ بەبێ تێچووی زیاد' } },
];