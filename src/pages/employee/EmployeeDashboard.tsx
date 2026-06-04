import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle, CheckCircle, Clock, Plus, ChevronLeft,
  Bot, Star, RefreshCw, TrendingUp, TrendingDown,
  Heart, WifiOff, X, Award, Activity,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../../store';
import { supabase } from '../../lib/supabase';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { format, subDays, isAfter } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────
interface Problem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  created_at: string;
  ai_analysis?: {
    urgencyLevel: number;
    sentiment: string;
    sentimentScore: number;
    suggestedActions: string[];
    predictedResolutionTime: string;
    tags: string[];
  };
}

interface WellnessEntry {
  id: string;
  date: string;
  score: number;
  mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  stress: number;
  energy: number;
  notes?: string;
}

// ── Constants ────────────────────────────────────────────────────────
const QUOTES = [
  { text: 'النجاح هو مجموع جهود صغيرة تتكرر يوماً بعد يوم', author: 'روبرت كوليير' },
  { text: 'لا تنتظر الفرصة المثالية، اخلق فرصتك بنفسك', author: 'جورج برنارد شو' },
  { text: 'العمل الجماعي وقود الطائرة التي تحقق الأهداف غير العادية', author: 'أندرو كارنيغي' },
  { text: 'كل خبير كان يوماً مبتدئاً، لا تتوقف عن التعلم', author: 'هيلين هايز' },
  { text: 'الإنتاجية لا تعني الانشغال، بل تعني تحقيق النتائج', author: 'ديفيد ألن' },
  { text: 'أقوى الناس من يتحكم في انفعالاته ويوجّه طاقته نحو هدفه', author: 'حكمة عربية' },
  { text: 'البداية هي أصعب خطوة، لكنها أهم خطوة نحو النجاح', author: 'بلايز باسكال' },
];

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const MOOD_CONFIG = {
  great:    { emoji: '😄', label: 'ممتاز',    color: '#10b981' },
  good:     { emoji: '🙂', label: 'جيد',      color: '#3b82f6' },
  neutral:  { emoji: '😐', label: 'عادي',     color: '#f59e0b' },
  bad:      { emoji: '😕', label: 'سيء',      color: '#f97316' },
  terrible: { emoji: '😢', label: 'سيء جداً', color: '#ef4444' },
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'في الانتظار', in_progress: 'قيد المعالجة',
  resolved: 'محلولة',     closed: 'مغلقة',
};
const STATUS_VARIANTS: Record<string, string> = {
  pending: 'warning', in_progress: 'info',
  resolved: 'success', closed: 'neutral',
};
const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-500',
  high:     'bg-orange-100 text-orange-500',
  medium:   'bg-amber-100 text-amber-500',
  low:      'bg-green-100 text-green-500',
};

// ── Sub-components ───────────────────────────────────────────────────
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
);

const StatCardSkeleton = () => (
  <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3">
    <Skeleton className="w-10 h-10" />
    <Skeleton className="w-14 h-7 rounded-lg" />
    <Skeleton className="w-24 h-3 rounded" />
  </div>
);

const ProblemRowSkeleton = () => (
  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
    <Skeleton className="w-9 h-9 flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-2.5 w-1/3" />
    </div>
    <Skeleton className="h-5 w-16 rounded-full flex-shrink-0" />
  </div>
);

// Wellness ring using SVG
const WellnessRing = ({ score, mood }: { score: number; mood: string }) => {
  const cfg = MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG] ?? MOOD_CONFIG.neutral;
  const R = 42;
  const C = 2 * Math.PI * R;
  const dash = Math.min(score / 100, 1) * C;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 sm:w-28 sm:h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={R} fill="none" stroke="#f1f5f9" strokeWidth="9" />
          <circle
            cx="50" cy="50" r={R} fill="none"
            stroke={cfg.color} strokeWidth="9"
            strokeDasharray={`${dash} ${C - dash}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-xl sm:text-2xl leading-none">{cfg.emoji}</span>
          <span className="text-sm font-extrabold text-slate-700 leading-none">{score}</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-500 mt-2">{cfg.label}</p>
    </div>
  );
};

// Mini bar chart inside stat card
const TrendBadge = ({ current, previous }: { current: number; previous: number }) => {
  const diff = current - previous;
  if (previous === 0 && current === 0) return null;
  if (diff === 0) return <span className="text-[10px] text-slate-400">مستقر</span>;
  const up = diff > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-bold ${up ? 'text-red-500' : 'text-emerald-500'}`}>
      <Icon size={11} />{Math.abs(diff)}
    </span>
  );
};

