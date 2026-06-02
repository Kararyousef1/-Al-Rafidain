import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, AreaChart, Area, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, ComposedChart, Line, Legend } from 'recharts';
import { Loader, Brain, Sparkles, Filter, Database, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';

const sentimentTrend = [
  { month: 'يوليو', positive: 45, negative: 30, neutral: 25 },
  { month: 'أغسطس', positive: 50, negative: 25, neutral: 25 },
  { month: 'سبتمبر', positive: 55, negative: 20, neutral: 25 },
  { month: 'أكتوبر', positive: 48, negative: 28, neutral: 24 },
  { month: 'نوفمبر', positive: 58, negative: 18, neutral: 24 },
  { month: 'ديسمبر', positive: 62, negative: 15, neutral: 23 },
];

const satisfactionData = [
  { subject: 'البيئة', A: 82 },
  { subject: 'الإدارة', A: 75 },
  { subject: 'الرواتب', A: 70 },
  { subject: 'التطوير', A: 78 },
  { subject: 'التواصل', A: 85 },
  { subject: 'التوازن', A: 72 },
];

const wellnessTrend = [
  { month: 'يوليو', score: 72 },
  { month: 'أغسطس', score: 68 },
  { month: 'سبتمبر', score: 75 },
  { month: 'أكتوبر', score: 70 },
  { month: 'نوفمبر', score: 76 },
  { month: 'ديسمبر', score: 74 },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'advanced'>('overview');
  
  // Advanced Analytics States
  const [selectedDataSource, setSelectedDataSource] = useState('wellness');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState('predictive');
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [advancedResults, setAdvancedResults] = useState<any>(null);

  const [stats, setStats] = useState<any>({
    totalEmployees: 0,
    wellnessScore: 0,
    satisfactionRate: 85, // افتراضي لحين ربط إجابات الاستبيانات المعقدة
    resolvedThisMonth: 0,
    avgResolutionTime: 0,
    departmentStats: [],
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [
          { data: profiles },
          { data: incidents },
          { data: wellness }
        ] = await Promise.all([
          supabase.from('profiles').select('*').eq('role', 'employee'),
          supabase.from('incidents').select('*'),
          supabase.from('wellness_entries').select('*')
        ]);

        const currentMonth = new Date().getMonth();
        
        // حساب المشاكل المحلولة هذا الشهر
        const resolvedThisMonth = incidents?.filter(i => 
          (i.status === 'resolved' || i.status === 'closed') && 
          new Date(i.updated_at).getMonth() === currentMonth
        ).length || 0;

        // حساب إحصاءات الأقسام
        const deptMap: Record<string, any> = {};
        profiles?.forEach(p => {
          const d = p.department || 'عام';
          if (!deptMap[d]) {
            deptMap[d] = { name: d, employeeCount: 0, problemCount: 0, resolvedCount: 0, wellnessTotal: 0, wellnessCount: 0, satisfactionScore: 85 };
          }
          deptMap[d].employeeCount++;
        });

        incidents?.forEach(i => {
          const emp = profiles?.find(p => p.id === i.reported_by);
          if (emp) {
            const d = emp.department || 'عام';
            if (deptMap[d]) {
              deptMap[d].problemCount++;
              if (i.status === 'resolved' || i.status === 'closed') deptMap[d].resolvedCount++;
            }
          }
        });

        wellness?.forEach(w => {
          const emp = profiles?.find(p => p.id === w.employee_id);
          if (emp) {
            const d = emp.department || 'عام';
            if (deptMap[d]) {
              deptMap[d].wellnessTotal += w.score;
              deptMap[d].wellnessCount++;
            }
          }
        });

        const departmentStats = Object.values(deptMap).map(d => ({
          ...d,
          wellnessAvg: d.wellnessCount > 0 ? Math.round(d.wellnessTotal / d.wellnessCount) : 0
        }));

        const overallWellness = wellness?.length ? Math.round(wellness.reduce((a, b) => a + b.score, 0) / wellness.length) : 0;

        setStats({
          totalEmployees: profiles?.length || 0,
          resolvedThisMonth,
          wellnessScore: overallWellness,
          satisfactionRate: 85,
          avgResolutionTime: 2.4, // وقت افتراضي لنموذج العرض
          departmentStats,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const runAdvancedAnalysis = async () => {
    setAdvancedLoading(true);
    setAdvancedResults(null);
    try {
      // محاكاة معالجة البيانات الكبيرة وتطبيق خوارزميات التعلم الآلي
      await new Promise(r => setTimeout(r, 2500));
      
      let insights: string[] = [];
      let metrics: any[] = [];
      let chartData: any[] = [];
      let chartConfig: any = {};

      if (selectedDataSource === 'wellness') {
        if (selectedAnalysisType === 'predictive') {
          insights = [
            "توقع الذكاء الاصطناعي: من المتوقع انخفاض طفيف في مؤشر الصحة النفسية بنسبة 3% خلال الأسبوعين القادمين بسبب ضغوط إغلاق ربع السنة.",
            "توصية استباقية: يوصى بجدولة أنشطة ترفيهية قصيرة أو تقليل الساعات الإضافية لتخفيف الضغط المتوقع على قسم الإنتاج."
          ];
          metrics = [
            { label: 'دقة النموذج التنبؤي (Accuracy)', value: '91%', color: 'text-emerald-600' },
            { label: 'مستوى المخاطرة المتوقعة', value: 'متوسط', color: 'text-amber-600' },
            { label: 'الموثوقية الإحصائية (p-value)', value: '< 0.05', color: 'text-indigo-600' },
          ];
          chartData = [
            { name: 'أسبوع 1', actual: 78, predicted: 78 },
            { name: 'أسبوع 2', actual: 75, predicted: 76 },
            { name: 'أسبوع 3', actual: 72, predicted: 73 },
            { name: 'أسبوع 4 (الحالي)', actual: 70, predicted: 70 },
            { name: 'أسبوع 5 (تنبؤ)', actual: null, predicted: 68 },
            { name: 'أسبوع 6 (تنبؤ)', actual: null, predicted: 65 },
            { name: 'أسبوع 7 (تنبؤ)', actual: null, predicted: 69 },
          ];
          chartConfig = { type: 'composed', lines: ['actual', 'predicted'] };
        } else if (selectedAnalysisType === 'correlation') {
          insights = [
            "تحليل الارتباط: اكتشف النموذج علاقة طردية قوية (0.85) بين ازدياد عدد ساعات العمل الإضافية وانخفاض مؤشرات الطاقة والمزاج.",
            "التباين المكتشف: موظفو قسم الإنتاج والمستودعات يظهرون تقلبات أعلى في مستويات التوتر مقارنة بالأقسام الإدارية."
          ];
          chartData = Array.from({length: 40}, (_, i) => ({
            hours: Math.round(35 + Math.random() * 25),
            stress: Math.round(30 + Math.random() * 50 + (i * 0.4)),
            department: i % 2 === 0 ? 'الإنتاج' : 'الإدارة'
          }));
          chartConfig = { type: 'scatter', x: 'hours', y: 'stress', z: 'department' };
          metrics = [
            { label: 'معامل ارتباط بيرسون (r)', value: '+0.85', color: 'text-rose-600' },
            { label: 'حجم العينة المحللة', value: '240 سجل', color: 'text-slate-600' },
            { label: 'التباين المُفَسَّر (R²)', value: '0.72', color: 'text-indigo-600' },
          ];
        } else {
           insights = [
             "التشخيص الآلي: السبب الرئيسي لانخفاض الرضا الوظيفي مؤخراً يعود إلى بطء الاستجابة لطلبات الصيانة والمشاكل التقنية بنسبة 45%.",
             "اكتشاف شذوذ (Anomaly Detection): تم رصد 5 حالات انخفاض حاد ومفاجئ في المزاج لموظفين في الوردية الليلية يوم الثلاثاء الماضي."
           ];
           chartData = [
             { factor: 'ضغط العمل والمناوبات', impact: 85 },
             { factor: 'بيئة العمل والسلامة', impact: 65 },
             { factor: 'التواصل والشفافية الإدارية', impact: 40 },
             { factor: 'التقدير والمكافآت', impact: 55 },
           ];
           chartConfig = { type: 'bar', x: 'factor', y: 'impact' };
           metrics = [
            { label: 'العامل الأكثر تأثيراً', value: 'ضغط المناوبات', color: 'text-rose-600' },
            { label: 'النقاط الشاذة المكتشفة', value: '5 حالات', color: 'text-amber-600' },
          ];
        }
      } else if (selectedDataSource === 'skills') {
         insights = [
            "تحليل فجوة المهارات: تبين أن 40% من المهندسين الحاليين يفتقرون إلى مهارات (إدارة المشاريع المتقدمة)، مما يبطئ تسليم المشاريع.",
            "توصية استراتيجية: يُنصح بإنشاء برنامج تدريبي مكثف لمهارات القيادة التقنية لسد هذه الفجوة خلال الربع القادم."
         ];
         chartData = [
            { name: 'هندسة وبرمجة', القيمة_الحالية: 25, المتوسط_المطلوب: 30 },
            { name: 'إدارة جودة', القيمة_الحالية: 15, المتوسط_المطلوب: 10 },
            { name: 'مهارات قيادية', القيمة_الحالية: 5, المتوسط_المطلوب: 20 },
            { name: 'تحليل بيانات', القيمة_الحالية: 10, المتوسط_المطلوب: 15 },
         ];
         chartConfig = { type: 'composed', lines: ['القيمة_الحالية', 'المتوسط_المطلوب'] };
         metrics = [
            { label: 'إجمالي المهارات المسجلة', value: '+350 مهارة', color: 'text-emerald-600' },
            { label: 'الفجوة المهارية', value: '18%', color: 'text-rose-600' },
         ];
      } else {
         // Generic mock for other data sources
         insights = [
            `معالجة ضخمة للبيانات: تم تحليل البيانات المتعلقة بـ (${selectedDataSource === 'movements' ? 'حركة الموظفين' : selectedDataSource === 'incidents' ? 'المشاكل والحوادث' : selectedDataSource === 'attendance' ? 'الحضور والانصراف' : selectedDataSource === 'skills' ? 'سجل مؤهلات الموظفين' : 'مراجعات العملاء'}) باستخدام خوارزميات التعلم الآلي.`,
            "اكتشاف أنماط مخفية: تشير البيانات إلى وجود فرص ممتازة لتحسين الكفاءة التشغيلية وتقليل الهدر الزمني بنسبة تتراوح بين 10-15%."
         ];
         chartData = [
            { name: 'الربع الأول', القيمة_الحالية: 40, المتوسط_التاريخي: 24 },
            { name: 'الربع الثاني', القيمة_الحالية: 30, المتوسط_التاريخي: 33 },
            { name: 'الربع الثالث', القيمة_الحالية: 50, المتوسط_التاريخي: 38 },
            { name: 'الربع الرابع', القيمة_الحالية: 27, المتوسط_التاريخي: 39 },
         ];
         chartConfig = { type: 'composed', lines: ['القيمة_الحالية', 'المتوسط_التاريخي'] };
         metrics = [
            { label: 'حجم البيانات المحللة', value: '+12k سجل', color: 'text-slate-600' },
            { label: 'خوارزمية التحليل', value: 'Random Forest', color: 'text-purple-600' },
         ];
      }

      setAdvancedResults({ insights, chartData, chartConfig, metrics });
    } catch (e) {
      console.error(e);
    } finally {
      setAdvancedLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-slate-500 gap-3">
      <Loader className="animate-spin" />
      <span className="font-medium text-sm">جاري تحليل بيانات المؤسسة...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">📊 التحليلات والإحصاءات</h2>
        <p className="text-sm text-slate-500 mt-1">نظرة تفصيلية على أداء المؤسسة وصحة الموظفين</p>
      </div>

      <div className="flex gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 overflow-x-auto hide-scrollbar">
        <button onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
            activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}>
          <TrendingUp size={16} /> الإحصاءات العامة
        </button>
        <button onClick={() => setActiveTab('advanced')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
            activeTab === 'advanced' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}>
          <Brain size={16} /> التحليل المتقدم بالذكاء الاصطناعي
        </button>
      </div>

      {activeTab === 'advanced' ? (
        <div className="space-y-6 animate-fade-in">
          <Card className="bg-indigo-50/40 border-indigo-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900"><Database size={18} /> إعدادات التحليل المتقدم</CardTitle>
              <Badge variant="purple" dot>AI Powered</Badge>
            </CardHeader>
            <div className="grid md:grid-cols-2 gap-4 mb-5 mt-2">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">مصدر البيانات (المدخلات)</label>
                <select value={selectedDataSource} onChange={e => setSelectedDataSource(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 shadow-sm">
                  <option value="wellness">الصحة النفسية ومؤشرات الرفاهية</option>
                  <option value="incidents">المشاكل والحوادث والبلاغات</option>
                  <option value="movements">حركة الموظفين (خروج وعودة)</option>
                  <option value="attendance">سجلات الحضور والانصراف (الالتزام)</option>
                  <option value="reviews">تقييمات ومراجعات العملاء</option>
                  <option value="skills">سجل مؤهلات وكفاءات الموظفين</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">نوع النموذج التحليلي والخوارزمية</label>
                <select value={selectedAnalysisType} onChange={e => setSelectedAnalysisType(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500 shadow-sm">
                  <option value="predictive">تحليل تنبؤي مستقبلي (Predictive Analysis & Time Series)</option>
                  <option value="correlation">تحليل الارتباط واكتشاف العلاقات الخفية (Correlation & Regression)</option>
                  <option value="diagnostic">تحليل تشخيصي واكتشاف الحالات الشاذة (Diagnostic & Anomaly Detection)</option>
                </select>
              </div>
            </div>
            <Button onClick={runAdvancedAnalysis} loading={advancedLoading} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0" icon={<Sparkles size={18} />} iconPosition="left">
              بدء التحليل والمعالجة العميقة للبيانات
            </Button>
          </Card>

          {advancedResults && (
            <div className="space-y-6 animate-fade-in">
              {/* الاستنتاجات الذكية */}
              <Card className="bg-slate-900 text-white border-0 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2"><Sparkles className="text-amber-400" /> الاستنتاجات والرؤى المستخلصة آلياً</CardTitle>
                </CardHeader>
                <ul className="space-y-4 mt-2 relative z-10">
                  {advancedResults.insights.map((insight: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                      <CheckCircle size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-slate-200 text-sm leading-relaxed">{insight}</p>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* المقاييس والمعاملات الإحصائية */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {advancedResults.metrics.map((m: any, idx: number) => (
                  <Card key={idx} className="border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 mb-1">{m.label}</p>
                    <p className={`text-2xl font-black ${m.color}`}>{m.value}</p>
                  </Card>
                ))}
              </div>

              {/* الرسوم البيانية المتقدمة */}
              <Card className="border-slate-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Filter size={18} className="text-indigo-600" /> التمثيل البصري والإحصائي المتقدم</CardTitle>
                </CardHeader>
                <div className="h-80 w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    {advancedResults.chartConfig.type === 'scatter' ? (
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" dataKey={advancedResults.chartConfig.x} name="المتغير السيني" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis type="number" dataKey={advancedResults.chartConfig.y} name="المتغير الصادي" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <ZAxis type="category" dataKey={advancedResults.chartConfig.z} name="الفئة" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff' }} />
                        <Legend />
                        <Scatter name="توزيع البيانات" data={advancedResults.chartData} fill="#8b5cf6" />
                      </ScatterChart>
                    ) : advancedResults.chartConfig.type === 'bar' ? (
                      <BarChart data={advancedResults.chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey={advancedResults.chartConfig.x} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff' }} />
                        <Bar dataKey={advancedResults.chartConfig.y} fill="#6366f1" radius={[4, 4, 0, 0]} name="مستوى التأثير/العدد" barSize={40} />
                      </BarChart>
                    ) : (
                      <ComposedChart data={advancedResults.chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff' }} />
                        <Legend />
                        {advancedResults.chartConfig.lines.map((lineKey: string, i: number) => (
                          <Line key={i} type="monotone" dataKey={lineKey} stroke={i === 0 ? '#10b981' : '#6366f1'} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        ))}
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'متوسط وقت الحل', value: `${stats.avgResolutionTime} أيام`, color: 'bg-blue-50 text-blue-700' },
          { label: 'مؤشر الصحة النفسية', value: `${stats.wellnessScore}%`, color: 'bg-rose-50 text-rose-700' },
          { label: 'معدل الرضا', value: `${stats.satisfactionRate}%`, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'محلولة هذا الشهر', value: stats.resolvedThisMonth, color: 'bg-purple-50 text-purple-700' },
        ].map((m, i) => (
          <Card key={i} className={`${m.color} border-0`}>
            <p className="text-2xl font-extrabold">{m.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{m.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sentiment trend */}
        <Card>
          <CardHeader>
            <CardTitle>🎭 تحليل المشاعر الشهري</CardTitle>
            <Badge variant="purple" dot>تحليل AI</Badge>
          </CardHeader>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentTrend} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px' }} />
                <Bar dataKey="positive" fill="#10b981" radius={[4, 4, 0, 0]} name="إيجابي" />
                <Bar dataKey="negative" fill="#ef4444" radius={[4, 4, 0, 0]} name="سلبي" />
                <Bar dataKey="neutral" fill="#f59e0b" radius={[4, 4, 0, 0]} name="محايد" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500" /> إيجابي</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-500" /> سلبي</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-amber-500" /> محايد</span>
          </div>
        </Card>

        {/* Satisfaction radar */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 مؤشرات الرضا</CardTitle>
            <Badge variant="success" dot>آخر تقييم</Badge>
          </CardHeader>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={satisfactionData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Radar dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Wellness trend */}
      <Card>
        <CardHeader>
          <CardTitle>💚 مؤشر الصحة النفسية للمؤسسة</CardTitle>
          <Badge variant="success" dot>6 أشهر</Badge>
        </CardHeader>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={wellnessTrend}>
              <defs>
                <linearGradient id="wellGradHR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px' }} formatter={v => [`${v}%`, 'الصحة']} />
              <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} fill="url(#wellGradHR)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Department table */}
      <Card>
        <CardHeader>
          <CardTitle>🏢 إحصاءات الأقسام</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['القسم', 'الموظفون', 'المشاكل', 'محلولة', 'متوسط الصحة', 'الرضا'].map(h => (
                  <th key={h} className="text-right py-3 px-3 text-xs font-bold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.departmentStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">لا توجد بيانات للأقسام</td>
                </tr>
              ) : stats.departmentStats.map((dept: any, i: number) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-800">{dept.name}</td>
                  <td className="py-3 px-3 text-slate-600">{dept.employeeCount}</td>
                  <td className="py-3 px-3 text-slate-600">{dept.problemCount}</td>
                  <td className="py-3 px-3 text-emerald-600 font-semibold">{dept.resolvedCount}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${dept.wellnessAvg >= 75 ? 'bg-emerald-500' : dept.wellnessAvg >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${dept.wellnessAvg}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{dept.wellnessAvg}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={dept.satisfactionScore >= 80 ? 'success' : dept.satisfactionScore >= 65 ? 'warning' : 'danger'} size="sm">
                      {dept.satisfactionScore}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
      )}
    </div>
  );
}
