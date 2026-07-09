/**
 * RecruitmentPage - إدارة التوظيف والمتقدمين (HR)
 */
import { useState, useEffect, useCallback } from 'react';
import { Briefcase, Plus, Loader2, Eye, Users, X } from 'lucide-react';
import { useUIStore } from '../../core/stores';
import { jobPostingService, jobApplicationService } from '../../services/sdk';
import { getErrorMessage } from '../../services/errors';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { JobPosting, JobApplication, JobStatus, ApplicationStatus } from '../../shared/types/hrModules';
import { JOB_STATUS_LABELS, APPLICATION_STATUS_LABELS } from '../../shared/types/hrModules';
import { Modal, FormField, ModalActions } from './LoansPage';

export default function RecruitmentPage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', position: '', employment_type: 'full_time',
    salary_min: 0, salary_max: 0, vacancy_count: 1, closing_date: '',
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobPostingService.findAllPostings();
      setJobs((data || []) as JobPosting[]);
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleCreate = async () => {
    if (!form.title || !form.description) {
      addToast('يرجى إدخال العنوان والوصف', 'warning');
      return;
    }
    try {
      await jobPostingService.createPosting({
        ...form,
        salary_min: Number(form.salary_min) || null,
        salary_max: Number(form.salary_max) || null,
        status: 'open',
        posted_date: new Date().toISOString(),
      } as unknown as Record<string, unknown>);
      addToast('تم إنشاء إعلان الوظيفة', 'success');
      setShowCreate(false);
      setForm({ title: '', description: '', position: '', employment_type: 'full_time', salary_min: 0, salary_max: 0, vacancy_count: 1, closing_date: '' });
      await fetchJobs();
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const handleViewApplications = async (job: JobPosting) => {
    setSelectedJob(job);
    try {
      const data = await jobApplicationService.findByJob(job.id);
      setApplications((data || []) as JobApplication[]);
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const handleStatusChange = async (app: JobApplication, status: ApplicationStatus) => {
    try {
      await jobApplicationService.updateStatus(app.id, status);
      if (selectedJob) await handleViewApplications(selectedJob);
    } catch (err) {
      addToast(getErrorMessage(err), 'error');
    }
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    draft: { bg: '#64748b22', text: '#64748b' },
    open: { bg: '#10b98122', text: '#10b981' },
    closed: { bg: '#ef444422', text: '#ef4444' },
    filled: { bg: '#6366f122', text: '#6366f1' },
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <Briefcase className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">إدارة التوظيف</h1>
            <p className="text-sm text-slate-500">إعلانات الوظائف والطلبات الواردة</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-colors shadow-sm">
          <Plus size={18} /> وظيفة جديدة
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="animate-spin text-teal-500" size={40} /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16"><Briefcase size={40} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-500">لا توجد إعلانات وظائف</p></div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => {
            const sc = statusColors[job.status] || statusColors.draft;
            return (
              <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={20} className="text-teal-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 truncate">{job.title}</p>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.text }}>
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{job.position} · {job.employment_type} · {job.vacancy_count} شاغر</p>
                  </div>
                </div>
                <button onClick={() => handleViewApplications(job)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100">
                  <Users size={14} /> المتقدمون
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <Modal title="وظيفة جديدة" onClose={() => setShowCreate(false)}>
          <FormField label="عنوان الوظيفة" required>
            <input type="text" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
          </FormField>
          <FormField label="المسمى الوظيفي">
            <input type="text" value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </FormField>
          <FormField label="الوصف" required>
            <textarea value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="نوع التوظيف">
              <select value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg">
                <option value="full_time">دوام كامل</option>
                <option value="part_time">دوام جزئي</option>
                <option value="contract">عقد</option>
                <option value="temporary">مؤقت</option>
              </select>
            </FormField>
            <FormField label="عدد الشواغر">
              <input type="number" min="1" value={form.vacancy_count}
                onChange={(e) => setForm({ ...form, vacancy_count: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="الراتب من">
              <input type="number" value={form.salary_min}
                onChange={(e) => setForm({ ...form, salary_min: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </FormField>
            <FormField label="الراتب إلى">
              <input type="number" value={form.salary_max}
                onChange={(e) => setForm({ ...form, salary_max: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </FormField>
          </div>
          <ModalActions onClose={() => setShowCreate(false)} onSubmit={handleCreate} submitLabel="نشر" color="blue" />
        </Modal>
      )}

      {selectedJob && (
        <Modal title={`متقدمو: ${selectedJob.title}`} onClose={() => setSelectedJob(null)}>
          {applications.length === 0 ? (
            <div className="text-center py-8 text-slate-400">لا يوجد متقدمون بعد</div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {applications.map((app) => (
                <div key={app.id} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{app.applicant_name}</p>
                      <p className="text-xs text-slate-500">{app.applicant_email} · {format(new Date(app.applied_at), 'd MMM yyyy', { locale: ar })}</p>
                    </div>
                    {app.cv_url && (
                      <a href={app.cv_url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 underline">عرض السيرة</a>
                    )}
                  </div>
                  <select value={app.status}
                    onChange={(e) => handleStatusChange(app, e.target.value as ApplicationStatus)}
                    className="w-full px-2 py-1 border border-slate-200 rounded text-xs">
                    {Object.entries(APPLICATION_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
