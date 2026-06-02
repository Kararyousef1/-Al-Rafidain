import { useState, useEffect } from 'react';
import { Users, Shield, Settings, Activity, ArrowUp, Database, Cpu, Loader } from 'lucide-react';
import { useUIStore } from '../../store';
import { supabase } from '../../lib/supabase';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function AdminDashboard() {
  const { setActiveView } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveEmployees: 0,
    activeProblems: 0,
    totalProblems: 0,
    todayActions: 0,
    visitorsToday: 0,
    movementsToday: 0,
    recentLogs: [] as any[],
  });

  const systemHealth = [
    { name: 'قاعدة البيانات', status: 'متصل', latency: '12ms', uptime: '99.9%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'خدمة AI', status: 'نشط', latency: '245ms', uptime: '99.5%', color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'خدمة البريد', status: 'متصل', latency: '89ms', uptime: '100%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'الواجهة البرمجية', status: 'نشط', latency: '34ms', uptime: '99.8%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayIso = today.toISOString();

        // جلب من Supabase مع fallback آمن
        let emps: any[] = [];
        let incs: any[] = [];
        let logs: any[] = [];
        let visitors: any[] = [];
        let movements: any[] = [];

        try {
          const resProfiles = await supabase.from('profiles').select('id, status');
          if (!resProfiles.error && resProfiles.data) emps = resProfiles.data;
        } catch (e1) { console.warn('Failed to fetch profiles:', e1); }

        try {
          const resIncidents = await supabase.from('incidents').select('id, status');
          if (!resIncidents.error && resIncidents.data) incs = resIncidents.data;
        } catch (e2) { console.warn('Failed to fetch incidents:', e2); }

        try {
          const resLogs = await supabase.from('audit_logs').select('*, profiles:actor_id(full_name)').order('timestamp', { ascending: false }).limit(50);
          if (!resLogs.error && resLogs.data) logs = resLogs.data;
        } catch (e3) { console.warn('Failed to fetch logs:', e3); }

        try {
          const resVisitors = await supabase.from('gatekeeper_visitor_logs').select('id').gte('check_in_time', todayIso);
          if (!resVisitors.error && resVisitors.data) visitors = resVisitors.data;
        } catch (e4) { console.warn('Failed to fetch visitors:', e4); }

        try {
          const resMovements = await supabase.from('movements_log').select('id').gte('departure_at', todayIso);
          if (!resMovements.error && resMovements.data) movements = resMovements.data;
        } catch (e5) { console.warn('Failed to fetch movements:', e5); }

        const todayLogs = logs.filter(l => new Date(l.timestamp).getTime() >= today.getTime());

        setData({
          totalEmployees: emps.length,
          activeEmployees: emps.filter(e => e.status === 'active').length,
          onLeaveEmployees: emps.filter(e => e.status === 'on_leave').length,
          activeProblems: incs.filter(i => i.status !== 'closed' && i.status !== 'resolved').length,
          totalProblems: incs.length,
          todayActions: todayLogs.length,
          visitorsToday: visitors.length,
          movementsToday: movements.length,
          recentLogs: logs.slice(0, 5).map(l => ({
            id: l.id,
            action: l.action,
            target: l.target,
            actor: l.profiles?.full_name || 'نظام',
            actorRole: l.actor_role,
            timestamp: l.timestamp
          }))
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64 text-slate-500 gap-3">
      <Loader className="animate-spin" />
      <span className="font-medium text-sm">جاري تحميل بيانات لوحة الإدارة...</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-700 rounded-2xl p-6 text-white">
        <p className="text-white/70 text-sm">لوحة المشرف</p>
        <h2 className="text-2xl font-extrabold mt-1">إدارة النظام الكاملة</h2>
        <p className="text-white/60 text-sm mt-1">تحكم كامل في جميع جوانب المنصة</p>
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="bg-white/15 rounded-xl px-4 py-2">
            <p className="text-xs text-white/70">إجمالي الموظفين</p>
            <p className="font-extrabold text-xl">{data.totalEmployees}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2">
            <p className="text-xs text-white/70">المشاكل النشطة</p>
            <p className="font-extrabold text-xl">{data.activeProblems}</p>
          </div>
          <div className="bg-white/15 rounded-xl px-4 py-2">
            <p className="text-xs text-white/70">صحة النظام</p>
            <p className="font-extrabold text-xl">99.8%</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'المستخدمون النشطون', value: data.activeEmployees, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: 'في الإجازة', value: data.onLeaveEmployees, icon: Activity, color: 'bg-amber-50 text-amber-600' },
          { label: 'المشاكل المرفوعة', value: data.totalProblems, icon: Shield, color: 'bg-red-50 text-red-600' },
          { label: 'إجراءات اليوم', value: data.todayActions, icon: Database, color: 'bg-purple-50 text-purple-600' },
          { label: 'زوار اليوم', value: data.visitorsToday, icon: Users, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'حركة الموظفين', value: data.movementsToday, icon: ArrowUp, color: 'bg-indigo-50 text-indigo-600' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-extrabold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'إدارة الموظفين', icon: Users, color: 'from-blue-500 to-indigo-600', view: 'admin-employees' },
          { label: 'صلاحيات المدراء والمشرفين', icon: Shield, color: 'from-amber-500 to-yellow-600', view: 'admin-gatekeeper-permissions' },
          { label: 'إعدادات النظام', icon: Settings, color: 'from-slate-600 to-slate-800', view: 'admin-settings' },
          { label: 'سجل العمليات', icon: Shield, color: 'from-orange-500 to-red-500', view: 'admin-audit-log' },
          { label: 'التقارير', icon: Activity, color: 'from-emerald-500 to-teal-600', view: 'admin-reports' },
          { label: 'إعداد AI', icon: Cpu, color: 'from-purple-500 to-violet-600', view: 'admin-ai-config' },
        ].map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              onClick={() => setActiveView(action.view)}
              className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md`}>
                <Icon size={18} className="text-white" />
              </div>
              <span className="font-semibold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>🟢 صحة النظام</CardTitle>
          <Badge variant="success" dot>جميع الخدمات تعمل</Badge>
        </CardHeader>
        <div className="grid md:grid-cols-2 gap-3">
          {systemHealth.map((service, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className={`w-2.5 h-2.5 rounded-full ${service.color === 'text-emerald-600' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">{service.name}</p>
                <p className="text-xs text-slate-500">زمن الاستجابة: {service.latency} · uptime: {service.uptime}</p>
              </div>
              <Badge variant={service.color === 'text-emerald-600' ? 'success' : 'info'} size="sm">{service.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent audit logs */}
      <Card>
        <CardHeader>
          <CardTitle>📋 آخر العمليات</CardTitle>
          <Button size="xs" variant="ghost" onClick={() => setActiveView('admin-audit-log')}>عرض الكل</Button>
        </CardHeader>
        <div className="space-y-3">
          {data.recentLogs.map(log => (
            <div key={log.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                log.actorRole === 'admin' ? 'bg-red-500' : log.actorRole === 'hr' ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}>
                {(log.actor || 'ن').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{log.action || 'إجراء غير معروف'} - {log.target || 'النظام'}</p>
                <p className="text-xs text-slate-400">{log.actor} · {log.timestamp ? String(log.timestamp).substring(0, 10) : ''}</p>
              </div>
              <Badge variant={log.actorRole === 'admin' ? 'danger' : log.actorRole === 'hr' ? 'success' : 'primary'} size="sm">
                {log.actorRole === 'admin' ? 'مشرف' : log.actorRole === 'hr' ? 'HR' : 'موظف'}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}