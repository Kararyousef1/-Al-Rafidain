import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

import { Search, Plus, Mail, Phone, MapPin, Briefcase, Star, Trash2, Edit2, Loader, ServerCrash, X, Camera, User as UserIcon, Eye, Key, ShieldCheck, CheckCircle2, LayoutDashboard, Heart, Bot, GraduationCap, ClipboardList, MessageSquare, FileText, Database, RefreshCw } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { GatekeeperType } from '../../types';
import { exportToStyledExcel } from '../../utils/exportToExcel';
import { useAuthStore } from '../../store';

export default function AdminEmployeesPage() {
  const { user: currentUser } = useAuthStore();
  const [employees, setEmployees] = useState<any[]>([]);
  const [authUsers, setAuthUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAuthUsers, setShowAuthUsers] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const profileFileRef = useRef<HTMLInputElement>(null);

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
    developer: ['developer-dashboard', 'developer-attendance', 'developer-logs', 'developer-db', 'notifications', 'dashboard'],
  };

  const [formData, setFormData] = useState({
    full_name: '', email: '', passcode: '', role: 'employee',
    rank: 'employee', manufacturing_dept: 'syrups',
    department: '', position: '', phone: '', location: '',
    profile_image: '', manager_id: '', supervisor_id: '', department_manager_id: '', shift: 'all',
    permissions: defaultPermissions['employee'] as string[],
    is_verified: true,
    gatekeeper_type: 'both' as GatekeeperType,
    gatekeeper_pin: '',
  });

  const handleRoleChange = (newRole: string) => {
    setFormData(prev => ({
      ...prev,
      role: newRole,
      permissions: defaultPermissions[newRole] || ['dashboard', 'profile']
    }));
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      setError('خطأ: ' + (err?.message || ''));
    } finally { setLoading(false); }
  };

  const fetchAuthUsers = async () => {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      setAuthUsers(data?.users || []);
      setShowAuthUsers(true);
    } catch (err: any) { alert('فشل جلب المستخدمين من Auth: ' + err.message); }
  };

  const handleDeleteAuthUser = async (userId: string, email: string) => {
    if (!confirm(`حذف "${email}" من النظام بالكامل؟`)) return;
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
      try { await supabaseAdmin.from('profiles').delete().eq('id', userId); } catch {}
      setAuthUsers(prev => prev.filter(u => u.id !== userId));
      setEmployees(prev => prev.filter(e => e.id !== userId));
      alert(`✅ تم حذف "${email}"`);
    } catch (e: any) { alert(`فشل: ${e.message}`); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode && formData.passcode.length < 6) { alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل.'); return; }
    const namePrefix = formData.email.includes('@') ? formData.email.split('@')[0] : formData.email;
    const finalEmail = `${namePrefix}@alrafidain.com`;
    try {
      if (isEditMode && selectedEmp) {
        await supabaseAdmin.from('profiles').update({
          full_name: formData.full_name, email: finalEmail, role: formData.role, rank: formData.rank,
          manufacturing_dept: formData.manufacturing_dept, department: formData.department || formData.manufacturing_dept,
          position: formData.position, phone: formData.phone, location: formData.location,
          profile_image: formData.profile_image, manager_id: formData.manager_id || null,
          supervisor_id: formData.supervisor_id || null, department_manager_id: formData.department_manager_id || null,
          shift: formData.shift, permissions: formData.permissions,
          gatekeeper_pin: formData.gatekeeper_pin || '',
        }).eq('id', selectedEmp.id);
        if (formData.passcode.length >= 6) {
          await supabaseAdmin.auth.admin.updateUserById(selectedEmp.id, { password: formData.passcode }).catch(() => {});
        }
        setIsModalOpen(false); await fetchEmployees();
        alert(`✅ تم تحديث "${formData.full_name}"`);
      } else {
        const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: finalEmail, password: formData.passcode, email_confirm: true,
          user_metadata: { full_name: formData.full_name },
        });
        if (createError) throw new Error(createError.message);
        const newUserId = created?.user?.id;
        if (!newUserId) throw new Error('فشل إنشاء الحساب');
        await supabaseAdmin.from('profiles').upsert({
          id: newUserId, full_name: formData.full_name, email: finalEmail,
          role: formData.role, rank: formData.rank, manufacturing_dept: formData.manufacturing_dept,
          department: formData.department || formData.manufacturing_dept, position: formData.position,
          phone: formData.phone, location: formData.location, profile_image: formData.profile_image,
          manager_id: formData.manager_id || null, supervisor_id: formData.supervisor_id || null,
          department_manager_id: formData.department_manager_id || null, shift: formData.shift,
          status: 'active', permissions: formData.permissions,
          gatekeeper_pin: formData.gatekeeper_pin || '',
        });
        setIsModalOpen(false); await fetchEmployees();
        alert(`✅ تم إنشاء "${formData.full_name}"\nيمكنه الدخول بـ: ${formData.email}@alrafidain.com`);
      }
    } catch (err: any) { alert(`فشل: ${err.message}`); }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const departments = ['all', ...new Set(employees.map(e => e.manufacturing_dept).filter(Boolean) as string[])];
  const filtered = employees.filter(e => {
    if (filterDept !== 'all' && e.manufacturing_dept !== filterDept) return false;
    const term = search.toLowerCase();
    return (e.full_name || '').toLowerCase().includes(term) || (e.email || '').toLowerCase().includes(term);
  });

  const handleExport = () => {
    const headers = ['الاسم', 'البريد', 'رقم الهاتف', 'الدور', 'المرتبة', 'القسم', 'المسمى'];
    const data = filtered.map(e => [e.full_name || '', e.email || '', e.phone || '', e.role || '', e.rank || '', e.manufacturing_dept || '', e.position || '']);
    exportToStyledExcel('قائمة_المستخدمين', headers, data);
  };

  const handleFileUpload = async (file: File) => {
    setUploadingProfile(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `employees/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('public-assets').upload(path, file, { upsert: true });
      if (error) throw new Error('فشل الرفع');
      const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
      setFormData(prev => ({ ...prev, profile_image: data.publicUrl }));
    } catch (err: any) { alert(err.message); }
    finally { setUploadingProfile(false); }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
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
          <p className="text-2xl font-black">{filtered.length}</p>
          <p className="text-amber-100 text-xs font-bold mt-1">المعروض</p>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl p-4 text-white">
          <p className="text-2xl font-black">{authUsers.length || '-'}</p>
          <p className="text-violet-100 text-xs font-bold mt-1">في Auth</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={fetchEmployees} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold"><RefreshCw size={18} /> تحديث</button>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold"><FileText size={18} /> تصدير Excel</button>
        <button onClick={fetchAuthUsers} className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 font-semibold"><Trash2 size={18} /> إدارة حسابات Auth</button>
        <button onClick={() => {
          setFormData({ full_name: '', email: '', passcode: '', role: 'employee', rank: 'employee', manufacturing_dept: 'syrups', department: '', position: '', phone: '', location: '', profile_image: '', manager_id: '', supervisor_id: '', department_manager_id: '', shift: 'all', permissions: defaultPermissions['employee'], is_verified: true, gatekeeper_type: 'both', gatekeeper_pin: '' });
          setIsEditMode(false); setIsModalOpen(true);
        }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-sm"><Plus size={18} /> إضافة مستخدم جديد</button>
      </div>

      {showAuthUsers && authUsers.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4">
          <h3 className="font-bold text-rose-800 mb-3">حسابات Authentication</h3>
          <div className="space-y-2">
            {authUsers.filter(u => u.email).map(u => (
              <div key={u.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-rose-100">
                <span className="font-semibold">{u.email}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'لم يدخل'}</span>
                  <button onClick={() => handleDeleteAuthUser(u.id, u.email)} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-semibold">حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="all">الكل</option>
          {departments.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader className="animate-spin" size={24} /></div>
      : error ? <div className="bg-red-50 p-6 rounded-xl"><ServerCrash size={24} /> {error}</div>
      : employees.length === 0 ? (
        <div className="text-center py-20">
          <Database size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold">لا يوجد مستخدمين</h3>
          <p className="text-slate-500 mt-2">اضغط "إضافة مستخدم جديد"</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(emp => (
            <Card key={emp.id} hover>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-xl">{emp.full_name?.charAt(0) || 'U'}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{emp.full_name || 'بدون اسم'}</h3>
                  <p className="text-sm text-indigo-600 font-semibold truncate">{emp.position || 'موظف'}</p>
                  <p className="text-xs text-slate-500 truncate">{emp.email || ''}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={emp.role === 'admin' ? 'danger' : emp.role === 'hr' ? 'success' : emp.role === 'gatekeeper' ? 'warning' : 'primary'} size="sm">
                  {emp.role === 'admin' ? 'مدير' : emp.role === 'hr' ? 'موارد بشرية' : emp.role === 'gatekeeper' ? 'حارس' : 'موظف'}
                </Badge>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedEmp(emp); setIsViewModalOpen(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Eye size={16} /></button>
                  <button onClick={() => handleDeleteAuthUser(emp.id, emp.email)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center p-6 border-b bg-slate-50">
              <h3 className="font-bold text-xl">{isEditMode ? <><Edit2 className="inline text-indigo-600 ml-2" />تعديل بيانات</> : <><Plus className="inline text-indigo-600 ml-2" />إضافة مستخدم جديد</>}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg bg-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2">المعلومات الأساسية</h4>
                  <div>
                    <label className="block text-sm font-semibold mb-1">الاسم الكامل</label>
                    <input required type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-indigo-600 mb-1">اسم المستخدم</label>
                    <div className="flex items-center gap-2">
                      <input required type="text" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="flex-1 border rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-left" dir="ltr" placeholder="ahmed" />
                      <span className="text-sm text-slate-400 font-mono whitespace-nowrap">@alrafidain.com</span>
                    </div>
                  </div>
                  {isEditMode && selectedEmp && (
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                      <p className="text-[10px] font-bold text-indigo-400 uppercase">System ID</p>
                      <p className="font-mono text-xs text-indigo-700 select-all">{selectedEmp.id}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">رقم الهاتف</label>
                      <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-indigo-600 mb-1 flex items-center gap-1"><Key size={14} /> كلمة المرور</label>
                      <input required minLength={isEditMode ? 1 : 6} type="text" value={formData.passcode} onChange={e => setFormData({...formData, passcode: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-center font-mono tracking-widest" placeholder="******" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">صورة الموظف</label>
                    <div className="flex gap-2">
                      <input type="text" value={formData.profile_image} onChange={e => setFormData({...formData, profile_image: e.target.value})} placeholder="رابط الصورة..." className="flex-1 border rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-left" dir="ltr" />
                      <button type="button" onClick={() => profileFileRef.current?.click()} disabled={uploadingProfile} className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100"><Camera size={14} /> رفع</button>
                      <input type="file" ref={profileFileRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">الموقع / العنوان</label>
                    <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2">المنصب والهيكلية</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">المرتبة (Rank)</label>
                      <select value={formData.rank} onChange={e => setFormData({...formData, rank: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                        <option value="employee">موظف</option>
                        <option value="supervisor">مشرف قسم</option>
                        <option value="manager">مدير قسم</option>
                        <option value="executive">مدير تنفيذي</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">الدور (Role)</label>
                      <select value={formData.role} onChange={e => handleRoleChange(e.target.value)} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
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
                        <select value={formData.gatekeeper_type} onChange={e => setFormData({...formData, gatekeeper_type: e.target.value as GatekeeperType})} className="w-full border border-cyan-200 rounded-xl px-3 py-2 outline-none focus:border-cyan-500 bg-white">
                          <option value="employee_movement">حركة الموظفين فقط</option>
                          <option value="visitor_movement">حركة الزوار فقط</option>
                          <option value="both">كلاهما</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-cyan-800 mb-2">🔐 الرمز السري للبوابة (3 أرقام)</label>
                        <input
                          type="text"
                          maxLength={3}
                          value={formData.gatekeeper_pin}
                          onChange={e => setFormData({...formData, gatekeeper_pin: e.target.value.replace(/\D/g, '')})}
                          placeholder="123"
                          className="w-full border border-cyan-200 rounded-xl px-4 py-2 outline-none focus:border-cyan-500 text-center font-mono tracking-widest text-lg bg-white"
                        />
                        <p className="text-xs text-cyan-600 mt-1">الرمز المستخدم للدخول إلى بوابة الحارس</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold mb-1">القسم التصنيعي</label>
                    <select value={formData.manufacturing_dept} onChange={e => setFormData({...formData, manufacturing_dept: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                      <option value="syrups">قسم الشرابات</option>
                      <option value="tablets">قسم الحبوب</option>
                      <option value="ointments">قسم المراهم</option>
                      <option value="powders">قسم المساحيق</option>
                      <option value="management">الإدارة العامة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">المسمى الوظيفي</label>
                    <input required type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">المدير المباشر</label>
                      <select value={formData.manager_id} onChange={e => setFormData({...formData, manager_id: e.target.value})} className="w-full border rounded-xl px-2 py-2 outline-none focus:border-indigo-500 text-xs">
                        <option value="">-- بدون --</option>
                        {employees.filter(e => e.rank !== 'employee').map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">مدير القسم</label>
                      <select value={formData.department_manager_id} onChange={e => setFormData({...formData, department_manager_id: e.target.value})} className="w-full border rounded-xl px-2 py-2 outline-none focus:border-indigo-500 text-xs">
                        <option value="">-- بدون --</option>
                        {employees.filter(e => e.rank === 'manager' || e.rank === 'executive').map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">مشرف القسم</label>
                      <select value={formData.supervisor_id} onChange={e => setFormData({...formData, supervisor_id: e.target.value})} className="w-full border rounded-xl px-2 py-2 outline-none focus:border-indigo-500 text-xs">
                        <option value="">-- بدون --</option>
                        {employees.filter(e => e.rank === 'supervisor').map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">الوردية المخصصة (Shift)</label>
                    <select value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                      <option value="all">جميع الورديات (مرن)</option>
                      <option value="morning">الوردية الصباحية</option>
                      <option value="evening">الوردية المسائية</option>
                      <option value="night">الوردية الليلية</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t pt-6">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ShieldCheck className="text-indigo-600" /> صلاحيات الشريط الجانبي</h4>
                <div className="space-y-4">
                  {['عام', 'الموظف', 'الموارد البشرية', 'الإشراف', 'الحراسة', 'الإدارة'].map(category => {
                    const perms = allPermissions.filter(p => p.category === category);
                    if (perms.length === 0) return null;
                    return (
                      <div key={category}>
                        <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">{category}</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {perms.map(opt => {
                            const active = (formData.permissions || []).includes(opt.id);
                            return (
                              <button key={opt.id} type="button" onClick={() => {
                                const current = formData.permissions || [];
                                setFormData({...formData, permissions: active ? current.filter(id => id !== opt.id) : [...current, opt.id]});
                              }} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold ${active ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-100 text-slate-500'}`}>
                                <opt.icon size={14} /> {opt.label}
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

              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200">إلغاء</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md">{isEditMode ? 'حفظ التعديلات' : 'إنشاء الحساب'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl">الملف الشخصي</h3>
              <div className="flex gap-2">
                <button onClick={() => {
                  setFormData({
                    full_name: selectedEmp.full_name || '', email: selectedEmp.email?.split('@')[0] || '', passcode: '',
                    role: selectedEmp.role || 'employee', rank: selectedEmp.rank || 'employee',
                    manufacturing_dept: selectedEmp.manufacturing_dept || 'syrups', department: selectedEmp.department || '',
                    position: selectedEmp.position || '', phone: selectedEmp.phone || '', location: selectedEmp.location || '',
                    profile_image: selectedEmp.profile_image || '', manager_id: selectedEmp.manager_id || '',
                    supervisor_id: selectedEmp.supervisor_id || '', department_manager_id: selectedEmp.department_manager_id || '',
                    shift: selectedEmp.shift || 'all', permissions: selectedEmp.permissions || defaultPermissions[selectedEmp.role] || ['dashboard', 'profile'],
                    gatekeeper_type: selectedEmp.gatekeeper_type || 'both', is_verified: true,
                    gatekeeper_pin: selectedEmp.gatekeeper_pin || '',
                  });
                  setIsEditMode(true); setIsViewModalOpen(false); setIsModalOpen(true);
                }} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-sm"><Edit2 size={16} className="inline ml-1" /> تعديل</button>
                <button onClick={() => { setIsViewModalOpen(false); handleDeleteAuthUser(selectedEmp.id, selectedEmp.email); }} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-semibold text-sm"><Trash2 size={16} className="inline ml-1" /> حذف</button>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">{selectedEmp.full_name?.charAt(0) || 'U'}</div>
                <div>
                  <h2 className="text-xl font-bold">{selectedEmp.full_name}</h2>
                  <p className="text-indigo-600 font-semibold">{selectedEmp.position || 'موظف'}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 space-y-4">
                <h4 className="font-bold flex items-center gap-2"><Briefcase size={18} className="text-indigo-600" /> معلومات العمل</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500">القسم:</span> <span className="font-semibold">{selectedEmp.manufacturing_dept || 'غير محدد'}</span></div>
                  <div><span className="text-slate-500">المرتبة:</span> <span className="font-semibold">{selectedEmp.rank === 'executive' ? 'مدير تنفيذي' : selectedEmp.rank === 'manager' ? 'مدير' : selectedEmp.rank === 'supervisor' ? 'مشرف' : 'موظف'}</span></div>
                  <div><span className="text-slate-500">الدور:</span> <Badge variant={selectedEmp.role === 'admin' ? 'danger' : 'success'} size="sm">{selectedEmp.role}</Badge></div>
                  <div><span className="text-slate-500">الوردية:</span> <span className="font-semibold">{selectedEmp.shift === 'morning' ? 'صباحية' : selectedEmp.shift === 'evening' ? 'مسائية' : selectedEmp.shift === 'night' ? 'ليلية' : 'مرن'}</span></div>
                  <div><span className="text-slate-500">المدير المباشر:</span> <span className="font-semibold">{employees.find(e => e.id === selectedEmp.manager_id)?.full_name || 'غير محدد'}</span></div>
                  <div><span className="text-slate-500">مدير القسم:</span> <span className="font-semibold">{employees.find(e => e.id === selectedEmp.department_manager_id)?.full_name || 'غير محدد'}</span></div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                <h4 className="font-bold flex items-center gap-2"><Phone size={18} className="text-indigo-600" /> معلومات الاتصال</h4>
                <p className="text-sm"><Mail size={16} className="inline text-slate-400 ml-2" />{selectedEmp.email}</p>
                <p className="text-sm"><Phone size={16} className="inline text-slate-400 ml-2" />{selectedEmp.phone || 'لا يوجد'}</p>
                <p className="text-sm"><MapPin size={16} className="inline text-slate-400 ml-2" />{selectedEmp.location || 'غير مسجل'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}