/**
 * ════════════════════════════════════════════════════════════════
 *  ProblemDetail - تفاصيل البلاغ (نسخة مُصلحة)
 *  ════════════════════════════════════════════════════════════════
 *
 *  🔧 الإصلاحات المُطبّقة:
 *  ✅ 4 استخدام any → 0
 *  ✅ metadata?: any → Record<string, unknown>
 *  ✅ user: any → User
 *  ✅ (update: any) → RealtimeUpdate
 *  ✅ key as any → ProblemStatus
 *  ✅ تنظيف markdown artifacts + addToast المكسور
 *  ✅ catch blocks → getErrorMessage
 *  ════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowRight, Clock, User, MessageSquare, Send, Paperclip,
  CheckCircle, XCircle, TrendingUp,
  Sparkles, Calendar, MapPin,
  AlertCircle, Loader2, Check, ChevronDown,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import {
  fetchProblemById, fetchComments, addComment,
  updateProblemStatus, subscribeToProblemUpdates,
  type CommentDetail, type ProblemDetail as ProblemDetailType,
} from '../../sdk/problems';
import type { User } from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { getErrorMessage } from '../../lib/errors';

// ════════════════════════════════════════════════════
// أنواع البيانات
// ════════════════════════════════════════════════════

type ProblemStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';
type ProblemSeverity = 'low' | 'medium' | 'high' | 'critical';

interface TimelineEvent {
  id: string;
  type: 'created' | 'status_changed' | 'commented' | 'assigned' | 'resolved' | 'closed';
  description: string;
  actor_name: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ProblemDetailUI {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: ProblemSeverity;
  status: ProblemStatus;
  is_anonymous: boolean;
  user_id?: string;
  created_at: string;
  updated_at?: string;
  ai_analysis?: {
    urgencyLevel: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    suggestedAction?: string;
    keywords?: string[];
    similarIssues?: number;
    estimatedResolutionTime?: string;
  };
  comments?: CommentDetail[];
  timeline?: TimelineEvent[];
  employee_name?: string;
  department?: string;
  position?: string;
  email?: string;
}

interface RealtimeUpdate {
  type?: string;
  data?: Record<string, unknown>;
}

// ════════════════════════════════════════════════════
// ثوابت
// ════════════════════════════════════════════════════

const STATUS_CONFIG: Record<ProblemStatus, { label: string; icon: typeof Clock; color: string; bg: string; border: string }> = {
  pending: { label: 'معلقة', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  in_progress: { label: 'قيد المعالجة', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  resolved: { label: 'محلولة', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  closed: { label: 'مغلقة', icon: XCircle, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
};

const SEVERITY_CONFIG: Record<ProblemSeverity, { label: string; color: string; textColor: string; bgLight: string }> = {
  low: { label: 'منخفضة', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50' },
  medium: { label: 'متوسطة', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50' },
  high: { label: 'عالية', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50' },
  critical: { label: 'حرجة', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50' },
};

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  technical: { label: 'تقني', icon: '💻' },
  hr: { label: 'موارد بشرية', icon: '👥' },
  management: { label: 'إدارة', icon: '📊' },
  workplace: { label: 'بيئة عمل', icon: '🏢' },
  salary: { label: 'رواتب', icon: '💰' },
  safety: { label: 'سلامة', icon: '🛡️' },
  other: { label: 'أخرى', icon: '📝' },
};

// ════════════════════════════════════════════════════
// Mock Data Helper
// ════════════════════════════════════════════════════

const getMockProblem = (id: string, user: User | null): ProblemDetailUI => ({
  id,
  title: 'مشكلة في جهاز الكمبيوتر',
  description: 'الجهاز لا يعمل بشكل صحيح ويحتاج إلى صيانة عاجلة.',
  category: 'technical',
  severity: 'high',
  status: 'in_progress',
  is_anonymous: false,
  employee_name: user?.full_name || 'أحمد محمد',
  department: user?.department || 'تقنية المعلومات',
  created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  ai_analysis: {
    urgencyLevel: 7,
    sentiment: 'negative',
    suggestedAction: 'إحالة لقسم الصيانة',
    keywords: ['كمبيوتر', 'صيانة'],
    similarIssues: 3,
    estimatedResolutionTime: '2-3 أيام',
  },
  comments: [{
    id: '1', incident_id: id, user_id: 'hr-1', text: 'تم استلام البلاغ',
    is_internal: false, created_at: new Date(Date.now() - 7200000).toISOString(),
    user_name: 'قسم HR', user_role: 'HR',
  }],
  timeline: [{
    id: '1', type: 'created', description: 'تم رفع البلاغ',
    actor_name: user?.full_name || 'موظف',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  }],
});

// ════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════

export default function ProblemDetail({ problemId }: { problemId: string }) {
  const { user } = useAuthStore();
  const { setActiveView, addToast } = useUIStore();

  const [problem, setProblem] = useState<ProblemDetailUI | null>(null);
  const [comments, setComments] = useState<CommentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const userIdRef = useRef(user?.id);
  const problemIdRef = useRef(problemId);

  useEffect(() => {
    userIdRef.current = user?.id;
    problemIdRef.current = problemId;
  }, [user?.id, problemId]);

  const isHR = useMemo(() => user?.role === 'hr' || user?.role === 'admin', [user?.role]);

  const generateTimeline = useCallback((problemData: ProblemDetailType): TimelineEvent[] => {
    const timeline: TimelineEvent[] = [{
      id: '1', type: 'created', description: 'تم رفع البلاغ',
      actor_name: user?.full_name || 'موظف', timestamp: problemData.created_at,
    }];

    if (problemData.status !== 'pending') {
      timeline.push({
        id: '2', type: 'status_changed',
        description: `تغيرت الحالة إلى: ${STATUS_CONFIG[problemData.status as ProblemStatus]?.label || problemData.status}`,
        actor_name: 'نظام', timestamp: problemData.updated_at || problemData.created_at,
        metadata: { status: problemData.status },
      });
    }
    return timeline;
  }, [user?.full_name]);

  const fetchProblemComments = useCallback(async (pId: string) => {
    setLoadingComments(true);
    try {
      const dbComments = await fetchComments(pId);
      setComments(dbComments);
      setProblem((prev) => (prev ? { ...prev, comments: dbComments } : null));
    } catch (err) {
      console.warn('⚠️ Error fetching comments:', getErrorMessage(err));
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    const currentUserId = userIdRef.current;
    const currentProblemId = problemIdRef.current;
    if (!currentProblemId) { setLoading(false); return; }

    setLoading(true);
    try {
      const problemData = await fetchProblemById(currentProblemId, currentUserId);
      if (problemData) {
        const mappedProblem: ProblemDetailUI = {
          ...problemData,
          employee_name: user?.full_name,
          department: user?.department,
          position: user?.position,
          email: user?.email,
          comments: [],
          timeline: generateTimeline(problemData),
        };
        setProblem(mappedProblem);
        await fetchProblemComments(currentProblemId);
      } else {
        setProblem(getMockProblem(currentProblemId, user));
        setComments([]);
      }
    } catch (err) {
      console.error('❌ Error loading problem:', getErrorMessage(err));
      setProblem(getMockProblem(currentProblemId, user));
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [user, generateTimeline, fetchProblemComments]);

  const setupRealtimeUpdates = useCallback((pId: string) => {
    try {
      if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; }
      unsubscribeRef.current = subscribeToProblemUpdates(pId, (update: RealtimeUpdate) => {
        if (update.type === 'new_comment') fetchProblemComments(pId);
        else fetchData();
      });
    } catch (err) {
      console.warn('⚠️ Could not setup realtime:', getErrorMessage(err));
    }
  }, [fetchProblemComments, fetchData]);

  useEffect(() => {
    fetchData().then(() => setupRealtimeUpdates(problemId));
    return () => { if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim() || !user?.id || !problem) return;
    setSubmittingComment(true);
    try {
      const result = await addComment(problem.id, user.id, newComment, false);
      if (result) {
        setComments((prev) => [...prev, result]);
        setProblem((prev) => prev ? {
          ...prev,
          timeline: [...(prev.timeline || []), {
            id: Date.now().toString(), type: 'commented', description: 'تم إضافة تعليق',
            actor_name: user.full_name || 'مستخدم', timestamp: new Date().toISOString(),
          }],
        } : null);
        setNewComment('');
        addToast('✅ تم إضافة التعليق', 'success');
      }
    } catch (err) {
      console.error('❌ Error adding comment:', getErrorMessage(err));
      addToast('❌ فشل إضافة التعليق', 'error');
    } finally {
      setSubmittingComment(false);
    }
  }, [newComment, user, problem, addToast]);

  const handleStatusChange = useCallback(async (newStatus: ProblemStatus) => {
    if (!isHR || !problem) return;
    setStatusUpdating(true);
    try {
      const result = await updateProblemStatus(problem.id, newStatus);
      if (result) {
        setProblem((prev) => prev ? {
          ...prev, status: newStatus, updated_at: new Date().toISOString(),
          timeline: [...(prev.timeline || []), {
            id: Date.now().toString(), type: 'status_changed',
            description: `تغيرت الحالة إلى: ${STATUS_CONFIG[newStatus].label}`,
            actor_name: user?.full_name || 'HR', timestamp: new Date().toISOString(),
            metadata: { from: prev.status, to: newStatus },
          }],
        } : null);
        setShowStatusMenu(false);
        addToast(`✅ تم تغيير الحالة إلى ${STATUS_CONFIG[newStatus].label}`, 'success');
      }
    } catch (err) {
      console.error('❌ Error:', getErrorMessage(err));
      addToast('❌ فشل تغيير الحالة', 'error');
    } finally {
      setStatusUpdating(false);
    }
  }, [isHR, problem, user, addToast]);

  const handleGoBack = useCallback(() => setActiveView('employee-problems'), [setActiveView]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">لم يتم العثور على البلاغ</h3>
        <Button onClick={handleGoBack} variant="outline"><ArrowRight size={16} className="ml-2" /> العودة للقائمة</Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[problem.status];
  const severityConfig = SEVERITY_CONFIG[problem.severity];
  const category = CATEGORIES[problem.category];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={handleGoBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors">
          <ArrowRight size={20} /><span className="font-medium">العودة للبلاغات</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Problem Card */}
          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="neutral" size="sm"><span className="ml-1">{category?.icon}</span>{category?.label}</Badge>
                    {problem.is_anonymous && <Badge variant="neutral" size="sm">مجهول</Badge>}
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-800 mb-2">{problem.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5"><Calendar size={14} /><span>{format(new Date(problem.created_at), 'PPp', { locale: ar })}</span></div>
                    <div className="flex items-center gap-1.5"><Clock size={14} /><span>#{problem.id}</span></div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="relative">
                    <button onClick={() => isHR && setShowStatusMenu(!showStatusMenu)} disabled={!isHR}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${statusConfig.border} ${statusConfig.bg} ${statusConfig.color} font-bold text-sm transition-all ${isHR ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}>
                      <StatusIcon size={16} /><span>{statusConfig.label}</span>{isHR && <ChevronDown size={14} />}
                    </button>
                    {showStatusMenu && isHR && (
                      <div className="absolute left-0 top-12 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-10">
                        {(Object.keys(STATUS_CONFIG) as ProblemStatus[]).map((key) => {
                          const cfg = STATUS_CONFIG[key];
                          const Icon = cfg.icon;
                          return (
                            <button key={key} onClick={() => handleStatusChange(key)} disabled={statusUpdating}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors disabled:opacity-50">
                              <Icon size={16} className={cfg.color} />
                              <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
                              {problem.status === key && <Check size={14} className="text-emerald-500 mr-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${severityConfig.bgLight}`}>
                    <div className={`w-2 h-2 rounded-full ${severityConfig.color}`} />
                    <span className={`text-sm font-bold ${severityConfig.textColor}`}>{severityConfig.label}</span>
                  </div>
                </div>
              </div>

              <div className={`w-full h-1.5 rounded-full ${severityConfig.color} mb-6`} />
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{problem.description}</p>
            </div>
          </Card>

          {/* AI Analysis */}
          {problem.ai_analysis && (
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg"><Sparkles size={20} className="text-indigo-600" /></div>
                  <h3 className="text-lg font-bold text-indigo-900">التحليل الذكي</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-indigo-700">مستوى الإلحاح</span>
                      <span className="text-lg font-bold text-indigo-900">{problem.ai_analysis.urgencyLevel}/10</span>
                    </div>
                    <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${problem.ai_analysis.urgencyLevel >= 8 ? 'bg-red-500' : problem.ai_analysis.urgencyLevel >= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${problem.ai_analysis.urgencyLevel * 10}%` }} />
                    </div>
                  </div>
                  {problem.ai_analysis.suggestedAction && (
                    <div className="p-4 bg-white/60 rounded-xl">
                      <p className="text-sm font-medium text-indigo-700 mb-1">الإجراء المقترح:</p>
                      <p className="text-sm text-indigo-900">{problem.ai_analysis.suggestedAction}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare size={20} className="text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-800">التعليقات</h3>
                {comments.length > 0 && <Badge variant="neutral" size="sm">{comments.length}</Badge>}
              </div>
              <div className="space-y-4 mb-6">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-6"><Loader2 className="animate-spin text-indigo-600" size={20} /></div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{comment.user_name?.charAt(0) || 'م'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-800">{comment.user_name}</span>
                          {comment.user_role && <Badge variant="neutral" size="sm">{comment.user_role}</Badge>}
                          <span className="text-xs text-slate-400">{format(new Date(comment.created_at), 'PPp', { locale: ar })}</span>
                        </div>
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{comment.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-6">لا توجد تعليقات</p>
                )}
              </div>
              <div className="space-y-3 border-t border-slate-100 pt-6">
                <textarea ref={commentInputRef} value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="أضف تعليقاً..." rows={3} className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                <div className="flex items-center justify-between">
                  <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Paperclip size={18} className="text-slate-400" /></button>
                  <Button onClick={handleAddComment} disabled={submittingComment || !newComment.trim()} icon={submittingComment ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} size="sm">{submittingComment ? 'جاري الإرسال...' : 'إرسال'}</Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {!problem.is_anonymous && problem.employee_name && (
            <Card>
              <div className="p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">معلومات الموظف</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-slate-400" />
                    <div><p className="text-xs text-slate-500">الاسم</p><p className="text-sm font-medium text-slate-800">{problem.employee_name}</p></div>
                  </div>
                  {problem.department && (
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-slate-400" />
                      <div><p className="text-xs text-slate-500">القسم</p><p className="text-sm font-medium text-slate-800">{problem.department}</p></div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {problem.timeline && problem.timeline.length > 0 && (
            <Card>
              <div className="p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4">السجل الزمني</h3>
                <div className="space-y-4">
                  {problem.timeline.map((event, idx) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                        {idx < problem.timeline!.length - 1 && <div className="w-0.5 h-full bg-slate-200 mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium text-slate-800">{event.description}</p>
                        <p className="text-xs text-slate-500 mt-1">بواسطة {event.actor_name}</p>
                        <p className="text-xs text-slate-400 mt-1">{format(new Date(event.timestamp), 'PPp', { locale: ar })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
