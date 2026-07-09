/**
 * ExpensesPage - إدارة طلبات النفقات (HR)
 */
import { useState, useEffect, useCallback } from 'react';
import { Receipt, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useUIStore, useAuthStore } from '../../core/stores';
import { expenseRequestService, employeeService } from '../../services/sdk';
import { getErrorMessage } from '../../services/errors';
import type { ExpenseRequest, ExpenseStatus } from '../../shared/types/hrModules';
import { EXPENSE_STATUS_LABELS } from '../../shared/types/hrModules';
import { formatCurrency } from '../../utils/payrollUtils';

export default function ExpensesPage() {
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | ExpenseStatus>('all');

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await expenseRequestService.findAll({ orderBy: 'created_at', ascending: false });
      const employees = await employeeService.findAll({ orderBy: 'full_name_ar' });
      const empMap = new Map((employees || []).map((e: any) => [e.id, e]));
      const enriched = (data || []).map((e: any) => ({ ...e, employees: empMap.get(e.employee_id) || null }));
      setExpenses(enriched as unknown as ExpenseRequest[]);
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleApprove = async (expense: ExpenseRequest) => {
    try {
      // ربط الموافقة بالمستخدم الحالي (HR) وليس موظف عشوائي
      await expenseRequestService.approveRequest(expense.id, user?.id || '');
      addToast('تمت الموافقة', 'success');
      await fetchExpenses();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const handleReject = async (expense: ExpenseRequest) => {
    const reason = prompt('سبب الرفض:');
    if (reason === null) return;
    try {
      await expenseRequestService.rejectRequest(expense.id, reason);
      addToast('تم الرفض', 'success');
      await fetchExpenses();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#f59e0b22', text: '#f59e0b' },
    approved: { bg: '#10b98122', text: '#10b981' },
    rejected: { bg: '#ef444422', text: '#ef4444' },
    paid: { bg: '#6366f122', text: '#6366f1' },
    cancelled: { bg: '#64748b22', text: '#64748b' },
  };

  const filtered = filterStatus === 'all' ? expenses : expenses.filter((e) => e.status === filterStatus);
  const totalPending = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const totalApproved = expenses.filter(e => e.status === 'approved' || e.status === 'paid').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
            <Receipt className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">طلبات النفقات</h1>
            <p className="text-sm text-slate-500">مراجعة وموافقة طلبات الصرف</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-slate-900">{expenses.length}</p>
          <p className="text-xs text-slate-500">إجمالي الطلبات</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-slate-500">بانتظار الموافقة</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalApproved)}</p>
          <p className="text-xs text-slate-500">موافق عليه</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected', 'paid'] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${filterStatus === s ? 'bg-pink-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
            {s === 'all' ? 'الكل' : EXPENSE_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-pink-500" size={40} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16"><Receipt size={40} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-500">لا توجد طلبات نفقات</p></div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((expense) => {
            const emp = (expense as any).employees;
            const sc = statusColors[expense.status] || statusColors.pending;
            return (
              <div key={expense.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sc.bg }}>
                    <Receipt size={20} style={{ color: sc.text }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{expense.title}</p>
                    <p className="text-xs text-slate-500 truncate">{emp?.full_name_ar} · {expense.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-slate-900">{formatCurrency(expense.amount)}</p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
                    {EXPENSE_STATUS_LABELS[expense.status]}
                  </span>
                  {expense.status === 'pending' && (
                    <div className="flex gap-1">
                      <button onClick={() => handleApprove(expense)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"><CheckCircle size={16} /></button>
                      <button onClick={() => handleReject(expense)} className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"><XCircle size={16} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
