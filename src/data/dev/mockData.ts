// ============================================================
//  Mock Data — بيانات افتراضية للتطوير
//  يُستخدم فقط كقيم ابتدائية قبل تحميل بيانات Supabase
// ============================================================

export const mockUser = {
  id:           'mock-user-id',
  email:        'employee@kayan.sa',
  full_name:    'أحمد المحمد',
  name:         'أحمد المحمد',
  role:         'employee' as const,
  department:   'الإنتاج',
  position:     'مشغّل آلات',
  employeeId:   'EMP-001',
  status:       'active' as const,
  wellnessScore: 78,
  avatar:       null,
  phone:        null,
  created_at:   new Date().toISOString(),
  // صلاحيات الموظف - جميع الأقسام مفعلة
  permissions:  [
    'dashboard',
    'problems',
    'wellness',
    'survey',
    'training',
    'ai-chat',
    'contact',
    'profile',
  ],
};

export const mockProblems: any[] = [];

export const mockNotifications: any[] = [
  {
    id:        'n1',
    title:     'مرحباً بك في الرافدين',
    message:   'يمكنك الآن رفع مشاكلك وتتبعها بسهولة',
    type:      'info',
    read:      false,
    createdAt: new Date().toISOString(),
  },
];

export const mockWellnessData: any[] = [];

export const mockEmployees: any[] = [];

export const mockAnalytics = {
  totalEmployees: 0,
  activeProblems: 0,
  resolvedThisMonth: 0,
  avgResolutionTime: 0,
  wellnessScore: 0,
  satisfactionRate: 0,
  departmentStats: [],
  monthlyTrend: [],
  categoryBreakdown: [],
  severityBreakdown: [],
};

export const mockAuditLogs: any[] = [];