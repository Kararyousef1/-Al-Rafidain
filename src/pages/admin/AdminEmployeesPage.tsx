import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

import { Search, Plus, Mail, Phone, MapPin, Briefcase, Star, Trash2, Edit2, Loader, ServerCrash, X, Camera, User as UserIcon, Eye, Key, ShieldCheck, CheckCircle2, LayoutDashboard, Heart, Bot, GraduationCap, ClipboardList, MessageSquare, FileText, Database, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { UserRole, Rank, ManufacturingDept, Employee, GatekeeperType } from '../../types';
import { exportToStyledExcel } from '../../utils/exportToExcel';
import { useAuthStore } from '../../store';

const REAL_ACCOUNTS_TEMPLATE = [
  { username: 'admin', password: 'admin123', role: 'admin', full_name: 'مدير النظام' },
  { username: 'hr', password: 'hr123', role: 'hr', full_name: 'مسؤول الموارد البشرية' },
  { username: 'employee', password: 'emp123', role: 'employee', full_name: 'موظف' },
  { username: 'gatekeeper', password: 'gate123', role: 'gatekeeper', full_name: 'مسؤول البوابة' },
  { username: 'dev', password: 'dev123', role: 'developer', full_name: 'مطور النظام' },
];

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

  // جميع الصلاحيات المتاحة في النظام لإدارتها ديناميكياً
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

  // الصلاحيات الافتراضية لكل دور
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

  // Upload States
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const profileFileRef = useRef<HTMLInputElement>(null);

  // Form State - كامل بجميع التفاصيل
  const [formData, setFormData] = useState({
    full_name: '', email: '', passcode: '', role: 'employee',
    rank: 'employee', manufacturing_dept: 'syrups',
    department: '', position: '', phone: '', location: '',
    profile_image: '', manager_id: '', supervisor_id: '', department_manager_id: '', shift: 'all',
    permissions: defaultPermissions['employee'] as string[],
    is_verified: true,
    gatekeeper_type: 'both' as GatekeeperType
  });

  /** جلب المستخدمين من Supabase فقط */
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
      setError('تعذّر تحميل المستخدمين من قاعدة البيانات: ' + (err?.message || 'تأكد من اتصال Supabase'));
    } finally {
      setLoading(false);
    }
  };

  /** إنشاء المستخدمين الحقيقيين الخمسة في Supabase */
  const handleCreateRealUsers = async () => {
    if (!confirm('سيتم إنشاء 5 مستخدمين حقيقيين في قاعدة بيانات Supabase.\n\n' +
      'admin@kayan.hr, hr@kayan.hr, employee@kayan.hr, gatekeeper@kayan.hr, dev@kayan.hr\n\n' +
      'كلمة المرور للجميع: admin123\n\nهل تريد الاستمرار؟')) return;
    
    setCreating(true);
    setError(null);
    let successCount = 0;
    let failCount = 0;
    let errorMessages: string[] = [];

    for (const acc of REAL_ACCOUNTS_TEMPLATE) {
      try {
        const finalEmail = `${acc.username}@kayan.hr`;
        
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: finalEmail,
          password: acc.password,
          email_confirm: true,
          user_metadata: { full_name: acc.full_name },
        });

        if (authError) {
          if (authError.message?.includes('already exists') || authError.message?.includes('already registered')) {
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users?.users?.find(u => u.email === finalEmail);
            if (existingUser) {
              const { error: updateError } = await supabaseAdmin.from('profiles').upsert({
                id: existingUser.id,
                full_name: acc.full_name,
                email: finalEmail,
                role: acc.role,
                department: acc.role === 'gatekeeper' ? 'الأمن' : acc.role === 'hr' ? 'الموارد البشرية' : acc.role === 'developer' ? 'تقنية المعلومات' : acc.role === 'admin' ? 'الإدارة' : 'الإنتاج',
                position: acc.role === 'developer' ? 'مطور نظام' : acc.role === 'admin' ? 'مدير نظام' : acc.role === 'hr' ? 'مسؤول موارد بشرية' : acc.role === 'gatekeeper' ? 'حارس أمن' : 'موظف',
                status: 'active',
                updated_at: new Date().toISOString(),
              });
              if (!updateError) successCount++;
              else { failCount++; errorMessages.push(`${acc.full_name}: ${updateError.message}`); }
            } else {
              failCount++;
            }
          } else {
            failCount++;
          }
          continue;
        }

        const newUserId = authData?.user?.id;
        if (!newUserId) { failCount++; continue; }

        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
          id: newUserId,
          full_name: acc.full_name,
          email: finalEmail,
          role: acc.role,
          department: acc.role === 'gatekeeper' ? 'الأمن' : acc.role === 'hr' ? 'الموارد البشرية' : acc.role === 'developer' ? 'تقنية المعلومات' : acc.role === 'admin' ? 'الإدارة' : 'الإنتاج',
          position: acc.role === 'developer' ? 'مطور نظام' : acc.role === 'admin' ? 'مدير نظام' : acc.role === 'hr' ? 'مسؤول موارد بشرية' : acc.role === 'gatekeeper' ? 'حارس أمن' : 'موظف',
          phone: null,
          status: 'active',
          rank: acc.role === 'admin' ? 'executive' : acc.role === 'hr' ? 'manager' : 'employee',
          manufacturing_dept: 'management',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (!profileError) successCount++;
        else failCount++;
      } catch (e) {
        failCount++;
      }
    }

    try {
      await supabaseAdmin.from('system_settings').upsert({
        id: 'singleton',
        landing_config: {},
        general_settings: {},
        ai_settings: {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch (e) {}

    setCreating(false);
    await fetchEmployees();
    
    alert(`✅ تم إنشاء/تحديث ${successCount} من 5 مستخدمين\n\nكلمة المرور للجميع: admin123\nيمكن الدخول باستخدام: admin, hr, employee, gatekeeper, dev`);
  };

  /** حذف مستخدم من Supabase */
  const handleDeleteEmployee = async (emp: any) => {
    if (!confirm(`هل أنت متأكد من حذف "${emp.full_name}" نهائياً من النظام وقاعدة البيانات؟`)) return;

    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(emp.id);
      if (authError) {
        const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', emp.id);
        if (profileError) throw profileError;
      }
      setEmployees(prev => prev.filter(e => e.id !== emp.id));
      alert(`✅ تم حذف "${emp.full_name}" نهائياً من قاعدة البيانات`);
    } catch (err: any) {
      alert(`فشل الحذف: ${err?.message || 'خطأ غير معروف'}`);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const departments = ['all', ...new Set(employees.map(e => e.manufacturing_dept).filter(Boolean) as string[])];

  // Hierarchical view logic
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEditMode && formData.passcode.length < 6) {
      alert('فشل الحفظ: المفتاح السري (كلمة المرور) يجب أن يكون 6 أحرف أو أرقام على الأقل.');
      return;
    }

    const currentEmailInput = formData.email ?? '';
    const finalEmail = currentEmailInput.includes('@') ? currentEmailInput : `${currentEmailInput}@kayan.hr`;

    try {
      if (isEditMode && selectedEmp) {
        const { data, error: updateError } = await supabaseAdmin.from('profiles').update({
          full_name: formData.full_name,
          email: finalEmail,
          role: formData.role,
          rank: formData.rank,
          manufacturing_dept: formData.manufacturing_dept,
          department: formData.department || formData.manufacturing_dept,
          position: formData.position,
          phone: formData.phone,
          location: formData.location,
          passcode: formData.passcode,
          profile_image: formData.profile_image,
          manager_id: formData.manager_id || null,
          supervisor_id: formData.supervisor_id || null,
          department_manager_id: formData.department_manager_id || null,
          shift: formData.shift,
          permissions: formData.permissions,
        }).eq('id', selectedEmp.id).select();

        if (updateError) throw updateError;
        if (!data || data.length === 0) throw new Error('لم يتم العثور على المستخدم لتحديثه.');

        if (formData.passcode && formData.passcode.length >= 6) {
          await supabaseAdmin.auth.admin.updateUserById(selectedEmp.id, {
            password: formData.passcode,
          }).catch((e) => console.warn('تعذّر تحديث كلمة المرور:', e?.message));
        }

        setIsModalOpen(false);
        await fetchEmployees();
        alert(`✅ تم حفظ تعديلات "${formData.full_name}" بنجاح`);
      } else {
        let existingUserId: string | null = null;
        try {
          const { data: users } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users?.users?.find(u => u.email === finalEmail);
          if (existingUser) {
            existingUserId = existingUser.id;
          }
        } catch (e) {}

        if (existingUserId) {
          const { error: updateError } = await supabaseAdmin.from('profiles').upsert({
            id: existingUserId,
            full_name: formData.full_name,
            email: finalEmail,
            role: formData.role,
            rank: formData.rank,
            manufacturing_dept: formData.manufacturing_dept,
            department: formData.department || formData.manufacturing_dept,
            position: formData.position,
            phone: formData.phone,
            location: formData.location,
            passcode: formData.passcode,
            profile_image: formData.profile_image,
            manager_id: formData.manager_id || null,
            supervisor_id: formData.supervisor_id || null,
            department_manager_id: formData.department_manager_id || null,
            shift: formData.shift,
            status: 'active',
            permissions: formData.permissions,
          });

          if (updateError) throw new Error('فشل تحديث البروفايل: ' + updateError.message);

          setIsModalOpen(false);
          await fetchEmployees();
          alert(`✅ تم تحديث بيانات "${formData.full_name}" بنجاح (كان موجوداً مسبقاً)`);
        } else {
          const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: finalEmail,
            password: formData.passcode,
            email_confirm: true,
            user_metadata: { full_name: formData.full_name },
          });

          if (createError) {
            if (createError.message?.includes('already exists') || createError.message?.includes('already registered')) {
              try {
                const { data: users } = await supabaseAdmin.auth.admin.listUsers();
                const existingUser = users?.users?.find(u => u.email === finalEmail);
                if (existingUser) {
                  const { error: upsertError } = await supabaseAdmin.from('profiles').upsert({
                    id: existingUser.id,
                    full_name: formData.full_name,
                    email: finalEmail,
                    role: formData.role,
                    rank: formData.rank,
                    manufacturing_dept: formData.manufacturing_dept,
                    department: formData.department || formData.manufacturing_dept,
                    position: formData.position,
                    phone: formData.phone,
                    location: formData.location,
                    passcode: formData.passcode,
                    profile_image: formData.profile_image,
                    manager_id: formData.manager_id || null,
                    supervisor_id: formData.supervisor_id || null,
                    department_manager_id: formData.department_manager_id || null,
                    shift: formData.shift,
                    status: 'active',
                    permissions: formData.permissions,
                  });
                  if (upsertError) throw upsertError;
                  
                  setIsModalOpen(false);
                  await fetchEmployees();
                  alert(`✅ تم تحديث بيانات "${formData.full_name}" بنجاح (كان موجوداً مسبقاً)`);
                  return;
                }
              } catch (e2: any) {
                throw new Error('المستخدم موجود ولكن لم نتمكن من تحديث بياناته: ' + (e2?.message || ''));
              }
            }
            throw new Error('فشل إنشاء حساب المستخدم: ' + createError.message);
          }

          const newUserId = created?.user?.id;
          if (!newUserId) throw new Error('لم يتم استلام معرف المستخدم بعد الإنشاء.');

          const { error: insertError } = await supabaseAdmin.from('profiles').upsert({
            id: newUserId,
            full_name: formData.full_name,
            email: finalEmail,
            role: formData.role,
            rank: formData.rank,
            manufacturing_dept: formData.manufacturing_dept,
            department: formData.department || formData.manufacturing_dept,
            position: formData.position,
            phone: formData.phone,
            location: formData.location,
            passcode: formData.passcode,
            profile_image: formData.profile_image,
            manager_id: formData.manager_id || null,
            supervisor_id: formData.supervisor_id || null,
            department_manager_id: formData.department_manager_id || null,
            shift: formData.shift,
            status: 'active',
            permissions: formData.permissions,
          });

          if (insertError) {
            await supabaseAdmin.auth.admin.deleteUser(newUserId).catch(() => {});
            throw new Error('تم إنشاء الحساب لكن فشل حفظ بيانات الملف الشخصي: ' + insertError.message);
          }

          setIsModalOpen(false);
          await fetchEmployees();
          alert(`✅ تم إنشاء حساب "${formData.full_name}" بنجاح في قاعدة البيانات`);
        }
      }
    } catch (err: any) {
      alert(`فشل الحفظ: ${err.message}`);
    }
  };

  const handleFileUpload = async (file: File, field: 'profile_image') => {
    setUploadingProfile(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `employees/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('public-assets').upload(path, file, { upsert: true });
      if (error) throw new Error('فشل الرفع. تأكد من إنشاء مساحة تخزين Storage Bucket باسم "public-assets" وجعله Public في Supabase.');
      const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
      setFormData(prev => ({ ...prev, [field]: data.publicUrl }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleExport = () => {
    const headers = ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'الدور', 'المرتبة', 'القسم التصنيعي', 'المسمى الوظيفي', 'الموقع'];
    const data = filtered.map(e => [
      e.full_name || '', e.email || '', e.phone || '', e.role || '', e.rank || '', e.manufacturing_dept || '', e.position || '', e.location || ''
    ]);
    exportToStyledExcel('قائمة_المستخدمين', headers, data);
  };

  const viewEmployeeDetails = (emp: any) => {
    setSelectedEmp(emp);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* إحصائيات الموظفين */}
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
          {employees.length === 0 && !loading && (
            <button onClick={handleCreateRealUsers} disabled={creating} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold shadow-md disabled:opacity-60">
              {creating ? <Loader className="animate-spin" size={18} /> : <Database size={18} />}
              {creating ? 'جاري الإنشاء...' : 'إنشاء المستخدمين التجريبيين'}
            </button>
          )}
          <button onClick={() => { fetchEmployees(); }} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold">
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
          <button onClick={handleCreateRealUsers} disabled={creating} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-sm">
            {creating ? <Loader className="animate-spin" size={18} /> : <Database size={18} />}
            {creating ? '...' : 'إنشاء المستخدمين التجريبيين'}
          </button>
        </div>
      </div>

      {/* Search & Filters */}
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
          <span className="font-semibold">جاري تحميل السجلات من قاعدة البيانات...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 flex items-center gap-3">
          <ServerCrash size={24} />
          <div className="flex-1">
            <span className="font-semibold">{error}</span>
            <p className="text-sm mt-1">تأكد من صحة متغيرات Supabase في ملف .env.local</p>
          </div>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database size={36} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">لا يوجد مستخدمين في قاعدة البيانات</h3>
          <p className="text-slate-500 mb-6">اضغط على الزر أدناه لإنشاء مستخدمين تجريبيين</p>
          <button onClick={handleCreateRealUsers} disabled={creating} className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold shadow-lg disabled:opacity-60 text-lg active:scale-95">
            {creating ? <Loader className="animate-spin" size={22} /> : <Database size={22} />}
            {creating ? 'جاري إنشاء المستخدمين...' : '🚀 إنشاء المستخدمين التجريبيين'}
          </button>
          <p className="text-xs text-slate-400 mt-4">
            سيتم إنشاء: admin · hr · employee · gatekeeper · dev<br />
            جميع كلمات المرور: admin123
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(emp => (
            <Card key={emp.id} hover className="overflow-hidden group">
              <div className="flex items-start gap-4">
                <div className="relative">
                  {emp.profile_image ? (
                    <img src={emp.profile_image} alt="Profile" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-xl border border-indigo-200">
                      {emp.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="absolute -top-1 -left-1 bg-white rounded-full p-0.5 shadow-sm">
                    <CheckCircle2 size={16} className="text-blue-500 fill-blue-50" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate text-lg">{emp.full_name || 'بدون اسم'}</h3>
                  <p className="text-sm text-indigo-600 font-semibold truncate">{emp.position || 'موظف'}</p>
                  <p className="text-xs text-slate-500 truncate mt-1">بريد: {emp.email || 'غير محدد'}</p>
                  <div className="mt-2 flex items-center gap-2 bg-indigo-50/50 w-fit px-2.5 py-1 rounded-lg border border-indigo-100 shadow-sm">
                    <Key size={12} className="text-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase">ID:</span>
                    <span className="text-[11px] font-mono font-bold text-indigo-700 select-all">{emp.id?.substring(0, 12)}...</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-medium">
                <div className="bg-slate-50 rounded-lg p-2 flex flex-col gap-1 border border-slate-100">
                  <span className="text-slate-400">المرتبة</span>
                  <span className="text-slate-700">{emp.rank === 'executive' ? 'مدير تنفيذي' : emp.rank === 'manager' ? 'مدير قسم' : emp.rank === 'supervisor' ? 'مشرف' : 'موظف'}</span>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 flex flex-col gap-1 border border-slate-100">
                  <span className="text-slate-400">القسم / التخصص</span>
                  <span className="text-slate-700">{emp.manufacturing_dept || 'عام'}</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Badge variant={emp.role === 'admin' ? 'danger' : emp.role === 'hr' ? 'success' : emp.role === 'gatekeeper' ? 'warning' : 'primary'} size="sm">
                  {emp.role === 'admin' ? 'مدير نظام' : emp.role === 'hr' ? 'موارد بشرية' : emp.role === 'manager' ? 'مدير قسم' : emp.role === 'supervisor' ? 'مشرف' : emp.role === 'gatekeeper' ? 'حارس أمن' : 'موظف'}
                </Badge>
                <button onClick={() => viewEmployeeDetails(emp)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors font-semibold flex items-center gap-1.5 text-sm">
                  <Eye size={16} /> التفاصيل
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── CREATE USER MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                {isEditMode ? <Edit2 className="text-indigo-600" /> : <Plus className="text-indigo-600" />} 
                {isEditMode ? 'تعديل بيانات الموظف' : 'إضافة مستخدم جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-1.5 rounded-lg shadow-sm border border-slate-200">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2 mb-4">المعلومات الأساسية</h4>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">الاسم الكامل</label>
                    <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-indigo-600 mb-1">اسم المستخدم للدخول (Username)</label>
                    <input required type="text" placeholder="مثال: ahmed_2024" value={(formData.email ?? '').split('@')[0]} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-left" dir="ltr" />
                  </div>

                  {isEditMode && (
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                      <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1">معرف النظام التلقائي (System ID)</label>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-indigo-700 select-all">{selectedEmp?.id}</span>
                        <Key size={14} className="text-indigo-500 animate-pulse" />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">رقم الهاتف</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-indigo-600 mb-1 flex items-center gap-1">
                        <ShieldCheck size={14} /> المفتاح السري (كلمة المرور)
                      </label>
                      <input required minLength={isEditMode ? 1 : 6} type="text" placeholder="******" value={formData.passcode} onChange={e => setFormData({...formData, passcode: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-center font-mono tracking-widest bg-slate-50" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">صورة الموظف (رابط أو رفع)</label>
                    <div className="flex gap-2">
                      <input type="text" value={formData.profile_image} onChange={e => setFormData({...formData, profile_image: e.target.value})} placeholder="رابط الصورة..." className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-left" dir="ltr" />
                      <button type="button" onClick={() => profileFileRef.current?.click()} disabled={uploadingProfile} className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors whitespace-nowrap flex items-center gap-1.5">
                        <Camera size={14} /> رفع
                      </button>
                      <input type="file" ref={profileFileRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'profile_image')} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">الموقع / العنوان</label>
                    <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="الموقع الجغرافي..." className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2 mb-4">المنصب والصلاحيات</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">المرتبة الوظيفية (Rank)</label>
                      <select value={formData.rank} onChange={e => setFormData({...formData, rank: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                        <option value="employee">موظف</option>
                        <option value="supervisor">مشرف قسم</option>
                        <option value="manager">مدير قسم</option>
                        <option value="executive">مدير تنفيذي</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">صلاحية النظام (Role)</label>
                      <select value={formData.role} onChange={e => handleRoleChange(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                        <option value="employee">موظف (بوابة الموظف)</option>
                        <option value="supervisor">مشرف (صلاحيات إشرافية)</option>
                        <option value="manager">مدير قسم (صلاحيات إدارية)</option>
                        <option value="hr">موارد بشرية</option>
                        <option value="gatekeeper">حارس أمن (بوابة الحارس)</option>
                        <option value="admin">مدير نظام كامل</option>
                      </select>
                    </div>
                    
                    {formData.role === 'gatekeeper' && (
                      <div className="col-span-2 bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                        <label className="block text-sm font-bold text-cyan-800 mb-2 flex items-center gap-2">
                          <ShieldCheck size={16} /> نوع حركة الحارس
                        </label>
                        <select 
                          value={formData.gatekeeper_type} 
                          onChange={e => setFormData({...formData, gatekeeper_type: e.target.value as GatekeeperType})} 
                          className="w-full border border-cyan-200 rounded-xl px-3 py-2 outline-none focus:border-cyan-500 bg-white"
                        >
                          <option value="employee_movement">حركة الموظفين فقط</option>
                          <option value="visitor_movement">حركة الزوار فقط</option>
                          <option value="both">كلاهما (موظفين وزوار)</option>
                        </select>
                        <p className="text-xs text-cyan-600 mt-2">سيتم عرض خيارات تسجيل الدخول والخروج بناءً على هذا التحديد في بوابة الحارس.</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">القسم التصنيعي (Department)</label>
                    <select value={formData.manufacturing_dept} onChange={e => setFormData({...formData, manufacturing_dept: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                      <option value="syrups">قسم الشرابات (Syrups)</option>
                      <option value="tablets">قسم الحبوب (Tablets)</option>
                      <option value="ointments">قسم المراهم (Ointments)</option>
                      <option value="powders">قسم المساحيق (Powders)</option>
                      <option value="management">الإدارة العامة</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">المسمى الوظيفي الدقيق</label>
                    <input required type="text" placeholder="مثال: مشغل انتاج اول، تعبئة وتغليف..." value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">المدير المباشر</label>
                      <select value={formData.manager_id} onChange={e => setFormData({...formData, manager_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                        <option value="">-- بدون مدير مباشر --</option>
                        {employees.filter(e => e.rank !== 'employee').map(m => (
                          <option key={m.id} value={m.id}>{m.full_name} ({m.position})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">مدير القسم</label>
                      <select value={formData.department_manager_id} onChange={e => setFormData({...formData, department_manager_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                        <option value="">-- بدون مدير قسم --</option>
                        {employees.filter(e => e.role === 'manager' || e.rank === 'manager' || e.role === 'admin' || e.rank === 'executive').map(m => (
                          <option key={m.id} value={m.id}>{m.full_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">مشرف القسم</label>
                      <select value={formData.supervisor_id} onChange={e => setFormData({...formData, supervisor_id: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                        <option value="">-- بدون مشرف --</option>
                        {employees.filter(e => e.role === 'supervisor' || e.rank === 'supervisor').map(m => (
                          <option key={m.id} value={m.id}>{m.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">الوردية المخصصة (Shift)</label>
                    <select value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                      <option value="all">جميع الورديات (مرن / دوام كامل)</option>
                      <option value="morning">الوردية الصباحية</option>
                      <option value="evening">الوردية المسائية</option>
                      <option value="night">الوردية الليلية</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── قسم الصلاحيات الديناميكية ── */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-indigo-600" /> صلاحيات الوصول للشريط الجانبي
                </h4>
                <p className="text-sm text-slate-500 mb-4">
                  تم تعيين الصلاحيات الافتراضية لدور "<span className="font-bold text-indigo-600">{formData.role === 'hr' ? 'الموارد البشرية' : formData.role === 'gatekeeper' ? 'حارس الأمن' : formData.role === 'manager' ? 'مدير القسم' : formData.role === 'supervisor' ? 'المشرف' : 'الموظف'}</span>".
                </p>
                
                <div className="space-y-4">
                  {['عام', 'الموظف', 'الموارد البشرية', 'الإشراف', 'الحراسة', 'الإدارة'].map(category => {
                    const categoryPerms = allPermissions.filter(p => p.category === category);
                    if (categoryPerms.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h5 className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">{category}</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {categoryPerms.map(option => {
                            const isActive = (formData.permissions || []).includes(option.id);
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  const current = formData.permissions || [];
                                  const next = isActive 
                                    ? current.filter(id => id !== option.id)
                                    : [...current, option.id];
                                  setFormData({...formData, permissions: next});
                                }}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-xs font-bold ${
                                  isActive
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                                }`}
                              >
                                <option.icon size={14} />
                                {option.label}
                                {isActive ? (
                                  <CheckCircle2 size={12} className="mr-auto text-indigo-500" />
                                ) : (
                                  <span className="mr-auto text-slate-300 text-lg leading-none">+</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">
                  إلغاء
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md">
                  {isEditMode ? 'حفظ التعديلات' : 'إنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW EMPLOYEE DETAILS MODAL ── */}
      {isViewModalOpen && selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-end p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white w-full md:w-[600px] h-full md:h-[95vh] md:rounded-2xl shadow-2xl flex flex-col transform transition-transform animate-slide-in-left">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur z-10 md:rounded-t-2xl">
              <h3 className="font-bold text-xl text-slate-800">الملف الشخصي للموظف</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  setFormData({
                    full_name: selectedEmp.full_name || '',
                    email: selectedEmp.email || '',
                    passcode: selectedEmp.passcode || '',
                    role: selectedEmp.role || 'employee',
                    rank: selectedEmp.rank || 'employee',
                    manufacturing_dept: selectedEmp.manufacturing_dept || 'syrups',
                    department: selectedEmp.department || '',
                    position: selectedEmp.position || '',
                    phone: selectedEmp.phone || '',
                    location: selectedEmp.location || '',
                    profile_image: selectedEmp.profile_image || '',
                    manager_id: selectedEmp.manager_id || '',
                    supervisor_id: selectedEmp.supervisor_id || '',
                    department_manager_id: selectedEmp.department_manager_id || '',
                    shift: selectedEmp.shift || 'all',
                    permissions: selectedEmp.permissions || defaultPermissions[selectedEmp.role] || ['dashboard', 'profile'],
                    gatekeeper_type: selectedEmp.gatekeeper_type || 'both',
                    is_verified: selectedEmp.is_verified ?? true
                  });
                  setIsEditMode(true);
                  setIsViewModalOpen(false);
                  setIsModalOpen(true);
                }} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors font-semibold flex items-center gap-1.5 text-sm">
                  <Edit2 size={16} /> تعديل
                </button>
                <button onClick={() => { handleDeleteEmployee(selectedEmp); setIsViewModalOpen(false); }} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors font-semibold flex items-center gap-1.5 text-sm">
                  <Trash2 size={16} /> حذف
                </button>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex flex-col items-center mb-8">
                {selectedEmp.profile_image ? (
                  <img src={selectedEmp.profile_image} alt="Profile" className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg mb-4" />
                ) : (
                  <div className="w-32 h-32 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-4xl shadow-lg mb-4">
                    {selectedEmp.full_name?.charAt(0) || 'U'}
                  </div>
                )}
                <h2 className="text-2xl font-extrabold text-slate-800">{selectedEmp.full_name}</h2>
                <p className="text-indigo-600 font-bold mt-1 bg-indigo-50 px-3 py-1 rounded-full text-sm">{selectedEmp.position}</p>
                <div className="mt-4 flex gap-2 flex-wrap justify-center">
                  <Badge variant={selectedEmp.status === 'active' ? 'success' : 'warning'}>
                    {selectedEmp.status === 'active' ? 'نشط' : 'غير نشط/إجازة'}
                  </Badge>
                  <Badge variant="neutral">{selectedEmp.rank === 'executive' ? 'مدير تنفيذي' : selectedEmp.rank === 'manager' ? 'مدير قسم' : selectedEmp.rank === 'supervisor' ? 'مشرف' : 'موظف'}</Badge>
                  <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shadow-inner">
                    <Key size={12} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase">ID:</span>
                    <span className="text-[10px] font-mono text-indigo-600 font-bold select-all">{selectedEmp.id?.substring(0, 16)}...</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Briefcase size={18} className="text-indigo-600" /> معلومات العمل</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-slate-500 block mb-1">القسم التصنيعي:</span> <span className="font-semibold text-slate-800">{selectedEmp.manufacturing_dept || 'غير محدد'}</span></div>
                    <div><span className="text-slate-500 block mb-1">القسم الإداري:</span> <span className="font-semibold text-slate-800">{selectedEmp.department || 'غير محدد'}</span></div>
                    <div><span className="text-slate-500 block mb-1">تاريخ الانضمام:</span> <span className="font-semibold text-slate-800">{selectedEmp.created_at ? new Date(selectedEmp.created_at).toLocaleDateString() : 'غير محدد'}</span></div>
                    <div><span className="text-slate-500 block mb-1">المفتاح السري:</span> <span className="font-mono bg-white px-2 py-1 border border-slate-200 rounded text-slate-700 tracking-widest">{selectedEmp.passcode || '****'}</span></div>
                    <div><span className="text-slate-500 block mb-1">الوردية المخصصة:</span> <span className="font-semibold text-slate-800">{selectedEmp.shift === 'morning' ? 'صباحي' : selectedEmp.shift === 'evening' ? 'مسائي' : selectedEmp.shift === 'night' ? 'ليلي' : 'مرن (جميع الورديات)'}</span></div>
                    <div><span className="text-slate-500 block mb-1">المدير المباشر:</span> <span className="font-semibold text-slate-800">{employees.find(e => e.id === selectedEmp.manager_id)?.full_name || 'غير محدد'}</span></div>
                    <div><span className="text-slate-500 block mb-1">مدير القسم:</span> <span className="font-semibold text-slate-800">{employees.find(e => e.id === selectedEmp.department_manager_id)?.full_name || 'غير محدد'}</span></div>
                    <div><span className="text-slate-500 block mb-1">مشرف القسم:</span> <span className="font-semibold text-slate-800">{employees.find(e => e.id === selectedEmp.supervisor_id)?.full_name || 'غير محدد'}</span></div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Phone size={18} className="text-indigo-600" /> معلومات الاتصال</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3"><Mail size={16} className="text-slate-400" /> <span className="font-semibold text-slate-800">{selectedEmp.email}</span></div>
                    <div className="flex items-center gap-3"><Phone size={16} className="text-slate-400" /> <span className="font-semibold text-slate-800">{selectedEmp.phone || 'لا يوجد رقم'}</span></div>
                    <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-400" /> <span className="font-semibold text-slate-800">{selectedEmp.location || 'العنوان غير مسجل'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-in-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left { animation: slide-in-left 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}