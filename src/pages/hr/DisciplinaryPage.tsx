/**
 * DisciplinaryPage - إدارة الجزاءات والإنذارات (HR)
 */
import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, Plus, Loader2, Eye, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUIStore, useAuthStore } from '../../store';
import { getErrorMessage } from '../../lib/errors';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { DisciplinaryAction, DisciplinaryType } from '../../types/hrModules';
import { DISCIPLINARY_TYPE_LABELS } from '../../types/hrModules';
import { Modal, FormField, ModalActions, EmployeePicker } from './LoansPage';

export default function DisciplinaryPage() {
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<DisciplinaryAction[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<DisciplinaryAction | null>(null);
  const [form, setForm] = useState({
    employee_id: '', type: 'verbal_warning' as DisciplinaryType,
    reason: '', description: '', severity: 'low',
    incident_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const fetchActions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('disciplinary_actions')
        .select(`*, employees!inner(full_name_ar, employee_code)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setActions((data || []) as unknown as DisciplinaryAction[]);
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchActions(); }, [fetchActions]);

  const handleCreate = async () => {
    if (!form.employee_id || !form.reason) {
      addToast('يرجى ملء الحقول المطلوبة', 'warning');
      return;
    }
    try {
      // ربط الإجراء التأديبي بالمستخدم الحالي (HR) وليس موظف عشوائي
      const currentEmployeeId = user?.employee_id || user?.id;
      const { error } = await supabase.from('disciplinary_actions').insert({
        ...form,
        issued_by: currentEmployeeId,
        status: 'active',
      });
      if (error) throw error;
      addToast('تم تسجيل الإجراء التأديبي', 'success');
      setShowCreate(false);
      setForm({ employee_id: '', type: 'verbal_warning', reason: '', description: '', severity: 'low', incident_date: format(new Date(), 'yyyy-MM-dd') });
      await fetchActions();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const typeColors: Record<string, { bg: string; text: string }> = {
    verbal_warning: { bg: '#f59e0b22', text: '#f59e0b' },
    written_warning: { bg: '#f9731622', text: '#f97316' },
    suspension: { bg: '#ef444422', text: '#ef4444' },
    demotion: { bg: '#a855f722', text: '#a855f7' },
    termination: { bg: '#dc262622', text: '#dc2626' },
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
            <ShieldAlert className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">الإجراءات التأديبية</h1>
            <p className="text-sm text-slate-500">إدارة الإنذارات والجزاءات</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-sm">
          <Plus size={18} /> إجراء جديد
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBox label="إجمالي الإجراءات" value={actions.length} color="#6366f1" />
        <StatBox label="نشطة" value={actions.filter(a => a.status === 'active').length} color="#ef4444" />
        <StatBox label="إنذارات شفوية" value={actions.filter(a => a.type === 'verbal_warning').length} color="#f59e0b" />
        <StatBox label="إيقاف/فصل" value={actions.filter(a => a.type === 'suspension' || a.type === 'termination').length} color="#dc2626" />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-red-500" size={40} /></div>
      ) : actions.length === 0 ? (
        <div className="text-center py-16"><ShieldAlert size={40} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-500">لا توجد إجراءات تأديبية</p></div>
      ) : (
        <div className="grid gap-3">
          {actions.map((action) => {
            const emp = (action as any).employees;
            const tc = typeColors[action.type] || typeColors.verbal_warning;
            return (
              <div key={action.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tc.bg }}>
                    <AlertTriangle size={20} style={{ color: tc.text }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{emp?.full_name_ar || 'موظف'}</p>
                    <p className="text-xs text-slate-500 truncate">{action.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: tc.bg, color: tc.text }}>
                    {DISCIPLINARY_TYPE_LABELS[action.type]}
                  </span>
                  <span className="text-xs text-slate-400">{format(new Date(action.incident_date), 'd MMM yyyy', { locale: ar })}</span>
                  <button onClick={() => setSelected(action)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Eye size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <Modal title="إجراء تأديبي جديد" onClose={() => setShowCreate(false)}>
          <EmployeePicker value={form.employee_id} onChange={(id) => setForm({ ...form, employee_id: id })} />
          <FormField label="نوع الإجراء" required>
            <select value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as DisciplinaryType })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500">
              {Object.entries(DISCIPLINARY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </FormField>
          <FormField label="السبب" required>
            <input type="text" value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500" />
          </FormField>
          <FormField label="التفاصيل">
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500" />
          </FormField>
          <FormField label="الخطورة">
            <select value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg">
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="critical">حرجة</option>
            </select>
          </FormField>
          <FormField label="تاريخ الواقعة" required>
            <input type="date" value={form.incident_date}
              onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </FormField>
          <ModalActions onClose={() => setShowCreate(false)} onSubmit={handleCreate} submitLabel="تسجيل" color="red" />
        </Modal>
      )}

      {selected && (
        <Modal title="تفاصيل الإجراء التأديبي" onClose={() => setSelected(null)}>
          <DetailRow label="الموظف" value={(selected as any).employees?.full_name_ar} />
          <DetailRow label="النوع" value={DISCIPLINARY_TYPE_LABELS[selected.type]} />
          <DetailRow label="السبب" value={selected.reason} />
          {selected.description && <DetailRow label="التفاصيل" value={selected.description} />}
          <DetailRow label="الخطورة" value={selected.severity} />
          <DetailRow label="تاريخ الواقعة" value={format(new Date(selected.incident_date), 'd MMM yyyy', { locale: ar })} />
          <DetailRow label="الحالة" value={selected.status} />
        </Modal>
      )}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between py-1.5 border-b border-slate-50 last:border-0 gap-3">
      <span className="text-sm text-slate-500 flex-shrink-0">{label}</span>
      <span className="font-semibold text-slate-900 text-sm text-left">{value || '—'}</span>
    </div>
  );
}
