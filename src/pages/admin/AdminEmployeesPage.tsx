import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

import { Search, Plus, Mail, Phone, MapPin, Briefcase, Star, Trash2, Edit2, Loader, ServerCrash, X, Camera, User as UserIcon, Eye, Key, ShieldCheck, CheckCircle2, LayoutDashboard, Heart, Bot, GraduationCap, ClipboardList, MessageSquare, FileText, Database, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { UserRole, Rank, ManufacturingDept, Employee, GatekeeperType } from '../../types';
import { exportToStyledExcel } from '../../utils/exportToExcel';
import { useAuthStore } from '../../store';

export default function AdminEmployeesPage() {
  const { user: currentUser } = useAuthStore();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const allPermissions = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, category: 'عام' },
    { id: 'problems', label: 'المشاكل والطلبات', icon: FileText, category: 'عام' },
    { id: 'profile', label: 'الملف الشخصي', icon: UserIcon, category: 'عام' },
    { id: 'wellness', label: 'الصحة النفسية', icon: Heart, category: 'الموظف' },
    { id: 'ai-chat', label: 'المساعد الذكي', icon: Bot, category: 'الموظف' },
    { id: 'training', label: 'مركز التدريب', icon: GraduationCap, category: 'الموظف' },
    { id: 'sops', label: 'إجراءات SOP', icon: FileText, category: 'الموظف' },
    { id: 'survey', label: 'الاستبيانات', icon: ClipboardList, category: 'الموظف' },
    { id: 'contact', label: 'تواصل معنا', icon: MessageSquare, category: 'الموظف' },
    { id: 'attendance', label: 'سجلات الحضور', icon: Briefcase, category: 'الموظف' },
    { id: 'leave-requests', label: 'طلبات الإجازة', icon: FileText, category: 'الموظف' },
    { id: 'movement-analysis', label: 'تحليل الحركة', icon: Star, category: 'الموارد البشرية' },
    { id: 'analytics', label: 'التحليلات', icon: Star, category: 'الموارد البشرية' },
    { id: 'team', label: 'فريق العمل', icon: UserIcon, category: 'الموارد البشرية' },
    { id: 'talent-market', label: 'سجل المؤهلات', icon: Star, category: 'الموارد البشرية' },
    { id: 'communication', label: 'صندوق البريد', icon: MessageSquare, category: 'الموارد البشرية' },
    { id: 'reports', label: 'التقارير', icon: FileText, category: 'الموارد البشرية' },
    { id: 'supervisor-breaks', label: 'توقيع خروج الموظفين', icon: Briefcase, category: 'الإشراف' },
    { id: 'gatekeeper-portal', label: 'بوابة الحركة', icon: UserIcon, category: 'الحراسة' },
    { id: 'cms', label: 'إدارة صفحة الزوار', icon: Star, category: 'الإدارة' },
    { id: 'employees', label: 'إدارة الموظفين', icon: UserIcon, category: 'الإدارة' },
    { id: 'permissions', label: 'شجرة الصلاحيات', icon: ShieldCheck, category: 'الإدارة' },
    { id: 'gatekeeper-permissions', label: 'صلاحيات المدراء', icon: ShieldCheck, category: 'الإدارة' },
    { id: 'notifications', label: 'التبليغات', icon: MessageSquare, category: 'الإدارة' },
    { id: 'gallery-video', label: 'رفع فيديو المعرض', icon: Star, category: 'الإدارة' },
    { id: 'audit-log', label: 'سجل العمليات', icon: ShieldCheck, category: 'الإدارة' },
    { id: 'ai-config', label: 'إعداد الذكاء الاصطناعي', icon: Bot, category: 'الإدارة' },
    { id: 'settings', label: 'الإعدادات', icon: Star, category: 'الإدارة' },
  ];

  const defaultPermissions: Record<string, string[]> = {
    employee: ['dashboard', 'problems', 'wellness', 'survey', 'training', 'ai-chat', 'contact', 'profile', 'sops', 'attendance', 'leave-requests'],
    supervisor: ['dashboard', 'problems', 'team', 'reports', 'supervisor-breaks', 'profile', 'attendance', 'leave-requests'],
    manager: ['dashboard', 'problems', 'team', 'reports', 'analytics', 'supervisor-breaks', 'profile', 'attendance', 'leave-requests'],
    hr: ['dashboard', 'movement-analysis', 'problems', 'analytics', 'team', 'talent-market', 'communication', 'reports', 'profile', 'attendance'],
    gatekeeper: ['gatekeeper-portal'],
    admin: ['dashboard', 'cms', 'employees', 'permissions', 'gatekeeper-permissions', 'reports', 'settings', 'audit-log', 'ai-config', 'profile', 'sops', 'notifications', 'gallery-video', 'attendance', 'leave-requests'],
  };

  const handleRoleChange = (newRole: string) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: defaultPermissions[newRole] || ['dashboard', 'profile']
    }));
  };

  const [uploadingProfile, setUploadingProfile] = useState(false);
  const profileFileRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: '', email: '', passcode: '', role: 'employee',
    rank: 'employee', manufacturing_dept: 'syrups',
    department: '', position: '', phone: '', location: '',
    profile_image: '', manager_id: '', supervisor_id: '', department_manager_id: '', shift: 'all',
    permissions: defaultPermissions['employee'] as string[],
    is_verified: true,
    gatekeeper_type: 'both' as GatekeeperType
  });

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      setError('تعذّر تحميل المستخدمين من قاعدة البيانات: ' + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployee = async (emp: any) => {
    if (!confirm(`هل أنت متأكد من حذف "${emp.full_name}" نهائياً؟`)) return;
    try {
      // حذف من Auth (إذا كان موجوداً)
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(emp.id);
      
      // حذف من profiles دائماً
      const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', emp.id);
      
      if (authError && !authError.message?.includes('User not found')) {
        console.warn('Auth delete warning:', authError.message);
      }
      if (profileError) {
        console.warn('Profile delete warning:', profileError.message);
      }
      
      setEmployees(prev => prev.filter(e => e.id !== emp.id));
      alert(`✅ تم حذف "${emp.full_name}" من النظام`);
    } catch (err: any) {
      // محاولة أخيرة: حذف من profiles فقط
      try {
        await supabaseAdmin.from('profiles').delete().eq('id', emp.id);
        setEmployees(prev => prev.filter(e => e.id !== emp.id));
        alert(`✅ تم حذف "${emp.full_name}" من البروفايل فقط`);
      } catch (e2: any) {
        alert(`فشل الحذف: ${e2?.message || 'خطأ غير معروف'}`);
      }
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const departments = ['all', ...new Set(employees.map(e => e.manufacturing_dept).filter(Boolean) as string[])];

  const filtered = employees.filter(e => {
    const current = currentUser as any;
    if (current?.role !== 'admin' && current?.rank !== 'executive') {
      if (current?.rank === 'manager') {
        if (e.manufacturing_dept !== current.manufacturing_dept) return false;
      } else if (current?.rank === 'supervisor') {
        if (e.manufacturing_dept !== current.manufacturing_dept) return false;
        if (e.rank === 'executive' || e.rank === 'manager') return false;
        if (e.rank === 'supervisor' && e.id !== current.id) return false;
      } else {
        if (e.id !== current?.id) return false;
      }
    }
    if (filterDept !== 'all' && e.manufacturing_dept !== filterDept) return false;
    const term = search.toLowerCase();
    return (
      (e.full_name || '').toLowerCase().includes(term) || 
      (e.email || '').toLowerCase().includes(term) || 
      (e.position || '').toLowerCase().includes(term)
    );
  });

  const handleExport = () => {
    const headers = ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'الدور', 'المرتبة', 'القسم التصنيعي', 'المسمى الوظيفي', 'الموقع'];
    const data = filtered.map(e => [
      e.full_name || '', e.email || '', e.phone || '', e.role || '', e.rank || '', e.manufacturing_dept || '', e.position || '', e.location || ''
    ]);
    exportToStyledExcel('قائمة_المستخدمين', headers, data);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* إحصائيات */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-4 text-white">
          <p className="text-2xl font-black">{employees.length}</p>
          <p className="text-indigo-100 text-xs font-bold mt-1">إجمالي الموظفين</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-4 text-white">
          <p className="text-2xl font-black">{employees.filter(e => e.status === 'active').length}</p>
          <p className="text-emerald-100 text-xs font-bold mt-1">نشط</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-4 text-white">
          <p className="text-2xl font-black">{employees.filter(e => e.status === 'on_leave' || !e.status).length}</p>
          <p className="text-amber-100 text-xs font-bold mt-1">في إجازة/غير محدد</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl p-4 text-white">
          <p className="text-2xl font-black">{filtered.length}</p>
          <p className="text-violet-100 text-xs font-bold mt-1">المعروض حالياً</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserIcon className="text-indigo-600" /> إدارة المستخدمين والهيكلية
          </h2>
          <p className="text-slate-500 mt-1">إنشاء حسابات وتحديد الصلاحيات والمناصب بشكل هرمي.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={fetchEmployees} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold">
            <RefreshCw size={18} /> تحديث
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold">
            <FileText size={18} /> تصدير
          </button>
          <button onClick={() => {
            setFormData({
              full_name: '', email: '', passcode: '', role: 'employee',
              rank: 'employee', manufacturing_dept: 'syrups',
              department: '', position: '', phone: '', location: '',
              profile_image: '', manager_id: '', supervisor_id: '', department_manager_id: '', shift: 'all',
              permissions: defaultPermissions['employee'],
              is_verified: true,
              gatekeeper_type: 'both'
            });
            setIsEditMode(false);
            setIsModalOpen(true);
          }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-sm">
            <Plus size={18} /> إضافة مستخدم جديد
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، البريد، المسمى الوظيفي..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm"
          />
        </div>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 cursor-pointer shadow-sm"
        >
          {departments.map(d => (
            <option key={d} value={d}>{d === 'all' ? 'جميع الأقسام (الهيكل الكامل)' : d}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-500 gap-3">
          <Loader className="animate-spin" size={24} />
          <span className="font-semibold">جاري تحميل السجلات...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 flex items-center gap-3">
          <ServerCrash size={24} />
          <span className="font-semibold">{error}</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database size={36} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">لا يوجد مستخدمين في قاعدة البيانات</h3>
          <p className="text-slate-500 mb-6">استخدم زر "إضافة مستخدم جديد" لإنشاء الحسابات</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(emp => (
            <Card key={emp.id} hover className="overflow-hidden group">
              <div className="flex items-start gap-4">
                <div className="relative">
                  {emp.profile_image ? (
                    <img src={emp.profile_image} alt="" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                      {emp.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate text-lg">{emp.full_name || 'بدون اسم'}</h3>
                  <p className="text-sm text-indigo-600 font-semibold truncate">{emp.position || 'موظف'}</p>
                  <p className="text-xs text-slate-500 truncate mt-1">{emp.email || ''}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant={emp.role === 'admin' ? 'danger' : emp.role === 'hr' ? 'success' : emp.role === 'gatekeeper' ? 'warning' : 'primary'} size="sm">
                  {emp.role === 'admin' ? 'مدير' : emp.role === 'hr' ? 'موارد بشرية' : emp.role === 'gatekeeper' ? 'حارس' : 'موظف'}
                </Badge>
                <button onClick={() => { setSelectedEmp(emp); setIsViewModalOpen(true); }} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg text-sm font-semibold">
                  <Eye size={16} /> تفاصيل
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}