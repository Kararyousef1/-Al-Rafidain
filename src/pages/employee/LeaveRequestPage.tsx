import { useState, useEffect } from 'react';
import { Calendar, FileText, Send, Clock, CheckCircle, XCircle, Loader, User, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useUIStore } from '../../store';

export default function LeaveRequestPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'سنوية',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', user?.id)
        .order('created_at', { ascending: false });
      if (data) setRequests(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.start_date || !formData.end_date) return;
    setSubmitting(true);
    try {
      // حساب عدد الأيام
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

      // إيجاد المشرف المباشر للموظف
      const managerId = (user as any).manager_id || (user as any).manager || user.id;

      const { data: managerProfile } = await supabase
        .from('profiles')
        .select('id, full_name, position, department, manufacturing_dept')
        .eq('id', managerId)
        .maybeSingle();

      const { error } = await supabase.from('leave_requests').insert({
        employee_id: user.id,
        employee_name: user.full_name,
        employee_position: user.position,
        employee_department: user.department || (user as any).manufacturingDept || '',
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days_count: days,
        reason: formData.reason,
        status: 'pending',
        supervisor_id: (user as any).manager_id || null,
        supervisor_name: managerProfile?.full_name || 'المدير المباشر',
      });

      if (error) throw error;

      addToast('✅ تم إرسال طلب الإجازة بنجاح، بإنتظار موافقة المشرف', 'success');
      setShowForm(false);
      setFormData({ leave_type: 'سنوية', start_date: '', end_date: '', reason: '' });
      fetchRequests();
    } catch (err: any) {
      addToast('❌ فشل إرسال الطلب: ' + err.message, 'error');
    } finally { setSubmitting(false); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    };
    const label: Record<string, string> = {
      pending: 'قيد المراجعة',
      approved: 'تمت الموافقة',
      rejected: 'مرفوض',
    };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold ${map[status] || 'bg-slate-100 text-slate-600'}`}>{label[status] || status}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2"><Calendar size={24} /> طلب إجازة</h2>
          <p className="text-white/70 mt-1">تقديم طلبات الإجازة السنوية والمرضية</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
          {showForm ? 'إلغاء' : '+ طلب جديد'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">نوع الإجازة</label>
              <select value={formData.leave_type} onChange={e => setFormData({...formData, leave_type: e.target.value})} className="w-full border rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500">
                <option value="سنوية">إجازة سنوية</option>
                <option value="مرضية">إجازة مرضية</option>
                <option value="طارئة">إجازة طارئة</option>
                <option value="زمنية">إجازة زمنية</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">تاريخ البداية</label>
              <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full border rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500" required />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">تاريخ النهاية</label>
              <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full border rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">سبب الإجازة</label>
            <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} rows={3} className="w-full border rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500" placeholder="اذكر سبب طلب الإجازة..." required />
          </div>
          <button type="submit" disabled={submitting} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2">
            {submitting ? 'جاري الإرسال...' : <><Send size={16} /> إرسال الطلب</>}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin" size={24} /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-40" />
          <p>لا توجد طلبات إجازة سابقة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-slate-800">{req.leave_type}</span>
                    {statusBadge(req.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {req.start_date} → {req.end_date}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {req.days_count} يوم</span>
                  </div>
                  {req.reason && <p className="text-sm text-slate-600 mt-2">{req.reason}</p>}
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                    <User size={12} /> المشرف: {req.supervisor_name || 'قيد التحديد'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}