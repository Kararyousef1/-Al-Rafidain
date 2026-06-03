import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

import { Search, Trash2, Loader, ServerCrash, User as UserIcon, Eye, ShieldCheck, LayoutDashboard, Star, FileText, Database, RefreshCw, Briefcase, MessageSquare } from 'lucide-react';
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
  const [showAuthUsers, setShowAuthUsers] = useState(false);

  const allPermissions = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, category: 'عام' },
    { id: 'problems', label: 'المشاكل والطلبات', icon: FileText, category: 'عام' },
    { id: 'profile', label: 'الملف الشخصي', icon: UserIcon, category: 'عام' },
    { id: 'attendance', label: 'سجلات الحضور', icon: Briefcase, category: 'الموظف' },
    { id: 'leave-requests', label: 'طلبات الإجازة', icon: FileText, category: 'الموظف' },
    { id: 'notifications', label: 'التبليغات', icon: MessageSquare, category: 'الإدارة' },
  ];

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
      setError('خطأ: ' + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthUsers = async () => {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;
      setAuthUsers(data?.users || []);
      setShowAuthUsers(true);
    } catch (err: any) {
      alert('فشل جلب المستخدمين من Auth: ' + err.message);
    }
  };

  const handleDeleteAuthUser = async (userId: string, email: string) => {
    if (!confirm(`حذف "${email}" من النظام بالكامل؟`)) return;
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (e: any) {
      if (!e.message?.includes('User not found')) console.warn(e.message);
    }
    try {
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
    } catch (e: any) {
      console.warn(e.message);
    }
    setAuthUsers(prev => prev.filter(u => u.id !== userId));
    setEmployees(prev => prev.filter(e => e.id !== userId));
    alert(`✅ تم حذف "${email}"`);
  };

  const handleDeleteEmployee = async (emp: any) => {
    if (!confirm(`حذف "${emp.full_name}" نهائياً؟`)) return;
    try {
      await supabaseAdmin.auth.admin.deleteUser(emp.id).catch(() => {});
      await supabaseAdmin.from('profiles').delete().eq('id', emp.id);
      setEmployees(prev => prev.filter(e => e.id !== emp.id));
      alert(`✅ تم حذف "${emp.full_name}"`);
    } catch (err: any) {
      alert(`فشل الحذف: ${err?.message || ''}`);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const departments = ['all', ...new Set(employees.map(e => e.manufacturing_dept).filter(Boolean) as string[])];
  
  const filtered = employees.filter(e => {
    if (filterDept !== 'all' && e.manufacturing_dept !== filterDept) return false;
    const term = search.toLowerCase();
    return (e.full_name || '').toLowerCase().includes(term) || (e.email || '').toLowerCase().includes(term);
  });

  const handleExport = () => {
    const headers = ['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'الدور', 'المرتبة', 'القسم', 'المسمى الوظيفي', 'الموقع'];
    const data = filtered.map(e => [
      e.full_name || '', e.email || '', e.phone || '', e.role || '', e.rank || '', e.manufacturing_dept || '', e.position || '', e.location || ''
    ]);
    exportToStyledExcel('قائمة_المستخدمين', headers, data);
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

      <div className="flex flex-wrap gap-3">
        <button onClick={fetchEmployees} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold">
          <RefreshCw size={18} /> تحديث
        </button>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold">
          <FileText size={18} /> تصدير Excel
        </button>
        <button onClick={fetchAuthUsers} className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 font-semibold">
          <Trash2 size={18} /> إدارة حسابات Auth
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm outline-none focus:border-indigo-400" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="all">الكل</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Auth Users Section */}
      {showAuthUsers && authUsers.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6">
          <h3 className="font-bold text-rose-800 mb-3">حسابات Authentication (قد لا يكون لها بروفايل)</h3>
          <div className="space-y-2">
            {authUsers.filter(u => u.email && !u.email.includes('@kayan.hr')).map(u => (
              <div key={u.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-rose-100">
                <div>
                  <span className="font-semibold text-slate-800">{u.email}</span>
                  <span className="text-xs text-slate-500 mr-2">آخر دخول: {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'غير معروف'}</span>
                </div>
                <button onClick={() => handleDeleteAuthUser(u.id, u.email)} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-semibold">
                  حذف
                </button>
              </div>
            ))}
            {authUsers.filter(u => u.email && !u.email.includes('@kayan.hr')).length === 0 && (
              <p className="text-rose-600 text-sm">لا توجد حسابات Auth إضافية</p>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin" size={24} /></div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 flex items-center gap-3">
          <ServerCrash size={24} /> <span className="font-semibold">{error}</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20">
          <Database size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">لا يوجد مستخدمين</h3>
          <p className="text-slate-500 mt-2">أنشئ مستخدمين جدد من Supabase أو استخدم صفحة Auth</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(emp => (
            <Card key={emp.id} hover className="overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                  {emp.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{emp.full_name || 'بدون اسم'}</h3>
                  <p className="text-sm text-indigo-600 font-semibold truncate">{emp.position || 'موظف'}</p>
                  <p className="text-xs text-slate-500 truncate">{emp.email || ''}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant={emp.role === 'admin' ? 'danger' : emp.role === 'hr' ? 'success' : emp.role === 'gatekeeper' ? 'warning' : 'primary'} size="sm">
                  {emp.role === 'admin' ? 'مدير' : emp.role === 'hr' ? 'موارد بشرية' : emp.role === 'gatekeeper' ? 'حارس' : 'موظف'}
                </Badge>
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteEmployee(emp)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}