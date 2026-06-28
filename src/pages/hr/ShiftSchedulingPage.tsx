/**
 * ShiftSchedulingPage - جدولة الورديات (HR)
 */
import { useState, useEffect, useCallback } from 'react';
import { CalendarClock, Plus, Loader2, Sun, Moon, Sunrise } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUIStore } from '../../store';
import { getErrorMessage } from '../../lib/errors';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Modal, FormField, ModalActions, EmployeePicker } from './LoansPage';

type ShiftType = 'صباحي' | 'مسائي' | 'ليلي';

export default function ShiftSchedulingPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 6 }));
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({
    employee_id: '', shift_type: 'صباحي' as ShiftType,
    shift_date: format(new Date(), 'yyyy-MM-dd'), notes: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const weekEnd = addDays(weekStart, 7);
      const [{ data: emps }, { data: assigns }] = await Promise.all([
        supabase.from('employees').select('id, full_name_ar, employee_code').eq('is_active', true).order('full_name_ar'),
        supabase.from('shift_assignments')
          .select('*')
          .gte('shift_date', format(weekStart, 'yyyy-MM-dd'))
          .lt('shift_date', format(weekEnd, 'yyyy-MM-dd')),
      ]);
      setEmployees(emps || []);
      setAssignments(assigns || []);
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async () => {
    if (!form.employee_id || !form.shift_date) {
      addToast('يرجى ملء الحقول', 'warning');
      return;
    }
    try {
      const { error } = await supabase.from('shift_assignments').upsert({
        employee_id: form.employee_id,
        shift_type: form.shift_type,
        shift_date: form.shift_date,
        notes: form.notes,
      }, { onConflict: 'employee_id,shift_date' });
      if (error) throw error;
      addToast('تم تعيين الوردية', 'success');
      setShowAssign(false);
      setForm({ employee_id: '', shift_type: 'صباحي', shift_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
      await fetchData();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const getShiftForDay = (empId: string, date: Date): ShiftType | null => {
    const a = assignments.find((x) => x.employee_id === empId && isSameDay(new Date(x.shift_date), date));
    return a?.shift_type || null;
  };

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const shiftConfig: Record<ShiftType, { icon: any; color: string; bg: string }> = {
    'صباحي': { icon: Sun, color: '#f59e0b', bg: '#fef3c7' },
    'مسائي': { icon: Sunrise, color: '#6366f1', bg: '#e0e7ff' },
    'ليلي': { icon: Moon, color: '#6366f1', bg: '#c7d2fe' },
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <CalendarClock className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">جدولة الورديات</h1>
            <p className="text-sm text-slate-500">توزيع الموظفين على الورديات الأسبوعية</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50">السابق</button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 6 }))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50">اليوم</button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50">التالي</button>
          <button onClick={() => setShowAssign(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors">
            <Plus size={18} /> تعيين وردية
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-4">
        أسبوع: {format(weekStart, 'd MMM yyyy', { locale: ar })} ← {format(addDays(weekStart, 6), 'd MMM yyyy', { locale: ar })}
      </p>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-right min-w-[800px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-3 text-xs font-semibold text-slate-600 uppercase sticky right-0 bg-slate-50">الموظف</th>
                {days.map((d) => (
                  <th key={d.toISOString()} className="px-3 py-3 text-xs font-semibold text-slate-600 uppercase text-center">
                    <div>{format(d, 'EEEE', { locale: ar })}</div>
                    <div className="text-slate-400 font-normal">{format(d, 'd/M')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 sticky right-0 bg-white">
                    <p className="font-semibold text-slate-900 text-sm">{emp.full_name_ar}</p>
                    <p className="text-xs text-slate-400">{emp.employee_code}</p>
                  </td>
                  {days.map((d) => {
                    const shift = getShiftForDay(emp.id, d);
                    const cfg = shift ? shiftConfig[shift] : null;
                    const Icon = cfg?.icon;
                    return (
                      <td key={d.toISOString()} className="px-2 py-2 text-center">
                        {shift && cfg && Icon ? (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            <Icon size={12} />
                            {shift}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAssign && (
        <Modal title="تعيين وردية" onClose={() => setShowAssign(false)}>
          <EmployeePicker value={form.employee_id} onChange={(id) => setForm({ ...form, employee_id: id })} />
          <FormField label="الوردية" required>
            <select value={form.shift_type}
              onChange={(e) => setForm({ ...form, shift_type: e.target.value as ShiftType })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500">
              <option value="صباحي">صباحي (08:00 - 16:00)</option>
              <option value="مسائي">مسائي (16:00 - 00:00)</option>
              <option value="ليلي">ليلي (00:00 - 08:00)</option>
            </select>
          </FormField>
          <FormField label="التاريخ" required>
            <input type="date" value={form.shift_date}
              onChange={(e) => setForm({ ...form, shift_date: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </FormField>
          <FormField label="ملاحظات">
            <input type="text" value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </FormField>
          <ModalActions onClose={() => setShowAssign(false)} onSubmit={handleAssign} submitLabel="تعيين" color="blue" />
        </Modal>
      )}
    </div>
  );
}
