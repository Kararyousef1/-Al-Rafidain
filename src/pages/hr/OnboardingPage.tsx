/**
 * OnboardingPage - تعريف الموظف الجديد وإنهاء الخدمة (HR)
 */
import { useState, useEffect, useCallback } from 'react';
import { UserPlus, UserMinus, Loader2, CheckCircle, ListChecks } from 'lucide-react';
import { useUIStore } from '../../core/stores';
import { onboardingTaskService, employeeOnboardingService, offboardingRecordService, employeeService } from '../../services/sdk';
import { getErrorMessage } from '../../services/errors';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Modal, EmployeePicker, FormField, ModalActions } from './LoansPage';

export default function OnboardingPage() {
  const { addToast } = useUIStore();
  const [tab, setTab] = useState<'onboarding' | 'offboarding'>('onboarding');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employeeProgress, setEmployeeProgress] = useState<Record<string, any[]>>({});
  const [offboardingRecords, setOffboardingRecords] = useState<any[]>([]);
  const [showStartOnboard, setShowStartOnboard] = useState(false);
  const [showOffboard, setShowOffboard] = useState(false);

  const [onboardForm, setOnboardForm] = useState({ employee_id: '' });
  const [offboardForm, setOffboardForm] = useState({
    employee_id: '', last_working_day: format(new Date(), 'yyyy-MM-dd'),
    reason: '', exit_type: 'voluntary', notes: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const t = await onboardingTaskService.findActiveTasks();
      setTasks(t || []);

      const emp = await employeeOnboardingService.findAll({ orderBy: 'created_at', ascending: false });
      const employees = await employeeService.findAll({ orderBy: 'full_name_ar' });
      const empMap = new Map((employees || []).map((e: any) => [e.id, e]));
      const enriched = (emp || []).map((e: any) => ({ ...e, employees: empMap.get(e.employee_id) || null }));

      // تجميع حسب الموظف
      const grouped: Record<string, any[]> = {};
      (enriched || []).forEach((e: any) => {
        if (!grouped[e.employee_id]) grouped[e.employee_id] = [];
        grouped[e.employee_id].push(e);
      });
      setEmployeeProgress(grouped);

      const off = await offboardingRecordService.findAll({ orderBy: 'created_at', ascending: false });
      const offEnriched = (off || []).map((o: any) => ({ ...o, employees: empMap.get(o.employee_id) || null }));
      setOffboardingRecords(offEnriched);
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStartOnboard = async () => {
    if (!onboardForm.employee_id) {
      addToast('اختر موظف', 'warning');
      return;
    }
    try {
      // إنشاء سجل لكل مهمة
      const records = tasks.map((t) => ({
        employee_id: onboardForm.employee_id,
        task_id: t.id,
        status: 'pending',
      }));
      await employeeOnboardingService.upsert(records);
      addToast('بدأ تعريف الموظف', 'success');
      setShowStartOnboard(false);
      setOnboardForm({ employee_id: '' });
      await fetchData();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const handleToggleTask = async (recordId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await employeeOnboardingService.updateStatus(recordId, newStatus);
      await fetchData();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const handleOffboard = async () => {
    if (!offboardForm.employee_id || !offboardForm.reason) {
      addToast('يرجى ملء الحقول المطلوبة', 'warning');
      return;
    }
    try {
      await offboardingRecordService.createRecord({
        employee_id: offboardForm.employee_id,
        last_working_day: offboardForm.last_working_day,
        reason: offboardForm.reason,
        exit_type: offboardForm.exit_type,
        exit_interview_notes: offboardForm.notes,
      } as unknown as Record<string, unknown>);

      // تعطيل الموظف
      await employeeService.update(offboardForm.employee_id, { is_active: false, employment_status: 'terminated' } as unknown as Record<string, unknown>);

      addToast('تم تسجيل إنهاء الخدمة', 'success');
      setShowOffboard(false);
      setOffboardForm({ employee_id: '', last_working_day: format(new Date(), 'yyyy-MM-dd'), reason: '', exit_type: 'voluntary', notes: '' });
      await fetchData();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const employeeIds = Object.keys(employeeProgress);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <UserPlus className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">تعريف وإنهاء الخدمة</h1>
          <p className="text-sm text-slate-500">إدارة عملية استقبال وتوديع الموظفين</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {([['onboarding', 'التعريف (Onboarding)', UserPlus], ['offboarding', 'إنهاء الخدمة', UserMinus]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${tab === key ? 'text-violet-600 border-violet-600' : 'text-slate-500 border-transparent'}`}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      {tab === 'onboarding' && (
        <>
          <button onClick={() => setShowStartOnboard(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-colors mb-4">
            <UserPlus size={18} /> بدء تعريف موظف
          </button>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-violet-500" size={40} /></div>
          ) : employeeIds.length === 0 ? (
            <div className="text-center py-16"><ListChecks size={40} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-500">لا توجد عمليات تعريف جارية</p></div>
          ) : (
            <div className="grid gap-3">
              {employeeIds.map((empId) => {
                const empTasks = employeeProgress[empId];
                const empName = empTasks[0]?.employees?.full_name_ar || 'موظف';
                const completed = empTasks.filter((t: any) => t.status === 'completed').length;
                const progress = empTasks.length > 0 ? (completed / empTasks.length) * 100 : 0;
                return (
                  <div key={empId} className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-900">{empName}</p>
                        <p className="text-xs text-slate-500">{completed}/{empTasks.length} مهمة مكتملة</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${progress === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="space-y-1.5">
                      {empTasks.map((t: any) => (
                        <button key={t.id} onClick={() => handleToggleTask(t.id, t.status)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors text-right">
                          <CheckCircle size={16} className={t.status === 'completed' ? 'text-emerald-500' : 'text-slate-300'} />
                          <span className={`text-sm ${t.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {tasks.find((tk) => tk.id === t.task_id)?.title || 'مهمة'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'offboarding' && (
        <>
          <button onClick={() => setShowOffboard(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors mb-4">
            <UserMinus size={18} /> إنهاء خدمة موظف
          </button>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-rose-500" size={40} /></div>
          ) : offboardingRecords.length === 0 ? (
            <div className="text-center py-16"><UserMinus size={40} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-500">لا توجد حالات إنهاء خدمة</p></div>
          ) : (
            <div className="grid gap-3">
              {offboardingRecords.map((rec) => (
                <div key={rec.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{rec.employees?.full_name_ar}</p>
                      <p className="text-xs text-slate-500">{rec.employees?.employee_code} · {rec.exit_type === 'voluntary' ? 'استقالة' : rec.exit_type === 'involuntary' ? 'فصل' : 'تقاعد'}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-700">{format(new Date(rec.last_working_day), 'd MMM yyyy', { locale: ar })}</p>
                      <p className="text-xs text-slate-400">آخر يوم عمل</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 bg-slate-50 px-3 py-2 rounded-lg">{rec.reason}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showStartOnboard && (
        <Modal title="بدء تعريف موظف" onClose={() => setShowStartOnboard(false)}>
          <EmployeePicker value={onboardForm.employee_id} onChange={(id) => setOnboardForm({ employee_id: id })} />
          <p className="text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
            سيتم إنشاء {tasks.length} مهمة تعريف للموظف الجديد.
          </p>
          <ModalActions onClose={() => setShowStartOnboard(false)} onSubmit={handleStartOnboard} submitLabel="بدء" color="blue" />
        </Modal>
      )}

      {showOffboard && (
        <Modal title="إنهاء خدمة موظف" onClose={() => setShowOffboard(false)}>
          <EmployeePicker value={offboardForm.employee_id} onChange={(id) => setOffboardForm({ ...offboardForm, employee_id: id })} />
          <FormField label="آخر يوم عمل" required>
            <input type="date" value={offboardForm.last_working_day}
              onChange={(e) => setOffboardForm({ ...offboardForm, last_working_day: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </FormField>
          <FormField label="نوع الإنهاء">
            <select value={offboardForm.exit_type}
              onChange={(e) => setOffboardForm({ ...offboardForm, exit_type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg">
              <option value="voluntary">استقالة</option>
              <option value="involuntary">فصل</option>
              <option value="retirement">تقاعد</option>
              <option value="end_contract">انتهاء عقد</option>
            </select>
          </FormField>
          <FormField label="السبب" required>
            <textarea value={offboardForm.reason}
              onChange={(e) => setOffboardForm({ ...offboardForm, reason: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </FormField>
          <ModalActions onClose={() => setShowOffboard(false)} onSubmit={handleOffboard} submitLabel="تأكيد" color="red" />
        </Modal>
      )}
    </div>
  );
}
