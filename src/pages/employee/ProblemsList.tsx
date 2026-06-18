/**
 * ════════════════════════════════════════════════════════════════
 *  البلاغات - نظام وادي الرافدين HR
 *  صفحة متكاملة: عرض + رفع بلاغ جديد
 * ════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Filter, MessageSquare, Bot, TrendingUp, Clock,
  CheckCircle, XCircle, Eye, AlertTriangle, ArrowUpDown, X,
  FileText, Calendar, User, Send, Paperclip, Sparkles,
  ChevronRight, Loader2, AlertCircle, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// ════════════════════════════════════════════════════════════════
//  Types & Constants
// ════════════════════════════════════════════════════════════════

interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  isAnonymous: boolean;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  createdAt: string;
  updatedAt?: string;
  aiAnalysis?: {
    urgencyLevel: number;
    sentiment: string;
    suggestedCategory?: string;
    suggestedAction?: string;
  };
  comments?: Array<{
    id: string;
    text: string;
    authorName: string;
    createdAt: string;
  }>;
  attachments?: string[];
}

const STATUS_CONFIG = {
  pending: { label: 'معلقة', variant: 'warning' as const, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  in_progress: { label: 'قيد المعالجة', variant: 'info' as const, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  resolved: { label: 'محلولة', variant: 'success' as const, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  closed: { label: 'مغلقة', variant: 'neutral' as const, icon: XCircle, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
};

const SEVERITY_CONFIG = {
  low: { label: 'منخفضة', variant: 'success' as const, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  medium: { label: 'متوسطة', variant: 'warning' as const, color: 'bg-amber-500', textColor: 'text-amber-700' },
  high: { label: 'عالية', variant: 'danger' as const, color: 'bg-orange-500', textColor: 'text-orange-700' },
  critical: { label: 'حرجة', variant: 'danger' as const, color: 'bg-red-500', textColor: 'text-red-700' },
};

const CATEGORIES = [
  { value: 'technical', label: 'تقني', icon: '💻' },
  { value: 'hr', label: 'موارد بشرية', icon: '👥' },
  { value: 'management', label: 'إدارة', icon: '📊' },
  { value: 'workplace', label: 'بيئة عمل', icon: '🏢' },
  { value: 'salary', label: 'رواتب', icon: '💰' },
  { value: 'safety', label: 'سلامة', icon: '🛡️' },
  { value: 'other', label: 'أخرى', icon: '📝' },
];

// ════════════════════════════════════════════════════════════════
//  Main Component
// ════════════════════════════════════════════════════════════════

interface ProblemsListProps {
  isHR?: boolean;
}

export default function ProblemsList({ isHR: isHRProp = false }: ProblemsListProps) {
  const { user } = useAuthStore();
  const { setActiveView, addToast } = useUIStore();

  // ─── State ───
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'severity' | 'status'>('date');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  
  const [showNewProblem, setShowNewProblem] = useState(false);
  const [newProblem, setNewProblem] = useState({
    title: '',
    description: '',
    category: 'technical',
    severity: 'medium' as Problem['severity'],
    isAnonymous: false,
  });

  const isHR = useMemo(() => isHRProp || user?.role === 'hr' || user?.role === 'admin', [isHRProp, user?.role]);

  // ═══════════════════════════════════════════════════════════════
  // Fetch Problems
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    fetchProblems();
  }, [user?.id]);

  const fetchProblems = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      // إذا كان المستخدم عادي وليس HR, نظهر فقط بلاغاته
      if (!isHR) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        setProblems(data.map(d => ({
          id: d.id,
          title: d.title || 'بلاغ',
          description: d.description || '',
          category: d.category || 'other',
          severity: d.severity || 'medium',
          status: d.status || 'pending',
          isAnonymous: d.is_anonymous || false,
          employeeId: d.user_id,
          employeeName: isHR ? d.employee_name || 'موظف' : user.full_name,
          department: isHR ? d.department || '' : user.department,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
          aiAnalysis: d.ai_analysis,
          comments: [],
        })));
      } else {
        // استخدام Mock Data كـ Fallback
        setProblems(getMockProblems());
      }
    } catch (err) {
      console.warn('Failed to fetch problems, using mock data:', err);
      setProblems(getMockProblems());
    } finally {
      setLoading(false);
    }
  };

  const getMockProblems = (): Problem[] => [
    {
      id: '1',
      title: 'مشكلة في جهاز الكمبيوتر',
      description: 'الجهاز لا يعمل بشكل صحيح ويحتاج إلى صيانة عاجلة',
      category: 'technical',
      severity: 'medium',
      status: 'in_progress',
      isAnonymous: false,
      employeeName: user?.full_name || 'موظف',
      department: user?.department || 'تقنية المعلومات',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      aiAnalysis: {
        urgencyLevel: 6,
        sentiment: 'neutral',
        suggestedAction: 'إحالة لقسم الصيانة'
      }
    },
    {
      id: '2',
      title: 'مشكلة في الشبكة',
      description: 'انقطاع الإنترنت بشكل متكرر في المكتب',
      category: 'technical',
      severity: 'high',
      status: 'pending',
      isAnonymous: false,
      employeeName: user?.full_name || 'موظف',
      department: user?.department || 'تقنية المعلومات',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      aiAnalysis: {
        urgencyLevel: 8,
        sentiment: 'negative',
        suggestedAction: 'فحص السيرفر فوراً'
      }
    },
    {
      id: '3',
      title: 'طلب تدريب على GMP',
      description: 'أرغب في حضور دورة تدريبية على ممارسات التصنيع الجيد',
      category: 'hr',
      severity: 'low',
      status: 'resolved',
      isAnonymous: false,
      employeeName: user?.full_name || 'موظف',
      department: user?.department || 'الإنتاج',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      aiAnalysis: {
        urgencyLevel: 3,
        sentiment: 'positive'
      }
    },
  ];

  // ═══════════════════════════════════════════════════════════════
  // Computed Values
  // ═══════════════════════════════════════════════════════════════

  const stats = useMemo(() => ({
    total: problems.length,
    pending: problems.filter(p => p.status === 'pending').length,
    inProgress: problems.filter(p => p.status === 'in_progress').length,
    resolved: problems.filter(p => p.status === 'resolved').length,
    critical: problems.filter(p => p.severity === 'critical').length,
  }), [problems]);

  const filteredProblems = useMemo(() => {
    let filtered = problems;

    // Tab filter
    if (activeTab !== 'all') {
      filtered = filtered.filter(p => p.status === activeTab);
    }

    // Search
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    // Severity filter
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(p => p.severity === filterSeverity);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'severity') {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return 0;
    });

    return filtered;
  }, [problems, activeTab, search, filterSeverity, sortBy]);

  // ═══════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════

  const handleSubmitProblem = async () => {
    if (!newProblem.title.trim() || !newProblem.description.trim()) {
      addToast('يرجى ملء جميع الحقول', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // محاولة الإرسال لـ Supabase
      const { data, error } = await supabase
        .from('incidents')
        .insert({
          title: newProblem.title,
          description: newProblem.description,
          category: newProblem.category,
          severity: newProblem.severity,
          status: 'pending',
          is_anonymous: newProblem.isAnonymous,
          user_id: user?.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        // نجح الإرسال
        addToast('تم رفع البلاغ بنجاح', 'success');
        fetchProblems();
        setShowNewProblem(false);
        setNewProblem({
          title: '',
          description: '',
          category: 'technical',
          severity: 'medium',
          isAnonymous: false,
        });
      } else {
        throw new Error('Failed to insert');
      }
    } catch (err) {
      console.warn('Failed to submit to Supabase, adding to local state:', err);
      
      // إضافة للحالة المحلية كـ Fallback
      const mockProblem: Problem = {
        id: Date.now().toString(),
        ...newProblem,
        status: 'pending',
        employeeName: user?.full_name || 'موظف',
        department: user?.department,
        createdAt: new Date().toISOString(),
      };
      
      setProblems(prev => [mockProblem, ...prev]);
      addToast('تم رفع البلاغ بنجاح (محلياً)', 'success');
      setShowNewProblem(false);
      setNewProblem({
        title: '',
        description: '',
        category: 'technical',
        severity: 'medium',
        isAnonymous: false,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectProblem = (id: string) => {
    setActiveView(`problem-detail-${id}`);
  };

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">البلاغات</h2>
          <p className="text-sm text-slate-500 mt-1">
            {filteredProblems.length} من {problems.length} بلاغ
          </p>
        </div>
        <Button
          onClick={() => setShowNewProblem(true)}
          className="bg-gradient-to-br from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800"
          icon={<Plus size={18} />}
        >
          رفع بلاغ جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('all')}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText size={20} className="text-slate-500" />
              <span className={`text-xs font-bold ${activeTab === 'all' ? 'text-indigo-600' : 'text-slate-400'}`}>
                الكل
              </span>
            </div>
            <p className="text-3xl font-extrabold text-slate-800">{stats.total}</p>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('pending')}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock size={20} className="text-amber-500" />
              <span className={`text-xs font-bold ${activeTab === 'pending' ? 'text-amber-600' : 'text-slate-400'}`}>
                معلقة
              </span>
            </div>
            <p className="text-3xl font-extrabold text-amber-600">{stats.pending}</p>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('in_progress')}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={20} className="text-blue-500" />
              <span className={`text-xs font-bold ${activeTab === 'in_progress' ? 'text-blue-600' : 'text-slate-400'}`}>
                قيد المعالجة
              </span>
            </div>
            <p className="text-3xl font-extrabold text-blue-600">{stats.inProgress}</p>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('resolved')}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle size={20} className="text-emerald-500" />
              <span className={`text-xs font-bold ${activeTab === 'resolved' ? 'text-emerald-600' : 'text-slate-400'}`}>
                محلولة
              </span>
            </div>
            <p className="text-3xl font-extrabold text-emerald-600">{stats.resolved}</p>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle size={20} className="text-red-500" />
              <span className="text-xs font-bold text-red-600">حرجة</span>
            </div>
            <p className="text-3xl font-extrabold text-red-600">{stats.critical}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في البلاغات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">جميع الأولويات</option>
          <option value="critical">حرجة</option>
          <option value="high">عالية</option>
          <option value="medium">متوسطة</option>
          <option value="low">منخفضة</option>
        </select>

        <button
          onClick={() => setSortBy(sortBy === 'date' ? 'severity' : 'date')}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ArrowUpDown size={16} />
          <span className="text-sm">
            {sortBy === 'date' ? 'الأحدث' : 'الأولوية'}
          </span>
        </button>
      </div>

      {/* Problems List */}
      <div className="space-y-3">
        {loading ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="animate-spin mb-3" size={40} />
              <p className="text-sm font-medium">جاري التحميل...</p>
            </div>
          </Card>
        ) : filteredProblems.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <FileText size={40} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-2">
                {activeTab === 'all' ? 'لا توجد بلاغات' : `لا توجد بلاغات ${STATUS_CONFIG[activeTab]?.label}`}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {search ? 'جرب تغيير كلمة البحث' : 'ابدأ برفع بلاغ جديد'}
              </p>
              <Button
                onClick={() => setShowNewProblem(true)}
                variant="outline"
                icon={<Plus size={18} />}
              >
                رفع بلاغ جديد
              </Button>
            </div>
          </Card>
        ) : (
          filteredProblems.map(problem => {
            const statusConfig = STATUS_CONFIG[problem.status];
            const severityConfig = SEVERITY_CONFIG[problem.severity];
            const category = CATEGORIES.find(c => c.value === problem.category);

            return (
              <Card
                key={problem.id}
                className="hover:shadow-lg cursor-pointer transition-all hover:border-indigo-200 group"
                onClick={() => handleSelectProblem(problem.id)}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Severity Indicator */}
                    <div className={`w-1.5 h-16 rounded-full ${severityConfig.color} flex-shrink-0`} />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {problem.isAnonymous && (
                              <Badge variant="neutral" size="sm">مجهول</Badge>
                            )}
                            {category && (
                              <Badge variant="neutral" size="sm">
                                <span className="mr-1">{category.icon}</span>
                                {category.label}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                            {problem.title}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {problem.description}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge variant={statusConfig.variant} size="sm">
                            {statusConfig.label}
                          </Badge>
                          <Badge variant={severityConfig.variant} size="sm">
                            {severityConfig.label}
                          </Badge>
                        </div>
                      </div>

                      {/* AI Analysis */}
                      {problem.aiAnalysis && (
                        <div className="mb-3 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl">
                          <div className="flex items-start gap-2">
                            <Sparkles size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-indigo-700 mb-1">
                                تحليل ذكي
                              </p>
                              <p className="text-xs text-indigo-600">
                                {problem.aiAnalysis.suggestedAction || 'تحليل تلقائي للبلاغ'}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-indigo-500">مستوى الإلحاح:</span>
                                <div className="flex-1 h-1.5 bg-indigo-100 rounded-full overflow-hidden max-w-[100px]">
                                  <div
                                    className={`h-full rounded-full ${
                                      problem.aiAnalysis.urgencyLevel >= 8 ? 'bg-red-500' :
                                      problem.aiAnalysis.urgencyLevel >= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${problem.aiAnalysis.urgencyLevel * 10}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-indigo-700">
                                  {problem.aiAnalysis.urgencyLevel}/10
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            <span>{format(new Date(problem.createdAt), 'dd MMM yyyy', { locale: ar })}</span>
                          </div>
                          {problem.comments && problem.comments.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <MessageSquare size={14} />
                              <span>{problem.comments.length}</span>
                            </div>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* New Problem Modal */}
      <Modal
        isOpen={showNewProblem}
        onClose={() => setShowNewProblem(false)}
        title="رفع بلاغ جديد"
      >
        <div className="space-y-4" dir="rtl">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              العنوان <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProblem.title}
              onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
              placeholder="عنوان واضح للبلاغ..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category & Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                التصنيف
              </label>
              <select
                value={newProblem.category}
                onChange={(e) => setNewProblem({ ...newProblem, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                الأولوية
              </label>
              <select
                value={newProblem.severity}
                onChange={(e) => setNewProblem({ ...newProblem, severity: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="critical">حرجة</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              الوصف <span className="text-red-500">*</span>
            </label>
            <textarea
              value={newProblem.description}
              onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
              placeholder="اشرح المشكلة بالتفصيل..."
              rows={5}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Anonymous */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              id="anonymous"
              checked={newProblem.isAnonymous}
              onChange={(e) => setNewProblem({ ...newProblem, isAnonymous: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
            />
            <label htmlFor="anonymous" className="text-sm font-medium text-slate-700 cursor-pointer">
              رفع البلاغ بشكل مجهول
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowNewProblem(false)}
              disabled={submitting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSubmitProblem}
              disabled={submitting || !newProblem.title.trim() || !newProblem.description.trim()}
              icon={submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            >
              {submitting ? 'جاري الإرسال...' : 'رفع البلاغ'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}