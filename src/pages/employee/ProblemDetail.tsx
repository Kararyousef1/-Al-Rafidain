import { useState, useEffect } from 'react';
import { ChevronRight, Send, Clock, CheckCircle, AlertCircle, User, Bot, Tag, Loader } from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Problem } from '../../types';

const statusLabels: Record<string, string> = {
  pending: 'في الانتظار',
  in_progress: 'قيد المعالجة',
  resolved: 'محلولة',
  closed: 'مغلقة',
};
const severityLabels: Record<string, string> = {
  low: 'منخفض', medium: 'متوسط', high: 'عالٍ', critical: 'حرج',
};

interface ProblemDetailProps {
  problemId: string;
  onBack?: () => void;
}

export default function ProblemDetail({ problemId, onBack }: ProblemDetailProps) {
  const { user } = useAuthStore();
  const { setActiveView, addToast } = useUIStore();
  const [problem, setProblem] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProblemData = async () => {
      setLoading(true);
      try {
        // جلب تفاصيل المشكلة
        const { data: probData, error: probErr } = await supabase
          .from('incidents')
          .select('*')
          .eq('id', problemId)
          .single();

        if (probErr) throw probErr;

        // جلب أسماء الموظفين يدوياً لتجنب مشاكل الربط في قاعدة البيانات
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', [probData.reported_by, probData.assigned_to].filter(Boolean));

        const reporter = profilesData?.find(p => p.id === probData.reported_by);
        const assigned = profilesData?.find(p => p.id === probData.assigned_to);

        setProblem({
          ...probData,
          employeeName: probData.is_anonymous ? undefined : (reporter?.full_name || 'بدون اسم'),
          assignedTo: assigned?.full_name || 'غير محدد',
          createdAt: probData.created_at,
          category: probData.category,
          aiAnalysis: probData.ai_analysis,
        });

        // جلب التعليقات
        const { data: commData, error: commErr } = await supabase
          .from('incident_comments')
          .select('*, profiles:user_id(full_name, role)')
          .eq('incident_id', problemId)
          .order('created_at', { ascending: true });

        if (commErr) throw commErr;
        setComments(commData || []);
      } catch (err) {
        console.error('Error fetching problem:', err);
      } finally {
        setLoading(false);
      }
    };

    if (problemId) fetchProblemData();
  }, [problemId]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('incident_comments').insert({
        incident_id: problemId,
        user_id: user.id,
        text: comment
      });
      if (error) throw error;
      
      // إضافة التعليق محلياً لتحديث الواجهة فوراً
      setComments(prev => [...prev, { id: Date.now().toString(), text: comment, created_at: new Date().toISOString(), profiles: { full_name: user?.name || user?.full_name || 'مستخدم', role: user.role } }]);
      setComment('');
      addToast('تم إضافة تعليقك بنجاح', 'success');
    } catch (err) {
      console.error(err);
      addToast('حدث خطأ أثناء إضافة التعليق', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const { error } = await supabase.from('incidents').update({ status }).eq('id', problemId);
      if (error) throw error;
      setProblem((prev: any) => ({ ...prev, status }));
      addToast(`تم تغيير الحالة إلى ${statusLabels[status]}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('فشل تحديث الحالة', 'error');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-slate-500 gap-3">
      <Loader className="animate-spin" />
      <span className="font-medium">جاري تحميل تفاصيل المشكلة...</span>
    </div>
  );

  if (!problem) return (
    <div className="text-center py-12">
      <p className="text-slate-500">المشكلة غير موجودة</p>
      <Button onClick={() => setActiveView('employee-problems')} variant="ghost" className="mt-3">رجوع</Button>
    </div>
  );

  const sentimentColor = problem.aiAnalysis?.sentiment === 'negative' ? 'text-red-600 bg-red-50' :
    problem.aiAnalysis?.sentiment === 'positive' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50';

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack || (() => setActiveView(user?.role === 'hr' ? 'hr-problems' : 'employee-problems'))}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={problem.status === 'resolved' || problem.status === 'closed' ? 'success' : problem.status === 'in_progress' ? 'info' : 'warning'}>
              {statusLabels[problem.status]}
            </Badge>
            <Badge variant={problem.severity === 'critical' || problem.severity === 'high' ? 'danger' : 'warning'} dot>
              {severityLabels[problem.severity]}
            </Badge>
            {problem.isAnonymous && <Badge variant="neutral">مجهول الهوية</Badge>}
          </div>
        </div>
      </div>

      {/* Main info */}
      <Card>
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">{problem.title}</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{problem.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Clock, label: 'تاريخ الرفع', value: problem.createdAt ? format(new Date(problem.createdAt), 'dd MMM yyyy', { locale: ar }) : 'غير محدد' },
            { icon: User, label: 'الموظف', value: problem.isAnonymous ? 'مجهول' : (problem.employeeName || 'غير محدد') },
            { icon: Tag, label: 'الفئة', value: { technical: 'تقني', hr: 'موارد بشرية', management: 'إدارة', workplace: 'بيئة عمل', salary: 'رواتب', other: 'أخرى' }[problem.category] },
            { icon: CheckCircle, label: 'المسؤول', value: problem.assignedTo || 'لم يُكلَّف' },
          ].map((info, i) => {
            const Icon = info.icon;
            return (
              <div key={i} className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon size={12} className="text-slate-400" />
                  <span className="text-xs text-slate-400">{info.label}</span>
                </div>
                <p className="text-sm font-semibold text-slate-700">{info.value}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* AI Analysis */}
      {problem.aiAnalysis && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot size={15} className="text-white" />
            </div>
            <h3 className="font-bold text-slate-800">تحليل الذكاء الاصطناعي</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className={`rounded-xl px-4 py-3 inline-flex items-center gap-2 ${sentimentColor}`}>
                <span className="text-sm font-bold">
                  {problem.aiAnalysis.sentiment === 'negative' ? '😟 مشاعر سلبية' :
                   problem.aiAnalysis.sentiment === 'positive' ? '😊 مشاعر إيجابية' : '😐 مشاعر محايدة'}
                </span>
                <span className="text-sm font-bold">({Math.round(Math.abs(problem.aiAnalysis.sentimentScore) * 100)}%)</span>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">مستوى الاستعجال</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                    <div
                      className={`h-full rounded-full ${problem.aiAnalysis.urgencyLevel >= 8 ? 'bg-red-500' : problem.aiAnalysis.urgencyLevel >= 5 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${problem.aiAnalysis.urgencyLevel * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{problem.aiAnalysis.urgencyLevel}/10</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">وقت الحل المتوقع</p>
                <p className="text-sm font-semibold text-slate-700">⏱ {problem.aiAnalysis.predictedResolutionTime}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-2">الإجراءات المقترحة</p>
              <ul className="space-y-2">
                {problem.aiAnalysis.suggestedActions.map((action, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold flex-shrink-0">{idx + 1}</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {problem.aiAnalysis.tags && (
            <div className="flex flex-wrap gap-2 mt-4">
              {problem.aiAnalysis.tags.map(tag => (
                <span key={tag} className="bg-indigo-50 text-indigo-600 text-xs px-2.5 py-1 rounded-full font-medium">#{tag}</span>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Status change (HR only) */}
      {user?.role === 'hr' && (
        <Card>
          <h3 className="font-bold text-slate-700 text-sm mb-3">تغيير حالة المشكلة</h3>
          <div className="flex flex-wrap gap-2">
            {(['pending', 'in_progress', 'resolved', 'closed'] as const).map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  problem.status === status
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline */}
      {problem.timeline && problem.timeline.length > 0 && (
        <Card>
          <h3 className="font-bold text-slate-800 mb-4">📅 سجل المتابعة</h3>
          <div className="space-y-4 relative">
            <div className="absolute right-4 top-0 bottom-0 w-px bg-slate-100" />
            {problem.timeline.map((event) => (
              <div key={event.id} className="flex items-start gap-4 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  event.type === 'created' ? 'bg-blue-100' :
                  event.type === 'resolved' ? 'bg-emerald-100' :
                  event.type === 'assigned' ? 'bg-purple-100' : 'bg-slate-100'
                }`}>
                  {event.type === 'created' ? <AlertCircle size={14} className="text-blue-600" /> :
                   event.type === 'resolved' ? <CheckCircle size={14} className="text-emerald-600" /> :
                   <Clock size={14} className="text-purple-600" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800">{event.event}</p>
                      <p className="text-xs text-slate-400">{event.timestamp ? format(new Date(event.timestamp), 'dd MMM HH:mm', { locale: ar }) : ''}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">بواسطة: {event.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Comments */}
      <Card>
        <h3 className="font-bold text-slate-800 mb-4">💬 التعليقات ({comments.length})</h3>
        <div className="space-y-4 mb-4">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">لا توجد تعليقات بعد</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                  c.profiles?.role === 'hr' ? 'bg-emerald-500' :
                  c.profiles?.role === 'admin' ? 'bg-orange-500' : 'bg-indigo-500'
                }`}>
                  {(c.profiles?.full_name || 'U').charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">{c.profiles?.full_name}</p>
                    <Badge variant={c.profiles?.role === 'hr' ? 'success' : c.profiles?.role === 'admin' ? 'warning' : 'primary'} size="sm">
                      {c.profiles?.role === 'hr' ? 'موارد بشرية' : c.profiles?.role === 'admin' ? 'مشرف' : 'موظف'}
                    </Badge>
                      <p className="text-xs text-slate-400">{c.created_at ? format(new Date(c.created_at), 'dd MMM HH:mm', { locale: ar }) : ''}</p>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 bg-slate-50 rounded-xl p-3">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddComment} className="flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(user?.name || user?.full_name || 'U').charAt(0)}
          </div>
          <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="أضف تعليقاً..."
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!comment.trim() || submitting}
              className="p-1.5 rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
            >
              <Send size={13} />
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