// ── Main Dashboard ───────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const { setActiveView } = useUIStore();

  const [problems,        setProblems]        = useState<Problem[]>([]);
  const [lastWeekCount,   setLastWeekCount]   = useState(0);
  const [wellnessToday,   setWellnessToday]   = useState<WellnessEntry | null>(null);
  const [wellnessHistory, setWellnessHistory] = useState<WellnessEntry[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [isRealtime,      setIsRealtime]      = useState(false);
  const [dismissedAlert,  setDismissedAlert]  = useState(false);
  const [refreshing,      setRefreshing]      = useState(false);

  // Derived constants
  const name     = user?.name || user?.full_name || '';
  const initials = name.split(' ').slice(0, 2).map((w: string) => w[0] || '').join('') || 'م';
  const hour     = new Date().getHours();
  const greeting = hour < 5 ? '🌙 ليلة طيبة' : hour < 12 ? '☀️ صباح الخير' : hour < 17 ? '🌤️ مساء الخير' : '🌙 مساء النور';
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  const quote    = QUOTES[dayOfYear % QUOTES.length];

  // ── Fetch ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user) return;
    setError(null);
    
    // التحقق من أن المستخدم محلي (حساب تجريبي)
    const isLocalUser = user.id?.startsWith('dev-local-') || user.id?.startsWith('local-');
    
    if (isLocalUser) {
      // استخدام بيانات وهمية للمستخدم المحلي
      const mockProblems: Problem[] = [
        {
          id: '1',
          title: 'مشكلة في جهاز الكمبيوتر',
          description: 'الجهاز لا يعمل بشكل صحيح',
          status: 'in_progress',
          severity: 'medium',
          category: 'technical',
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: '2',
          title: 'طلب إجازة',
          description: 'طلب إجازة سنوية',
          status: 'resolved',
          severity: 'low',
          category: 'hr',
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
        {
          id: '3',
          title: 'مشكلة في الشبكة',
          description: 'انقطاع الإنترنت',
          status: 'pending',
          severity: 'high',
          category: 'technical',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      
      setProblems(mockProblems);
      setLastWeekCount(1);
      
      // بيانات وهمية للـ Wellness
      const mockWellness: WellnessEntry[] = [
        { id: '1', date: format(new Date(), 'yyyy-MM-dd'), score: 75, mood: 'good', stress: 30, energy: 70 },
        { id: '2', date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), score: 80, mood: 'great', stress: 25, energy: 80 },
        { id: '3', date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), score: 65, mood: 'neutral', stress: 40, energy: 60 },
        { id: '4', date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), score: 70, mood: 'good', stress: 35, energy: 65 },
        { id: '5', date: format(subDays(new Date(), 4), 'yyyy-MM-dd'), score: 85, mood: 'great', stress: 20, energy: 85 },
        { id: '6', date: format(subDays(new Date(), 5), 'yyyy-MM-dd'), score: 60, mood: 'neutral', stress: 45, energy: 55 },
        { id: '7', date: format(subDays(new Date(), 6), 'yyyy-MM-dd'), score: 78, mood: 'good', stress: 28, energy: 75 },
      ];
      
      setWellnessHistory(mockWellness);
      setWellnessToday(mockWellness[0]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      // Problems
      const { data: pData, error: pErr } = await supabase
        .from('incidents')
        .select('*')
        .eq('reported_by', user.id)
        .order('created_at', { ascending: false });
      if (pErr) throw pErr;

      const allProblems = (pData || []) as Problem[];
      setProblems(allProblems);

      // Trend: compare this week vs last week
      const lastWeekProblems = allProblems.filter(p => {
        const d = new Date(p.created_at);
        return d >= subDays(new Date(), 14) && d < subDays(new Date(), 7);
      });
      setLastWeekCount(lastWeekProblems.length);

      // Wellness
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: wData } = await supabase
        .from('wellness_entries')
        .select('*')
        .eq('employee_id', user.id)
        .order('date', { ascending: false })
        .limit(7);

      if (wData && wData.length > 0) {
        const sorted = [...wData].reverse() as WellnessEntry[];
        setWellnessHistory(sorted);
        setWellnessToday(wData.find((w: any) => w.date === today) ?? null);
      }
    } catch (err: any) {
      console.error('[EmployeeDashboard] fetchData:', err);
      setError(err?.message || 'فشل تحميل البيانات، يرجى المحاولة مجدداً');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Real-time subscription ─────────────────────────────
  useEffect(() => {
    if (!user) return;
    
    // التحقق من أن المستخدم محلي (حساب تجريبي)
    const isLocalUser = user.id?.startsWith('dev-local-') || user.id?.startsWith('local-');
    if (isLocalUser) {
      setIsRealtime(false);
      return;
    }
    
    const channel = supabase
      .channel(`emp-dashboard-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'incidents',
        filter: `reported_by=eq.${user.id}`,
      }, payload => {
        if (payload.eventType === 'INSERT') {
          setProblems(prev => [payload.new as Problem, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setProblems(prev => prev.map(p => p.id === payload.new.id ? (payload.new as Problem) : p));
        } else if (payload.eventType === 'DELETE') {
          setProblems(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe(status => setIsRealtime(status === 'SUBSCRIBED'));

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Computed ───────────────────────────────────────────
  const pending     = problems.filter(p => p.status === 'pending').length;
  const inProgress  = problems.filter(p => p.status === 'in_progress').length;
  const resolved    = problems.filter(p => ['resolved', 'closed'].includes(p.status)).length;
  const thisWeek    = problems.filter(p => isAfter(new Date(p.created_at), subDays(new Date(), 7))).length;
  const hasCritical = !dismissedAlert && problems.some(p =>
    p.status === 'pending' && ['critical', 'high'].includes(p.severity),
  );

  const pieData = [
    { name: 'محلولة',       value: resolved,   color: '#10b981' },
    { name: 'قيد المعالجة', value: inProgress, color: '#6366f1' },
    { name: 'في الانتظار',  value: pending,    color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const chartData = DAYS_AR.map((day, i) => ({
    day,
    score: wellnessHistory[i]?.score ?? [72, 65, 80, 75, 82, 88, 78][i],
  }));

  const STATS = [
    { label: 'إجمالي المشاكل', value: problems.length, showTrend: true,  icon: AlertCircle, iconCls: 'bg-indigo-50 text-indigo-600', grad: 'from-indigo-500 to-indigo-600' },
    { label: 'قيد المعالجة',   value: inProgress,      showTrend: false, icon: Clock,        iconCls: 'bg-amber-50 text-amber-600',   grad: 'from-amber-500 to-amber-600'  },
    { label: 'في الانتظار',    value: pending,         showTrend: false, icon: AlertCircle,  iconCls: 'bg-red-50 text-red-600',       grad: 'from-red-500 to-red-600'      },
    { label: 'تم حلها',        value: resolved,        showTrend: false, icon: CheckCircle,  iconCls: 'bg-emerald-50 text-emerald-600',grad:'from-emerald-500 to-emerald-600'},
  ];

  const QUICK_ACTIONS = [
    { label: 'رفع مشكلة',    icon: Plus,  color: 'from-red-500 to-orange-500',    view: 'new-problem',        badge: null },
    { label: 'المساعد الذكي', icon: Bot,   color: 'from-indigo-500 to-purple-600', view: 'employee-ai-chat',   badge: null },
    { label: 'الاستبيانات',  icon: Star,  color: 'from-amber-500 to-orange-500',  view: 'employee-survey',    badge: 1 },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 xl:space-y-6 animate-fade-in">

      {/* ── Critical Problem Alert ────────────────────────── */}
      {hasCritical && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 animate-pulse" />
          <p className="flex-1 text-sm font-semibold text-red-700">
            لديك مشكلة عاجلة أو حرجة في الانتظار — يرجى المتابعة فوراً
          </p>
          <button
            onClick={() => setDismissedAlert(true)}
            className="p-1 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── Error Banner ──────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <WifiOff size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-700 truncate">{error}</p>
          </div>
          <Button
            size="xs" variant="outline"
            onClick={() => { setRefreshing(true); setError(null); fetchData(); }}
            icon={<RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />}
            iconPosition="left"
          >
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* ── Welcome Banner ───────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-700 to-indigo-800 rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-lg sm:text-xl font-extrabold flex-shrink-0 select-none">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white/70 text-xs sm:text-sm">{greeting}</p>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5 truncate">{name}</h2>
              {(user?.position || user?.department) && (
                <p className="text-white/60 text-xs sm:text-sm mt-0.5 truncate">
                  {[user?.position, user?.department].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5">
                  <p className="text-[10px] text-white/60">هذا الأسبوع</p>
                  <p className="font-bold text-sm leading-tight">{thisWeek} {thisWeek === 1 ? 'مشكلة' : 'مشاكل'}</p>
                </div>
                {wellnessToday && (
                  <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-1.5">
                    <p className="text-[10px] text-white/60">حالتك اليوم</p>
                    <p className="font-bold text-sm leading-tight">
                      {MOOD_CONFIG[wellnessToday.mood]?.emoji} {MOOD_CONFIG[wellnessToday.mood]?.label}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top-right controls */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
            <button
              onClick={() => { setRefreshing(true); fetchData(); }}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-60"
              title="تحديث البيانات"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold ${
              isRealtime ? 'bg-emerald-500/25 text-emerald-200' : 'bg-slate-500/25 text-slate-300'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isRealtime ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
              {isRealtime ? 'مباشر' : 'غير متصل'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
          : STATS.map((s, i) => {
              const Icon = s.icon;
              return (
                <Card key={i} hover className="relative overflow-hidden p-3 sm:p-4">
                  <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-3xl bg-gradient-to-br ${s.grad} opacity-10`} />
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${s.iconCls} flex items-center justify-center mb-2 sm:mb-3`}>
                    <Icon size={17} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">{s.value}</p>
                  <div className="flex items-center justify-between mt-0.5 gap-1">
                    <p className="text-xs text-slate-500 leading-tight">{s.label}</p>
                    {s.showTrend && <TrendBadge current={thisWeek} previous={lastWeekCount} />}
                  </div>
                </Card>
              );
            })
        }
      </div>

      {/* ── Quick Actions ────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-bold text-slate-600 mb-3">الإجراءات السريعة</h3>
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
          {QUICK_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={() => setActiveView(action.view)}
                className="bg-white border border-slate-100 rounded-2xl p-2.5 sm:p-4 flex flex-col items-center gap-2 sm:gap-3
                           hover:shadow-md transition-all duration-200 hover:-translate-y-1 group cursor-pointer relative"
              >
                {action.badge !== null && (
                  <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${action.color}
                                 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={20} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Content Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Problems Breakdown — 2/3 width on desktop */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>📊 توزيع مشاكلي</CardTitle>
            <Button size="xs" variant="ghost" icon={<ChevronLeft size={14} />}
              onClick={() => setActiveView('employee-problems')}>
              عرض الكل
            </Button>
          </CardHeader>

          {loading ? (
            <div className="flex items-center gap-6">
              <Skeleton className="w-36 h-36 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="w-32 h-32 sm:w-36 sm:h-36 flex-shrink-0 mx-auto sm:mx-0">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                           dataKey="value" paddingAngle={3}>
                        {pieData.map((e, idx) => <Cell key={idx} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} مشاكل`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <CheckCircle size={32} className="mb-2 text-emerald-400" />
                    <p className="text-xs text-center">لا توجد مشاكل</p>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 flex-1 w-full">
                {pieData.length > 0 ? (
                  <>
                    {pieData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <span className="text-xs text-slate-600 truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${(item.value / problems.length) * 100}%`, background: item.color }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-700 w-5 text-left">{item.value}</span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-400 text-center">
                        نسبة الحل: <span className="font-bold text-emerald-600">
                          {problems.length > 0 ? Math.round((resolved / problems.length) * 100) : 0}%
                        </span>
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">لا توجد مشاكل مرفوعة بعد</p>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Wellness Card — 1/3 width */}
        <Card>
          <CardHeader>
            <CardTitle>💚 صحتي النفسية</CardTitle>
            <Button size="xs" variant="ghost" onClick={() => setActiveView('wellness')}>تفاصيل</Button>
          </CardHeader>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <Skeleton className="w-28 h-28 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ) : wellnessToday ? (
            <div className="flex flex-col items-center">
              <WellnessRing score={wellnessToday.score} mood={wellnessToday.mood} />
              <div className="w-full mt-4 space-y-2.5">
                {/* Stress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Activity size={11} /> التوتر
                    </span>
                    <span className={`font-bold ${
                      wellnessToday.stress >= 70 ? 'text-red-500'
                      : wellnessToday.stress >= 40 ? 'text-amber-500'
                      : 'text-emerald-500'}`}>
                      {wellnessToday.stress}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      wellnessToday.stress >= 70 ? 'bg-red-500'
                      : wellnessToday.stress >= 40 ? 'bg-amber-500'
                      : 'bg-emerald-500'}`}
                      style={{ width: `${wellnessToday.stress}%` }}
                    />
                  </div>
                </div>
                {/* Energy bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Heart size={11} /> الطاقة
                    </span>
                    <span className={`font-bold ${
                      wellnessToday.energy >= 70 ? 'text-emerald-500'
                      : wellnessToday.energy >= 40 ? 'text-amber-500'
                      : 'text-red-500'}`}>
                      {wellnessToday.energy}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${
                      wellnessToday.energy >= 70 ? 'bg-emerald-500'
                      : wellnessToday.energy >= 40 ? 'bg-amber-500'
                      : 'bg-red-500'}`}
                      style={{ width: `${wellnessToday.energy}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-4 gap-1">
              <Heart size={32} className="text-rose-300 mb-1" />
              <p className="text-sm text-slate-700 font-semibold">لم تسجّل حالتك اليوم</p>
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">
                سجّل مزاجك يومياً<br />لمتابعة صحتك النفسية
              </p>
              <Button size="xs" variant="outline"
                onClick={() => setActiveView('wellness')}
                icon={<Heart size={12} />} iconPosition="left">
                تسجيل الآن
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* ── Weekly Wellness Chart ─────────────────────────── */}
      {(wellnessHistory.length > 0 || !loading) && (
        <Card>
          <CardHeader>
            <CardTitle>📈 مؤشر المزاج الأسبوعي</CardTitle>
          </CardHeader>
          {loading ? (
            <Skeleton className="h-36 sm:h-44 w-full mt-2" />
          ) : (
            <div className="h-36 sm:h-44 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}
                    formatter={(v) => [`${v}%`, 'المزاج']}
                  />
                  <Area
                    type="monotone" dataKey="score"
                    stroke="#6366f1" strokeWidth={2.5}
                    fill="url(#moodGrad)"
                    dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}

      {/* ── Recent Problems ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>🗂️ آخر مشاكلي</CardTitle>
            {isRealtime && (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                مباشر
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="xs" variant="outline"
              icon={<Plus size={13} />} iconPosition="left"
              onClick={() => setActiveView('new-problem')}>
              رفع مشكلة
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setActiveView('employee-problems')}>
              عرض الكل
            </Button>
          </div>
        </CardHeader>

        {loading ? (
          <div className="space-y-2.5">
            {Array(3).fill(0).map((_, i) => <ProblemRowSkeleton key={i} />)}
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <CheckCircle size={36} className="mx-auto mb-2 text-emerald-300" />
            <p className="text-sm font-semibold">لا توجد مشاكل مرفوعة 🎉</p>
            <p className="text-xs mt-1 text-slate-400">استمر في العمل بهذا الروح!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {problems.slice(0, 4).map(problem => (
              <div
                key={problem.id}
                onClick={() => setActiveView(`problem-detail-${problem.id}`)}
                className="flex items-center gap-3 p-3 sm:p-3.5 bg-slate-50 rounded-xl
                           hover:bg-indigo-50 border border-transparent hover:border-indigo-100
                           cursor-pointer transition-all duration-150 group"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${SEVERITY_COLORS[problem.severity]}`}>
                  <AlertCircle size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">
                    {problem.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {problem.created_at
                      ? format(new Date(problem.created_at), 'dd MMM yyyy', { locale: ar })
                      : 'غير محدد'}
                  </p>
                </div>

                {/* AI urgency mini-bar — hidden on mobile */}
                {problem.ai_analysis?.urgencyLevel !== undefined && (
                  <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] text-slate-400">🤖</span>
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          problem.ai_analysis.urgencyLevel >= 8 ? 'bg-red-500'
                          : problem.ai_analysis.urgencyLevel >= 5 ? 'bg-amber-500'
                          : 'bg-green-500'}`}
                        style={{ width: `${problem.ai_analysis.urgencyLevel * 10}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{problem.ai_analysis.urgencyLevel}</span>
                  </div>
                )}

                <Badge variant={STATUS_VARIANTS[problem.status] as any} size="sm">
                  {STATUS_LABELS[problem.status]}
                </Badge>
                <ChevronLeft size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Motivational Quote ───────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl px-5 py-4">
        <div className="flex items-start gap-3">
          <Award size={20} className="text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-indigo-800 leading-relaxed">"{quote.text}"</p>
            <p className="text-xs text-indigo-400 mt-1.5">— {quote.author}</p>
          </div>
        </div>
      </div>

    </div>
  );
}