import { useState, useEffect } from 'react';
import { Plus, Search, ChevronLeft, AlertCircle, Loader } from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Problem } from '../../types';
import { isLocalUser } from '../../lib/utils';

const statusLabels: Record<string, string> = {
  pending: 'في الانتظار',
  in_progress: 'قيد المعالجة',
  resolved: 'محلولة',
  closed: 'مغلقة',
};

const statusVariants: Record<string, any> = {
  pending: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'neutral',
};

const severityLabels: Record<string, string> = {
  low: 'منخفض',
  medium: 'متوسط',
  high: 'عالٍ',
  critical: 'حرج',
};

const severityVariants: Record<string, any> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
};

const categoryLabels: Record<string, string> = {
  technical: 'تقني',
  hr: 'موارد بشرية',
  management: 'إدارة',
  workplace: 'بيئة عمل',
  salary: 'الرواتب',
  other: 'أخرى',
};

interface ProblemsListProps {
  isHR?: boolean;
  onSelectProblem?: (id: string) => void;
  onNewProblem?: () => void;
}

export default function ProblemsList({ isHR = false, onSelectProblem, onNewProblem }: ProblemsListProps) {
  const { user } = useAuthStore();
  const { setActiveView } = useUIStore();
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      
      // التحقق من أن المستخدم محلي (حساب تجريبي)
      if (isLocalUser(user?.id)) {
        // استخدام بيانات وهمية للمستخدم المحلي
        const mockProblems = [
          {
            id: '1',
            title: 'مشكلة في جهاز الكمبيوتر',
            description: 'الجهاز لا يعمل بشكل صحيح ويحتاج إلى صيانة',
            category: 'technical',
            severity: 'medium',
            status: 'in_progress',
            isAnonymous: false,
            employeeId: user?.id,
            employeeName: user?.full_name || 'موظف',
            department: 'تقنية المعلومات',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            aiAnalysis: { urgencyLevel: 5 },
          },
          {
            id: '2',
            title: 'طلب إجازة سنوية',
            description: 'أرغب في أخذ إجازة سنوية لمدة 5 أيام',
            category: 'hr',
            severity: 'low',
            status: 'resolved',
            isAnonymous: false,
            employeeId: user?.id,
            employeeName: user?.full_name || 'موظف',
            department: 'الموارد البشرية',
            createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            aiAnalysis: { urgencyLevel: 3 },
          },
          {
            id: '3',
            title: 'مشكلة في الشبكة',
            description: 'انقطاع الإنترنت بشكل متكرر',
            category: 'technical',
            severity: 'high',
            status: 'pending',
            isAnonymous: false,
            employeeId: user?.id,
            employeeName: user?.full_name || 'موظف',
            department: 'تقنية المعلومات',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            aiAnalysis: { urgencyLevel: 7 },
          },
        ];
        setProblems(mockProblems);
        setLoading(false);
        return;
      }
      
      try {
        let query = supabase.from('incidents').select('*').order('created_at', { ascending: false });

        if (!isHR) {
          query = query.eq('reported_by', user?.id);
        }

        const [{ data, error }, { data: profiles }] = await Promise.all([
          query,
          supabase.from('profiles').select('id, full_name, email, department')
        ]);

        if (error) throw error;

        const mapped = data.map((d: any) => {
          const reporter = profiles?.find((p: any) => p.id === d.reported_by);
          return {
          id: d.id,
          title: d.title,
          description: d.description,
          category: d.category,
          severity: d.severity,
          status: d.status,
          isAnonymous: d.is_anonymous,
          employeeId: d.reported_by,
            employeeName: d.is_anonymous ? undefined : (reporter?.full_name || 'بدون اسم'),
            department: reporter?.department,
          createdAt: d.created_at,
          aiAnalysis: d.ai_analysis,
          };
        });
        setProblems(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProblems();
  }, [user, isHR]);

  const filteredProblems = problems.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterSeverity !== 'all' && p.severity !== filterSeverity) return false;
    if (search && !p.title.includes(search) && !p.description.includes(search)) return false;
    return true;
  });

  const handleSelect = (p: Problem) => {
    if (onSelectProblem) {
      onSelectProblem(p.id);
    } else {
      setActiveView(`problem-detail-${p.id}`);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {isHR ? 'المشاكل المرفوعة من الموظفين' : 'مشاكلي المرفوعة'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{filteredProblems.length} مشكلة</p>
        </div>
        {!isHR && (
          <Button
            size="sm"
            icon={<Plus size={15} />}
            iconPosition="left"
            onClick={onNewProblem || (() => setActiveView('new-problem'))}
          >
            رفع مشكلة جديدة
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="بحث في المشاكل..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={15} />}
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
        >
          <option value="all">جميع الحالات</option>
          <option value="pending">في الانتظار</option>
          <option value="in_progress">قيد المعالجة</option>
          <option value="resolved">محلولة</option>
          <option value="closed">مغلقة</option>
        </select>
        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
        >
          <option value="all">جميع الأولويات</option>
          <option value="critical">حرج</option>
          <option value="high">عالٍ</option>
          <option value="medium">متوسط</option>
          <option value="low">منخفض</option>
        </select>
      </div>

      {/* Summary cards */}
      {isHR && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'الكل', value: problems.length, color: 'bg-slate-100 text-slate-700', filter: 'all' },
            { label: 'في الانتظار', value: problems.filter(p => p.status === 'pending').length, color: 'bg-amber-100 text-amber-700', filter: 'pending' },
            { label: 'قيد المعالجة', value: problems.filter(p => p.status === 'in_progress').length, color: 'bg-blue-100 text-blue-700', filter: 'in_progress' },
            { label: 'محلولة', value: problems.filter(p => p.status === 'resolved').length, color: 'bg-emerald-100 text-emerald-700', filter: 'resolved' },
          ].map((s, i) => (
            <button
              key={i}
              onClick={() => setFilterStatus(s.filter)}
              className={`rounded-xl p-3 text-center transition-all cursor-pointer hover:opacity-80 ${s.color} ${filterStatus === s.filter ? 'ring-2 ring-offset-1 ring-indigo-400' : ''}`}
            >
              <p className="text-xl font-extrabold">{s.value}</p>
              <p className="text-xs font-medium mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-48 text-slate-500 gap-3">
            <Loader className="animate-spin" />
            <span className="font-medium text-sm">جاري تحميل المشاكل...</span>
          </div>
        ) : filteredProblems.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-slate-400">
              <AlertCircle size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">لا توجد مشاكل مرفوعة حتى الآن</p>
              {!isHR && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={onNewProblem || (() => setActiveView('new-problem'))}
                  icon={<Plus size={14} />}
                  iconPosition="left"
                >
                  رفع مشكلة جديدة
                </Button>
              )}
            </div>
          </Card>
        ) : (
          filteredProblems.map(problem => (
            <div
              key={problem.id}
              onClick={() => handleSelect(problem)}
              className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md cursor-pointer transition-all duration-200 group hover:border-indigo-100"
            >
              <div className="flex items-start gap-4">
                {/* Severity indicator */}
                <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${
                  problem.severity === 'critical' ? 'bg-red-500' :
                  problem.severity === 'high' ? 'bg-orange-500' :
                  problem.severity === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {problem.isAnonymous && (
                          <Badge variant="neutral" size="sm">مجهول</Badge>
                        )}
                        <Badge variant="neutral" size="sm">{categoryLabels[problem.category]}</Badge>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                        {problem.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{problem.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge variant={statusVariants[problem.status]} size="sm">
                        {statusLabels[problem.status]}
                      </Badge>
                      <Badge variant={severityVariants[problem.severity]} size="sm" dot>
                        {severityLabels[problem.severity]}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {isHR && problem.employeeName && !problem.isAnonymous && (
                        <span>👤 {problem.employeeName}</span>
                      )}
                      {isHR && problem.department && (
                        <span>🏢 {problem.department}</span>
                      )}
                      <span>📅 {problem.createdAt ? format(new Date(problem.createdAt), 'dd MMM yyyy', { locale: ar }) : 'غير محدد'}</span>
                      {problem.comments && problem.comments.length > 0 && (
                        <span>💬 {problem.comments.length} تعليق</span>
                      )}
                    </div>
                    {problem.aiAnalysis && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">🤖 استعجال:</span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              problem.aiAnalysis.urgencyLevel >= 8 ? 'bg-red-500' :
                              problem.aiAnalysis.urgencyLevel >= 5 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${problem.aiAnalysis.urgencyLevel * 10}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{problem.aiAnalysis.urgencyLevel}/10</span>
                      </div>
                    )}
                    <ChevronLeft size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
