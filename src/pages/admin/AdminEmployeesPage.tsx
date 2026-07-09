/**
 * ════════════════════════════════════════════════════════════════
 *  AdminEmployeesPage - إدارة الموظفين (نسخة مُصلحة)
 *  تستخدم AdminUserService عبر Edge Functions
 *  التدفق: Page → AdminUserService → Edge Function → Supabase Admin API
 * ════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Mail, Phone, MapPin, Briefcase, Star, Trash2, Edit2,
  Loader, ServerCrash, X, Camera, User as UserIcon, Eye, Key, ShieldCheck,
  CheckCircle2, LayoutDashboard, Heart, Bot, GraduationCap, ClipboardList,
  MessageSquare, FileText, Database, RefreshCw, Send, Clock, Calendar,
  BookOpen, BarChart3, Cpu, Brain,
} from 'lucide-react';
import Card from '../../shared/components/ui/Card';
import Badge from '../../shared/components/ui/Badge';
import { GatekeeperType, UserRole } from '../../shared/types';
import { exportToStyledExcel } from '../../utils/exportToExcel';
import { useAuthStore, useUIStore } from '../../core/stores';
import { userService } from '../../services/sdk/UserService';
import { adminUserService } from '../../services/sdk/AdminUserService';

// ════════════════════════════════════════════════════════════════
//  Types
// ════════════════════════════════════════════════════════════════

interface EmployeeRecord {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  rank: string;
  manufacturing_dept: string;
  department?: string;
  position: string;
  phone: string;
  location?: string;
  profile_image?: string;
  manager_id?: string;
  supervisor_id?: string;
  department_manager_id?: string;
  shift?: string;
  permissions?: string[];
  status?: string;
  gatekeeper_type?: GatekeeperType;
  gatekeeper_pin?: string;
  last_sign_in_at?: string;
}

interface FormDataState {
  full_name: string;
  email: string;
  passcode: string;
  role: UserRole;
  rank: string;
  manufacturing_dept: string;
  department: string;
  position: string;
  phone: string;
  location: string;
  profile_image: string;
  manager_id: string;
  supervisor_id: string;
  department_manager_id: string;
  shift: string;
  permissions: string[];
  is_verified: boolean;
  gatekeeper_type: GatekeeperType;
  gatekeeper_pin: string;
}

// ════════════════════════════════════════════════════════════════
//  Constants
// ════════════════════════════════════════════════════════════════

const allPermissions = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, category: 'عام' },
  { id: 'problems', label: 'المشاكل والطلبات', icon: FileText, category: 'عام' },
  { id: 'profile', label: 'الملف الشخصي', icon: UserIcon, category: 'عام' },
  { id: 'notifications', label: 'التبليغات', icon: MessageSquare, category: 'عام' },
  { id: 'wellness', label: 'الصحة النفسية', icon: Heart, category: 'الموظف' },
  { id: 'ai-chat', label: 'المساعد الذكي', icon: Bot, category: 'الموظف' },
  { id: 'training', label: 'مركز التدريب', icon: GraduationCap, category: 'الموظف' },
  { id: 'sops', label: 'إجراءات SOP', icon: FileText, category: 'الموظف' },
  { id: 'survey', label: 'الاستبيانات', icon: ClipboardList, category: 'الموظف' },
  { id: 'contact', label: 'تواصل معنا', icon: MessageSquare, category: 'الموظف' },
  { id: 'my-attendance', label: 'حضوري', icon: Clock, category: 'الموظف' },
  { id: 'my-leave-requests', label: 'طلباتي', icon: FileText, category: 'الموظف' },
  { id: 'employee-permissions', label: 'الزمنيات', icon: Clock, category: 'الموظف' },
  { id: 'employee-leaves', label: 'الإجازات', icon: Calendar, category: 'الموظف' },
  { id: 'movement-analysis', label: 'تحليل الحركة', icon: Star, category: 'الموارد البشرية' },
  { id: 'analytics', label: 'التحليلات', icon: Star, category: 'الموارد البشرية' },
  { id: 'team', label: 'فريق العمل', icon: UserIcon, category: 'الموارد البشرية' },
  { id: 'talent-market', label: 'سجل المؤهلات', icon: Star, category: 'الموارد البشرية' },
  { id: 'communication', label: 'صندوق البريد', icon: MessageSquare, category: 'الموارد البشرية' },
  { id: 'reports', label: 'التقارير', icon: FileText, category: 'الموارد البشرية' },
  { id: 'attendance', label: 'سجلات الحضور', icon: Briefcase, category: 'الموارد البشرية' },
  { id: 'leave-requests', label: 'طلبات الإجازة', icon: FileText, category: 'الموارد البشرية' },
  { id: 'manage-training', label: 'إدارة التدريب', icon: BookOpen, category: 'الموارد البشرية' },
  { id: 'training-reports', label: 'تقارير التدريب', icon: BarChart3, category: 'الموارد البشرية' },
  { id: 'supervisor-breaks', label: 'توقيع خروج الموظفين', icon: Briefcase, category: 'الإشراف' },
  { id: 'gatekeeper-portal', label: 'بوابة الحركة', icon: UserIcon, category: 'الحراسة' },
  { id: 'cms', label: 'إدارة صفحة الزوار', icon: Star, category: 'الإدارة' },
  { id: 'employees', label: 'إدارة الموظفين', icon: UserIcon, category: 'الإدارة' },
  { id: 'permissions', label: 'شجرة الصلاحيات', icon: ShieldCheck, category: 'الإدارة' },
  { id: 'gatekeeper-permissions', label: 'صلاحيات المدراء', icon: ShieldCheck, category: 'الإدارة' },
  { id: 'ai-config', label: 'إعداد الذكاء الاصطناعي', icon: Cpu, category: 'الإدارة' },
  { id: 'admin-sops', label: 'إدارة SOPs', icon: FileText, category: 'الإدارة' },
  { id: 'sops-reports', label: 'تقارير SOPs', icon: BarChart3, category: 'الإدارة' },
  { id: 'admin-attendance', label: 'حضور الكل', icon: Clock, category: 'الإدارة' },
  { id: 'ai-insights-dashboard', label: 'تحليل ذكي', icon: Brain, category: 'الإدارة' },
  { id: 'publish-announcements', label: 'نشر التبليغات', icon: Send, category: 'الإدارة' },
  { id: 'gallery-video', label: 'رفع فيديو المعرض', icon: Star, category: 'الإدارة' },
  { id: 'audit-log', label: 'سجل العمليات', icon: ShieldCheck, category: 'الإدارة' },
  { id: 'settings', label: 'الإعدادات', icon: Star, category: 'الإدارة' },
  { id: 'developer-db', label: 'إدارة DB', icon: Database, category: 'الإدارة' },
];

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  employee: ['dashboard', 'problems', 'wellness', 'survey', 'training', 'sops', 'ai-chat', 'contact', 'profile', 'notifications', 'my-attendance', 'my-leave-requests', 'employee-permissions', 'employee-leaves'],
  supervisor: ['dashboard', 'problems', 'team', 'reports', 'supervisor-breaks', 'profile', 'my-attendance', 'my-leave-requests', 'notifications', 'attendance', 'leave-requests', 'employee-permissions', 'employee-leaves'],
  manager: ['dashboard', 'problems', 'team', 'reports', 'analytics', 'supervisor-breaks', 'profile', 'my-attendance', 'my-leave-requests', 'notifications', 'attendance', 'leave-requests', 'employee-permissions', 'employee-leaves'],
  hr: ['dashboard', 'movement-analysis', 'problems', 'analytics', 'team', 'talent-market', 'communication', 'reports', 'notifications', 'attendance', 'leave-requests', 'my-attendance', 'my-leave-requests', 'manage-training', 'training-reports', 'employee-permissions', 'employee-leaves'],
  gatekeeper: ['gatekeeper-portal', 'notifications'],
  admin: ['dashboard', 'cms', 'employees', 'permissions', 'gatekeeper-permissions', 'reports', 'settings', 'audit-log', 'sops', 'admin-sops', 'sops-reports', 'ai-config', 'notifications', 'attendance', 'leave-requests', 'my-attendance', 'my-leave-requests', 'manage-training', 'training-reports', 'admin-attendance', 'ai-insights-dashboard', 'employee-permissions', 'employee-leaves', 'publish-announcements', 'gallery-video', 'developer-db'],
  developer: ['dashboard', 'cms', 'employees', 'permissions', 'gatekeeper-permissions', 'reports', 'settings', 'audit-log', 'sops', 'admin-sops', 'sops-reports', 'ai-config', 'notifications', 'gallery-video', 'attendance', 'leave-requests', 'developer-db', 'developer-dashboard', 'developer-attendance', 'developer-logs', 'publish-announcements'],
};

const EMPTY_FORM: FormDataState = {
  full_name: '', email: '', passcode: '', role: 'employee',
  rank: 'employee', manufacturing_dept: 'syrups',
  department: '', position: '', phone: '', location: '',
  profile_image: '', manager_id: '', supervisor_id: '', department_manager_id: '', shift: 'all',
  permissions: DEFAULT_PERMISSIONS['employee'],
  is_verified: true,
  gatekeeper_type: 'both',
  gatekeeper_pin: '',
};

const RANK_MAP: Record<string, string> = {
  employee: 'employee', supervisor: 'supervisor', manager: 'manager',
  hr: 'employee', gatekeeper: 'employee', developer: 'employee', admin: 'executive',
};

const RANK_LABELS: Record<string, string> = {
  executive: 'مدير تنفيذي', manager: 'مدير', supervisor: 'مشرف', employee: 'موظف',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير', hr: 'موارد بشرية', gatekeeper: 'حارس', employee: 'موظف',
  supervisor: 'مشرف', manager: 'مدير', developer: 'مطور',
};

const SHIFT_LABELS: Record<string, string> = {
  morning: 'صباحية', evening: 'مسائية', night: 'ليلية', all: 'مرن',
};

const roleBadgeVariant = (role: string): 'danger' | 'success' | 'warning' | 'primary' =>
  role === 'admin' ? 'danger' : role === 'hr' ? 'success' : role === 'gatekeeper' ? 'warning' : 'primary';

const PERM_CATEGORIES = ['عام', 'الموظف', 'الموارد البشرية', 'الإشراف', 'الحراسة', 'الإدارة'];

// ════════════════════════════════════════════════════════════════
//  Main Component
// ════════════════════════════════════════════════════════════════

export default function AdminEmployeesPage() {
  const { user: currentUser } = useAuthStore();
  const { addToast } = useUIStore();

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeRecord | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormDataState>(EMPTY_FORM);
  const profileFileRef = useRef<HTMLInputElement>(null);

  // ─── Fetch Employees ──────────────────────────────────────────
  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.findAllUsers();
      setEmployees((data || []) as unknown as EmployeeRecord[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'تعذّر تحميل الموظفين';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete User ─────────────────────────────────────────────
  const handleDeleteUser = async (emp: EmployeeRecord) => {
    if (!currentUser?.id) return;
    if (!confirm(`حذف "${emp.full_name}" من النظام بالكامل؟`)) return;
    try {
      const result = await adminUserService.deleteUser({
        target_user_id: emp.id,
        deleted_by: currentUser.id,
      });
      if (result.error) {
        addToast('فشل الحذف: ' + result.error, 'error');
        return;
      }
      setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      addToast(`تم حذف "${emp.full_name}" بنجاح`, 'success');
    } catch (err) {
      addToast('فشل الحذف: ' + (err instanceof Error ? err.message : 'خطأ غير متوقع'), 'error');
    }
  };

  // ─── Save (Create/Update) ─────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode && formData.passcode.length < 6) {
      addToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل.', 'error');
      return;
    }
    if (!currentUser?.id) return;

    setSaving(true);
    const namePrefix = formData.email.includes('@') ? formData.email.split('@')[0] : formData.email;
    const finalEmail = `${namePrefix}@alrafidain.com`;

    try {
      if (isEditMode && selectedEmp) {
        await userService.updateUser(selectedEmp.id, {
          full_name: formData.full_name,
          email: finalEmail,
          role: formData.role,
          rank: formData.rank,
          department: formData.department || formData.manufacturing_dept,
          position: formData.position,
          phone: formData.phone,
          location: formData.location,
          profile_image: formData.profile_image,
          manager_id: formData.manager_id || undefined,
          supervisor_id: formData.supervisor_id || undefined,
          status: 'active',
          permissions: formData.permissions,
          gatekeeper_pin: formData.gatekeeper_pin || '',
        });

        setIsModalOpen(false);
        await fetchEmployees();
        addToast(`تم تحديث "${formData.full_name}" بنجاح`, 'success');
      } else {
        const result = await adminUserService.createUser({
          email: finalEmail,
          password: formData.passcode,
          full_name: formData.full_name,
          role: formData.role,
          department_id: formData.department || formData.manufacturing_dept,
        });

        if (result.error) {
          addToast('فشل إنشاء المستخدم: ' + result.error, 'error');
        } else {
          setIsModalOpen(false);
          await fetchEmployees();
          addToast(`تم إنشاء "${formData.full_name}" — الدخول بـ: ${finalEmail}`, 'success');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل الحفظ';
      addToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ─── Derived Values ───────────────────────────────────────────
  const departments = ['all', ...new Set(employees.map((e) => e.manufacturing_dept).filter(Boolean) as string[])];

  const filtered = employees.filter((e) => {
    if (filterDept !== 'all' && e.manufacturing_dept !== filterDept) return false;
    const term = search.toLowerCase();
    return (e.full_name || '').toLowerCase().includes(term) || (e.email || '').toLowerCase().includes(term);
  });

  const handleExport = () => {
    const headers = ['الاسم', 'البريد', 'رقم الهاتف', 'الدور', 'المرتبة', 'القسم', 'المسمى'];
    const data = filtered.map((e) => [e.full_name || '', e.email || '', e.phone || '', e.role || '', e.rank || '', e.manufacturing_dept || '', e.position || '']);
    exportToStyledExcel('قائمة_المستخدمين', headers, data);
  };

  const handleFileUpload = async (file: File) => {
    setUploadingProfile(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `profiles/${Date.now()}.${ext}`;
      const { supabase } = await import('../../services/supabase/supabase');
      const { error: uploadError } = await supabase.storage.from('public-assets').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(path);
      setFormData((prev) => ({ ...prev, profile_image: urlData.publicUrl }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل رفع الصورة';
      addToast(message, 'error');
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleRoleChange = (newRole: string) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole as UserRole,
      rank: RANK_MAP[newRole] || 'employee',
      permissions: DEFAULT_PERMISSIONS[newRole] || ['dashboard', 'profile'],
    }));
  };

  const togglePermission = (permId: string) => {
    setFormData((prev) => {
      const current = prev.permissions || [];
      return {
        ...prev,
        permissions: current.includes(permId) ? current.filter((id) => id !== permId) : [...current, permId],
      };
    });
  };

  const openCreateModal = () => {
    setFormData(EMPTY_FORM);
    setIsEditMode(false);
    setSelectedEmp(null);
    setIsModalOpen(true);
  };

  const openEditModal = (emp: EmployeeRecord) => {
    setFormData({
      full_name: emp.full_name || '',
      email: emp.email?.split('@')[0] || '',
      passcode: '',
      role: (emp.role as UserRole) || 'employee',
      rank: emp.rank || RANK_MAP[emp.role || 'employee'] || 'employee',
      manufacturing_dept: emp.manufacturing_dept || 'syrups',
      department: emp.department || '',
      position: emp.position || '',
      phone: emp.phone || '',
      location: emp.location || '',
      profile_image: emp.profile_image || '',
      manager_id: emp.manager_id || '',
      supervisor_id: emp.supervisor_id || '',
      department_manager_id: emp.department_manager_id || '',
      shift: emp.shift || 'all',
      permissions: emp.permissions || DEFAULT_PERMISSIONS[emp.role || 'employee'] || ['dashboard', 'profile'],
      is_verified: true,
      gatekeeper_type: emp.gatekeeper_type || 'both',
      gatekeeper_pin: emp.gatekeeper_pin || '',
    });
    setSelectedEmp(emp);
    setIsEditMode(true);
    setIsViewModalOpen(false);
    setIsModalOpen(true);
  };

  // ════════════════════════════════════════════════════════════════
  //  Render
  // ════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 pb-20 animate-fade-in" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-3 sm:p-4 text-white">
          <p className="text-xl sm:text-2xl font-black">{employees.length}</p>
          <p className="text-indigo-100 text-xs font-bold mt-1">إجمالي الموظفين</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-3 sm:p-4 text-white">
          <p className="text-xl sm:text-2xl font-black">{employees.filter((e) => e.status === 'active').length}</p>
          <p className="text-emerald-100 text-xs font-bold mt-1">نشط</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-3 sm:p-4 text-white">
          <p className="text-xl sm:text-2xl font-black">{filtered.length}</p>
          <p className="text-amber-100 text-xs font-bold mt-1">المعروض</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl p-3 sm:p-4 text-white">
          <p className="text-xl sm:text-2xl font-black">{employees.length}</p>
          <p className="text-violet-100 text-xs font-bold mt-1">إجمالي</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
        <button onClick={fetchEmployees} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold text-sm">
          <RefreshCw size={18} /> تحديث
        </button>
        <button onClick={handleExport} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold text-sm">
          <FileText size={18} /> تصدير Excel
        </button>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm shadow-sm">
          <Plus size={18} /> إضافة مستخدم
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
        </div>
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="all">الكل</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin" size={24} /></div>
      ) : error ? (
        <div className="bg-red-50 p-6 rounded-xl flex items-center gap-2 text-red-600"><ServerCrash size={24} /> {error}</div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20">
          <Database size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold">لا يوجد مستخدمين</h3>
          <p className="text-slate-500 mt-2">اضغط "إضافة مستخدم"</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map((emp) => (
            <Card key={emp.id} hover>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-xl flex-shrink-0">
                  {emp.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{emp.full_name || 'بدون اسم'}</h3>
                  <p className="text-sm text-indigo-600 font-semibold truncate">{emp.position || 'موظف'}</p>
                  <p className="text-xs text-slate-500 truncate">{emp.email || ''}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={roleBadgeVariant(emp.role)} size="sm">
                  {ROLE_LABELS[emp.role] || emp.role}
                </Badge>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedEmp(emp); setIsViewModalOpen(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye size={16} /></button>
                  <button onClick={() => handleDeleteUser(emp)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal - (يبقى كما هو دون تغيير) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 sm:my-8">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-slate-50 sticky top-0 z-10">
              <h3 className="font-bold text-lg sm:text-xl flex items-center gap-2">
                {isEditMode ? (<><Edit2 className="text-indigo-600" size={20} /> تعديل بيانات</>) : (<><Plus className="text-indigo-600" size={20} /> إضافة مستخدم جديد</>)}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg bg-white"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2">المعلومات الأساسية</h4>
                  <div>
                    <label className="block text-sm font-semibold mb-1">الاسم الكامل</label>
                    <input required type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-indigo-600 mb-1">اسم المستخدم</label>
                    <div className="flex items-center gap-2">
                      <input required type="text" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="flex-1 border rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-left" dir="ltr" placeholder="ahmed" />
                      <span className="text-sm text-slate-400 font-mono whitespace-nowrap">@alrafidain.com</span>
                    </div>
                  </div>

                  {isEditMode && selectedEmp && (
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase">System ID</p>
                      <p className="font-mono text-xs text-indigo-700 select-all break-all">{selectedEmp.id}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">رقم الهاتف</label>
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-indigo-600 mb-1 flex items-center gap-1"><Key size={14} /> كلمة المرور</label>
                      <input required minLength={isEditMode ? 1 : 6} type="text" value={formData.passcode} onChange={(e) => setFormData({ ...formData, passcode: e.target.value })} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-center font-mono tracking-widest" placeholder="******" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">صورة الموظف</label>
                    <div className="flex gap-2">
                      <input type="text" value={formData.profile_image} onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })} placeholder="رابط الصورة..." className="flex-1 border rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-left" dir="ltr" />
                      <button type="button" onClick={() => profileFileRef.current?.click()} disabled={uploadingProfile} className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 disabled:opacity-50"><Camera size={14} /> رفع</button>
                      <input type="file" ref={profileFileRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">الموقع / العنوان</label>
                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                  </div>
                </div>

                {/* Right: Position & Hierarchy */}
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2">المنصب والهيكلية</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">المرتبة (Rank)</label>
                      <select value={formData.rank} onChange={(e) => setFormData({ ...formData, rank: e.target.value })} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                        <option value="employee">موظف</option>
                        <option value="supervisor">مشرف قسم</option>
                        <option value="manager">مدير قسم</option>
                        <option value="executive">مدير تنفيذي</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">الدور (Role)</label>
                      <select value={formData.role} onChange={(e) => handleRoleChange(e.target.value)} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                        <option value="employee">موظف</option>
                        <option value="supervisor">مشرف</option>
                        <option value="manager">مدير قسم</option>
                        <option value="hr">موارد بشرية</option>
                        <option value="gatekeeper">حارس</option>
                        <option value="developer">⚙️ مطور</option>
                        <option value="admin">مدير نظام</option>
                      </select>
                    </div>
                  </div>

                  {formData.role === 'gatekeeper' && (
                    <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100 space-y-3">
                      <div>
                        <label className="block text-sm font-bold text-cyan-800 mb-2">نوع حركة الحارس</label>
                        <select value={formData.gatekeeper_type} onChange={(e) => setFormData({ ...formData, gatekeeper_type: e.target.value as GatekeeperType })} className="w-full border border-cyan-200 rounded-xl px-3 py-2 outline-none focus:border-cyan-500 bg-white">
                          <option value="employee_movement">حركة الموظفين فقط</option>
                          <option value="visitor_movement">حركة الزوار فقط</option>
                          <option value="both">كلاهما</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-cyan-800 mb-2">🔐 الرمز السري للبوابة (3 أرقام)</label>
                        <input type="text" maxLength={3} value={formData.gatekeeper_pin} onChange={(e) => setFormData({ ...formData, gatekeeper_pin: e.target.value.replace(/\D/g, '') })} placeholder="123" className="w-full border border-cyan-200 rounded-xl px-4 py-2 outline-none focus:border-cyan-500 text-center font-mono tracking-widest text-lg bg-white" />
                        <p className="text-xs text-cyan-600 mt-1">الرمز المستخدم للدخول إلى بوابة الحارس</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-1">القسم التصنيعي</label>
                    <select value={formData.manufacturing_dept} onChange={(e) => setFormData({ ...formData, manufacturing_dept: e.target.value })} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                      <option value="syrups">قسم الشرابات</option>
                      <option value="tablets">قسم الحبوب</option>
                      <option value="ointments">قسم المراهم</option>
                      <option value="powders">قسم المساحيق</option>
                      <option value="management">الإدارة العامة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">المسمى الوظيفي</label>
                    <input required type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1">المدير المباشر</label>
                      <select value={formData.manager_id} onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })} className="w-full border rounded-xl px-2 py-2 outline-none focus:border-indigo-500 text-xs">
                        <option value="">-- بدون --</option>
                        {employees.filter((e) => e.rank !== 'employee').map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">مدير القسم</label>
                      <select value={formData.department_manager_id} onChange={(e) => setFormData({ ...formData, department_manager_id: e.target.value })} className="w-full border rounded-xl px-2 py-2 outline-none focus:border-indigo-500 text-xs">
                        <option value="">-- بدون --</option>
                        {employees.filter((e) => e.rank === 'manager' || e.rank === 'executive').map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">مشرف القسم</label>
                      <select value={formData.supervisor_id} onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })} className="w-full border rounded-xl px-2 py-2 outline-none focus:border-indigo-500 text-xs">
                        <option value="">-- بدون --</option>
                        {employees.filter((e) => e.rank === 'supervisor').map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">الوردية المخصصة (Shift)</label>
                    <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                      <option value="all">جميع الورديات (مرن)</option>
                      <option value="morning">الوردية الصباحية</option>
                      <option value="evening">الوردية المسائية</option>
                      <option value="night">الوردية الليلية</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="mt-8 border-t pt-6">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck className="text-indigo-600" /> صلاحيات الشريط الجانبي</h4>
                <div className="space-y-4">
                  {PERM_CATEGORIES.map((category) => {
                    const perms = allPermissions.filter((p) => p.category === category);
                    if (perms.length === 0) return null;
                    return (
                      <div key={category}>
                        <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">{category}</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {perms.map((opt) => {
                            const PermIcon = opt.icon;
                            const active = (formData.permissions || []).includes(opt.id);
                            return (
                              <button key={opt.id} type="button" onClick={() => togglePermission(opt.id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold ${active ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-100 text-slate-500'}`}>
                                <PermIcon size={14} /> {opt.label}
                                {active && <CheckCircle2 size={12} className="mr-auto text-indigo-500" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">إلغاء</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md disabled:opacity-60">
                  {saving ? 'جاري الحفظ...' : isEditMode ? 'حفظ التعديلات' : 'إنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl p-4 sm:p-6 my-4 sm:my-8">
            <div className="flex justify-between items-center mb-6 gap-2">
              <h3 className="font-bold text-lg sm:text-xl">الملف الشخصي</h3>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEditModal(selectedEmp)} className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-sm flex items-center gap-1"><Edit2 size={16} /> تعديل</button>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-2xl flex-shrink-0">
                  {selectedEmp.full_name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold truncate">{selectedEmp.full_name}</h2>
                  <p className="text-indigo-600 font-semibold truncate">{selectedEmp.position || 'موظف'}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 space-y-4">
                <h4 className="font-bold flex items-center gap-2"><Briefcase size={18} className="text-indigo-600" /> معلومات العمل</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><span className="text-slate-500">القسم:</span> <span className="font-semibold">{selectedEmp.manufacturing_dept || 'غير محدد'}</span></div>
                  <div><span className="text-slate-500">المرتبة:</span> <span className="font-semibold">{RANK_LABELS[selectedEmp.rank] || selectedEmp.rank}</span></div>
                  <div><span className="text-slate-500">الدور:</span> <Badge variant={roleBadgeVariant(selectedEmp.role)} size="sm">{ROLE_LABELS[selectedEmp.role] || selectedEmp.role}</Badge></div>
                  <div><span className="text-slate-500">الوردية:</span> <span className="font-semibold">{SHIFT_LABELS[selectedEmp.shift || 'all']}</span></div>
                  <div><span className="text-slate-500">المدير المباشر:</span> <span className="font-semibold">{employees.find((e) => e.id === selectedEmp.manager_id)?.full_name || 'غير محدد'}</span></div>
                  <div><span className="text-slate-500">مدير القسم:</span> <span className="font-semibold">{employees.find((e) => e.id === selectedEmp.department_manager_id)?.full_name || 'غير محدد'}</span></div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 space-y-3">
                <h4 className="font-bold flex items-center gap-2"><Phone size={18} className="text-indigo-600" /> معلومات الاتصال</h4>
                <p className="text-sm flex items-center gap-2"><Mail size={16} className="text-slate-400 flex-shrink-0" /> {selectedEmp.email}</p>
                <p className="text-sm flex items-center gap-2"><Phone size={16} className="text-slate-400 flex-shrink-0" /> {selectedEmp.phone || 'لا يوجد'}</p>
                <p className="text-sm flex items-center gap-2"><MapPin size={16} className="text-slate-400 flex-shrink-0" /> {selectedEmp.location || 'غير مسجل'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}