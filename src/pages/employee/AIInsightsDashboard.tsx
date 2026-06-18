import { useState, useEffect } from 'react';
import { Brain, Loader, TrendingUp, AlertTriangle, CheckCircle, Users, BarChart3, Clock, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useUIStore } from '../../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AIInsight {
  id: number;
  insight_type: string;
  scope: 'global' | 'department' | 'employee';
  department_id?: string;
  employee_id?: string;
  title: string;
  summary: string;
  data: any;
  severity: 'info' | 'warning' | 'critical';
  generated_at: string;
  valid_until?: string;
}

const INSIGHT_ICONS: Record<string, any> = {
  حضور: Clock,
  شذوذ: AlertTriangle,
  تنبؤ: TrendingUp,
  قسم: Users,
  صحة_قوى_عاملة: BarChart3,
};

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  critical: 'bg-red-50 border-red-200 text-red-700',
};

const SEVERITY_ICONS: Record<string, any> = {
  info: CheckCircle,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

const PIE_COLORS = ['#22C55E', '#EAB308', '#EF4444', '#A855F7', '#3B82F6'];

export default function AIInsightsDashboard() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'patterns' | 'predictions'>('overview');
  const [attendanceStats, setAttendanceStats] = useState<any>(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(50);
      if (!error && data) setInsights(data as AIInsight[]);

      // جلب إحصائيات الحضور
      const { data: summaryData } = await supabase
        .from('attendance_summary')
        .select('*')
        .gte('shift_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
      
      if (summaryData) {
        const total = summaryData.length;
        const lateCount = summaryData.filter((s: any) => s.status === 'متأخر').length;
        const absentCount = summaryData.filter((s: any) => s.status === 'غائب').length;
        const presentCount = summaryData.filter((s: any) => s.status === 'حضور_بوقت').length;
        const vacationCount = summaryData.filter((s: any) => ['مجاز', 'عطلة'].includes(s.status)).length;
        
        setAttendanceStats({
          total, lateCount, absentCount, presentCount, vacationCount,
          lateRate: total > 0 ? Math.round(lateCount / total * 100) : 0,
          absentRate: total > 0 ? Math.round(absentCount / total * 100) : 0,
          pieData: [
            { name: 'حضور', value: presentCount },
            { name: 'متأخر', value: lateCount },
            { name: 'غائب', value: absentCount },
            { name: 'مجاز/عطلة', value: vacationCount },
          ].filter(d => d.value > 0),
        });
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInsights(); }, []);

  const globalInsights = insights.filter(i => i.scope === 'global');
  const criticalInsights = insights.filter(i => i.severity === 'critical');
  const warningInsights = insights.filter(i => i.severity === 'warning');
  const infoInsights = insights.filter(i => i.severity === 'info');

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* الهيدر */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2"><Brain size={24} /> التحليل الذكي</h2>
            <p className="text-white/70 mt-1">تحليلات متقدمة لأنماط الحضور والسلوك باستخدام الذكاء الاصطناعي</p>
          </div>
          <button onClick={fetchInsights} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2">
            <RefreshCw size={16} /> تحديث
          </button>
        </div>
      </div>

      {/* ملخص سريع */}
      {attendanceStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="text-2xl font-extrabold text-indigo-600">{attendanceStats.total}</div>
            <div className="text-xs text-slate-500 font-bold mt-1">إجمالي السجلات (آخر 30 يوم)</div>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
            <div className="text-2xl font-extrabold text-emerald-700">{attendanceStats.lateRate}%</div>
            <div className="text-xs text-emerald-600 font-bold mt-1">نسبة التأخير</div>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <div className="text-2xl font-extrabold text-red-700">{attendanceStats.absentRate}%</div>
            <div className="text-xs text-red-600 font-bold mt-1">نسبة الغياب</div>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <div className="text-2xl font-extrabold text-amber-700">{criticalInsights.length}</div>
            <div className="text-xs text-amber-600 font-bold mt-1">تنبيهات مهمة</div>
          </div>
        </div>
      )}

      {/* تبويبات */}
      <div className="flex gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 overflow-x-auto">
        {[
          { id: 'overview', label: 'نظرة عامة', icon: Brain },
          { id: 'patterns', label: 'أنماط الحضور', icon: BarChart3 },
          { id: 'predictions', label: 'التنبؤات', icon: TrendingUp },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'
              }`}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin" size={32} /></div>
      ) : (
        <div className="space-y-6">
          {/* التبويب: نظرة عامة */}
          {activeTab === 'overview' && (
            <>
              {/* التنبيهات الحرجة */}
              {criticalInsights.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500" /> تنبيهات حرجة</h3>
                  {criticalInsights.slice(0, 5).map(insight => {
                    const Icon = SEVERITY_ICONS[insight.severity];
                    return (
                      <div key={insight.id} className={`p-4 rounded-xl border ${SEVERITY_COLORS[insight.severity]}`}>
                        <div className="flex items-start gap-3">
                          <Icon size={20} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-sm">{insight.title}</h4>
                            <p className="text-sm mt-1 opacity-80">{insight.summary}</p>
                            <p className="text-xs mt-1 opacity-60">{new Date(insight.generated_at).toLocaleDateString('ar-EG')}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* التحذيرات */}
              {warningInsights.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><AlertTriangle size={18} className="text-amber-500" /> تحذيرات</h3>
                  {warningInsights.slice(0, 5).map(insight => (
                    <div key={insight.id} className="p-4 rounded-xl border bg-amber-50 border-amber-200 text-amber-700">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm">{insight.title}</h4>
                          <p className="text-sm mt-1 opacity-80">{insight.summary}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* الرسم البياني الدائري */}
              {attendanceStats?.pieData && attendanceStats.pieData.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-4">توزيع حالات الحضور (آخر 30 يوم)</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={attendanceStats.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {attendanceStats.pieData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* جميع التحليلات */}
              {globalInsights.length > 0 && (
                <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Sparkles size={18} className="text-indigo-500" /> تحليلات النظام</h3>
                  <div className="space-y-3">
                    {globalInsights.map(insight => {
                      const Icon = INSIGHT_ICONS[insight.insight_type] || Brain;
                      return (
                        <div key={insight.id} className="p-4 bg-gradient-to-l from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                          <div className="flex items-start gap-3">
                            <Icon size={20} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-800">{insight.title}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  insight.severity === 'critical' ? 'bg-red-100 text-red-600' :
                                  insight.severity === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                                }`}>{insight.severity}</span>
                              </div>
                              <p className="text-sm text-slate-600 mt-1">{insight.summary}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* التبويب: أنماط الحضور */}
          {activeTab === 'patterns' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-500" /> أنماط الحضور والسلوك</h3>
              {insights.filter(i => i.insight_type === 'حضور' || i.insight_type === 'شذوذ').length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Brain size={48} className="mx-auto mb-4 opacity-30" />
                  <p>لا توجد تحليلات كافية بعد</p>
                  <p className="text-xs mt-2">قم بتشغيل scripts/attendanceAnalytics.py لتوليد التحليلات</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.filter(i => i.insight_type === 'حضور' || i.insight_type === 'شذوذ').map(insight => (
                    <div key={insight.id} className="p-4 bg-gradient-to-l from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-sm text-slate-800">{insight.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{insight.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* التبويب: التنبؤات */}
          {activeTab === 'predictions' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-purple-500" /> التنبؤات والتحليلات المستقبلية</h3>
              {insights.filter(i => i.insight_type === 'تنبؤ').length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-30" />
                  <p>لا توجد تنبؤات متاحة بعد</p>
                  <p className="text-xs mt-2">يتم تحديث التحليلات كل 24 ساعة تلقائياً</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.filter(i => i.insight_type === 'تنبؤ').map(insight => (
                    <div key={insight.id} className="p-4 bg-gradient-to-l from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                      <h4 className="font-bold text-sm text-slate-800">{insight.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{insight.summary}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* إذا لم يكن هناك أي تحليلات */}
          {insights.length === 0 && (
            <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-slate-100">
              <Brain size={64} className="mx-auto mb-4 opacity-30" />
              <p className="font-bold text-lg">لا توجد تحليلات ذكية بعد</p>
              <p className="text-sm mt-2">يتم إنشاء التحليلات تلقائياً كل 24 ساعة</p>
              <p className="text-xs mt-1 text-slate-300">أو يمكنك تشغيل Python Script: scripts/attendanceAnalytics.py</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}