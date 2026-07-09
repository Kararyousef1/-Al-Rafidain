/**
 * ════════════════════════════════════════════════════════════════
 *  PerformancePage - إدارة تقييم الأداء (HR)
 * ════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Plus, Loader2, Eye, Star, Target, Calendar } from 'lucide-react';
import { useUIStore } from '../../core/stores';
import { performanceCycleService, performanceReviewService, employeeService } from '../../services/sdk';
import { getErrorMessage } from '../../services/errors';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { PerformanceCycle, PerformanceReview } from '../../shared/types/hrModules';
import { REVIEW_STATUS_LABELS } from '../../shared/types/hrModules';
import { Modal, FormField, ModalActions, EmployeePicker } from './LoansPage';

export default function PerformancePage() {
  const { addToast } = useUIStore();
  const [tab, setTab] = useState<'cycles' | 'reviews'>('cycles');
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  const [cycleForm, setCycleForm] = useState({
    name: '', description: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd'),
    review_period: 'quarterly',
  });

  const [reviewForm, setReviewForm] = useState({
    cycle_id: '', employee_id: '', reviewer_id: '',
    overall_score: 75, strengths: '', improvements: '', comments: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, r] = await Promise.all([
        performanceCycleService.findAllCycles(),
        performanceReviewService.findAllReviews(),
      ]);
      // Enrich reviews with employee and cycle names
      const employees = await employeeService.findAll({ orderBy: 'full_name_ar' });
      const empMap = new Map((employees || []).map((e: any) => [e.id, e]));
      const cycles = (c || []) as PerformanceCycle[];
      const cycleNameMap = new Map(cycles.map((cy: any) => [cy.id, cy]));
      const enriched = (r || []).map((review: any) => ({
        ...review,
        employees: empMap.get(review.employee_id) || null,
        performance_cycles: cycleNameMap.get(review.cycle_id) || null,
      }));
      setCycles(cycles);
      setReviews(enriched as unknown as PerformanceReview[]);
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateCycle = async () => {
    if (!cycleForm.name) { addToast('يرجى إدخال الاسم', 'warning'); return; }
    try {
      await performanceCycleService.createCycle({ ...cycleForm, status: 'draft' } as unknown as Record<string, unknown>);
      addToast('تم إنشاء دورة التقييم', 'success');
      setShowCreateCycle(false);
      setCycleForm({ name: '', description: '', start_date: format(new Date(), 'yyyy-MM-dd'), end_date: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), 'yyyy-MM-dd'), review_period: 'quarterly' });
      await fetchData();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const handleCreateReview = async () => {
    if (!reviewForm.cycle_id || !reviewForm.employee_id || !reviewForm.reviewer_id) {
      addToast('يرجى اختيار الدورة والموظف والمقيّم', 'warning');
      return;
    }
    try {
      await performanceReviewService.createReview({
        cycle_id: reviewForm.cycle_id,
        employee_id: reviewForm.employee_id,
        reviewer_id: reviewForm.reviewer_id,
        overall_score: Number(reviewForm.overall_score),
        strengths: reviewForm.strengths,
        improvements: reviewForm.improvements,
        comments: reviewForm.comments,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      } as unknown as Record<string, unknown>);
      addToast('تم إنشاء التقييم', 'success');
      setShowCreateReview(false);
      setReviewForm({ cycle_id: '', employee_id: '', reviewer_id: '', overall_score: 75, strengths: '', improvements: '', comments: '' });
      await fetchData();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const handleCompleteReview = async (review: PerformanceReview) => {
    try {
      await performanceReviewService.updateReviewStatus(review.id, 'completed');
      addToast('تم إكمال التقييم', 'success');
      await fetchData();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <TrendingUp className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">تقييم الأداء</h1>
            <p className="text-sm text-slate-500">إدارة دورات ونتائج التقييم</p>
          </div>
        </div>
        {tab === 'cycles' ? (
          <button onClick={() => setShowCreateCycle(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-sm">
            <Plus size={18} /> دورة جديدة
          </button>
        ) : (
          <button onClick={() => setShowCreateReview(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-sm">
            <Plus size={18} /> تقييم جديد
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {([['cycles', 'دورات التقييم', Calendar], ['reviews', 'التقييمات', Star]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition-colors ${
              tab === key ? 'text-blue-600 border-blue-600' : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
      ) : tab === 'cycles' ? (
        cycles.length === 0 ? (
          <EmptyState icon={Calendar} title="لا توجد دورات تقييم" />
        ) : (
          <div className="grid gap-3">
            {cycles.map((cycle) => (
              <div key={cycle.id} className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900">{cycle.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                        {REVIEW_STATUS_LABELS[cycle.status]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{cycle.description || 'بدون وصف'}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {format(new Date(cycle.start_date), 'd MMM yyyy', { locale: ar })} ← {format(new Date(cycle.end_date), 'd MMM yyyy', { locale: ar })}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                    {cycle.review_period}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        reviews.length === 0 ? (
          <EmptyState icon={Star} title="لا توجد تقييمات" />
        ) : (
          <div className="grid gap-3">
            {reviews.map((review) => {
              const emp = (review as any).employees;
              const cycle = (review as any).performance_cycles;
              const scoreColor = review.overall_score >= 85 ? '#10b981' : review.overall_score >= 70 ? '#f59e0b' : '#ef4444';
              return (
                <div key={review.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${scoreColor}22` }}>
                      <Star size={20} style={{ color: scoreColor }} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{emp?.full_name_ar || 'موظف'}</p>
                      <p className="text-xs text-slate-500">{cycle?.name || 'دورة تقييم'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold" style={{ color: scoreColor }}>{review.overall_score}%</p>
                      <span className="text-xs text-slate-400">النتيجة</span>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600">
                      {REVIEW_STATUS_LABELS[review.status]}
                    </span>
                    {review.status !== 'completed' && (
                      <button onClick={() => handleCompleteReview(review)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-100">
                        إكمال
                      </button>
                    )}
                    <button onClick={() => setSelectedReview(review)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Eye size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {showCreateCycle && (
        <Modal title="دورة تقييم جديدة" onClose={() => setShowCreateCycle(false)}>
          <FormField label="اسم الدورة" required>
            <input type="text" value={cycleForm.name}
              onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </FormField>
          <FormField label="الوصف">
            <textarea value={cycleForm.description}
              onChange={(e) => setCycleForm({ ...cycleForm, description: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="من تاريخ" required>
              <input type="date" value={cycleForm.start_date}
                onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </FormField>
            <FormField label="إلى تاريخ" required>
              <input type="date" value={cycleForm.end_date}
                onChange={(e) => setCycleForm({ ...cycleForm, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </FormField>
          </div>
          <FormField label="فترة التقييم">
            <select value={cycleForm.review_period}
              onChange={(e) => setCycleForm({ ...cycleForm, review_period: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg">
              <option value="monthly">شهري</option>
              <option value="quarterly">ربع سنوي</option>
              <option value="semi_annual">نصف سنوي</option>
              <option value="annual">سنوي</option>
            </select>
          </FormField>
          <ModalActions onClose={() => setShowCreateCycle(false)} onSubmit={handleCreateCycle} submitLabel="إنشاء" color="blue" />
        </Modal>
      )}

      {showCreateReview && (
        <Modal title="تقييم جديد" onClose={() => setShowCreateReview(false)}>
          <FormField label="الدورة" required>
            <select value={reviewForm.cycle_id}
              onChange={(e) => setReviewForm({ ...reviewForm, cycle_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">اختر دورة...</option>
              {cycles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <EmployeePicker value={reviewForm.employee_id} onChange={(id) => setReviewForm({ ...reviewForm, employee_id: id })} />
          <EmployeePicker value={reviewForm.reviewer_id} onChange={(id) => setReviewForm({ ...reviewForm, reviewer_id: id })} />
          <FormField label="النتيجة الإجمالية (%)">
            <input type="number" min="0" max="100" value={reviewForm.overall_score}
              onChange={(e) => setReviewForm({ ...reviewForm, overall_score: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </FormField>
          <FormField label="نقاط القوة">
            <textarea value={reviewForm.strengths}
              onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </FormField>
          <FormField label="نقاط التحسين">
            <textarea value={reviewForm.improvements}
              onChange={(e) => setReviewForm({ ...reviewForm, improvements: e.target.value })}
              rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </FormField>
          <ModalActions onClose={() => setShowCreateReview(false)} onSubmit={handleCreateReview} submitLabel="إنشاء" color="blue" />
        </Modal>
      )}

      {selectedReview && (
        <Modal title="تفاصيل التقييم" onClose={() => setSelectedReview(null)}>
          <DetailRow label="الموظف" value={(selectedReview as any).employees?.full_name_ar} />
          <DetailRow label="الدورة" value={(selectedReview as any).performance_cycles?.name} />
          <DetailRow label="النتيجة" value={`${selectedReview.overall_score}%`} />
          <DetailRow label="الحالة" value={REVIEW_STATUS_LABELS[selectedReview.status]} />
          {selectedReview.strengths && <DetailRow label="نقاط القوة" value={selectedReview.strengths} />}
          {selectedReview.improvements && <DetailRow label="نقاط التحسين" value={selectedReview.improvements} />}
          {selectedReview.comments && <DetailRow label="ملاحظات" value={selectedReview.comments} />}
        </Modal>
      )}
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

function EmptyState({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        <Icon size={28} className="text-slate-400" />
      </div>
      <p className="font-semibold text-slate-700">{title}</p>
    </div>
  );
}
