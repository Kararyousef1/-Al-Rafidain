import React, { useState, useEffect, useRef } from 'react';
import {
  Server, Database, Activity, Zap, Wifi, HardDrive, Shield, AlertTriangle,
  RefreshCw, Clock, TrendingUp, Cpu, BarChart3, Globe, Users, Mail,
  Play, Pause, Download, Upload, ChevronDown, ChevronUp, X, CheckCircle2,
  AlertCircle, Network, Monitor
} from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../../ui/Card';
import Badge from '../../ui/Badge';
import { useUIStore } from '../../../../core/stores';

// ── Types ─────────────────────────────────────────────────────────────────────
interface MetricPoint {
  timestamp: string;
  value: number;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastCheck: string;
  icon: React.ComponentType<any>;
  metrics: MetricPoint[];
  description: string;
  version: string;
}

interface SystemResources {
  cpu: number;
  memory: number;
  storage: number;
  network: { upload: number; download: number };
  activeConnections: number;
  requestsPerMinute: number;
}

interface RealtimeEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  latency: number;
  data: string;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const generateMetricPoints = (count = 20): MetricPoint[] => {
  const points: MetricPoint[] = [];
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    points.push({ timestamp: new Date(now - i * 5000).toISOString(), value: Math.floor(Math.random() * 100) });
  }
  return points;
};

const initialServices: ServiceHealth[] = [
  { name: 'قاعدة البيانات الرئيسية', status: 'healthy', latency: 12, uptime: 99.99, lastCheck: new Date().toISOString(), icon: Database, metrics: generateMetricPoints(), description: 'PostgreSQL Supabase', version: '15.1' },
  { name: 'خدمة المصادقة', status: 'healthy', latency: 8, uptime: 99.98, lastCheck: new Date().toISOString(), icon: Shield, metrics: generateMetricPoints(), description: 'Supabase Auth + JWT', version: '2.8.0' },
  { name: 'التخزين السحابي', status: 'healthy', latency: 45, uptime: 99.95, lastCheck: new Date().toISOString(), icon: HardDrive, metrics: generateMetricPoints(), description: 'Supabase Storage', version: '1.5.2' },
  { name: 'الاشتراكات الفورية', status: 'healthy', latency: 25, uptime: 99.87, lastCheck: new Date().toISOString(), icon: Wifi, metrics: generateMetricPoints(), description: 'Realtime WebSocket', version: '2.0.0' },
  { name: 'الدوال الحافة', status: 'healthy', latency: 35, uptime: 99.97, lastCheck: new Date().toISOString(), icon: Zap, metrics: generateMetricPoints(), description: 'Edge Functions Deno', version: '1.12.0' },
  { name: 'خدمة البريد', status: 'healthy', latency: 120, uptime: 99.92, lastCheck: new Date().toISOString(), icon: Mail, metrics: generateMetricPoints(), description: 'SMTP Email', version: '3.2.1' },
  { name: 'شبكة CDN', status: 'healthy', latency: 5, uptime: 99.99, lastCheck: new Date().toISOString(), icon: Globe, metrics: generateMetricPoints(), description: 'Netlify Edge', version: '2.0' },
  { name: 'خدمة التحليلات', status: 'degraded', latency: 230, uptime: 98.50, lastCheck: new Date().toISOString(), icon: BarChart3, metrics: generateMetricPoints(), description: 'Analytics Engine', version: '1.0.0-beta' },
];

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Sparkline({ data, color = 'emerald', height = 32 }: { data: MetricPoint[]; color?: string; height?: number }) {
  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 100;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} className={`text-${color}-500`} />
    </svg>
  );
}

// ── MetricBar ─────────────────────────────────────────────────────────────────
function MetricBar({ label, value, max, color = 'emerald', unit = '%' }: { label: string; value: number; max: number; color?: string; unit?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const colors: Record<string, string> = { emerald: 'from-emerald-500 to-emerald-400', amber: 'from-amber-500 to-amber-400', rose: 'from-rose-500 to-rose-400', blue: 'from-blue-500 to-blue-400', cyan: 'from-cyan-500 to-cyan-400' };
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs"><span className="text-gray-600">{label}</span><span className="font-mono text-gray-900 font-bold">{value}{unit}</span></div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${colors[color] || colors.emerald} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Service Card ──────────────────────────────────────────────────────────────
function ServiceCard({ service }: { service: ServiceHealth }) {
  const cfg = {
    healthy: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'سليم', pulse: 'bg-emerald-400' },
    degraded: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: 'متدهور', pulse: 'bg-amber-400' },
    down: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', label: 'معطل', pulse: 'bg-rose-400' },
  };
  const c = cfg[service.status];
  const Icon = service.icon;
  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 group">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}><Icon size={20} className={c.text} /></div>
            <div><span className="text-sm font-bold text-gray-900 block">{service.name}</span><span className="text-xs text-gray-500">{service.description}</span></div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${c.pulse} animate-pulse`} />
            <span className={`text-xs font-bold ${c.text}`}>{c.label}</span>
          </div>
        </div>
        <div className="flex justify-center mb-3">
          <Sparkline data={service.metrics} color={service.status === 'healthy' ? 'emerald' : service.status === 'degraded' ? 'amber' : 'rose'} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <span className="text-gray-500 block">زمن الاستجابة</span>
            <span className="text-gray-900 font-mono font-bold">{service.latency}ms</span>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <span className="text-gray-500 block">مدة التشغيل</span>
            <span className={`font-mono font-bold ${service.uptime >= 99.9 ? 'text-emerald-600' : service.uptime >= 99 ? 'text-amber-600' : 'text-rose-600'}`}>{service.uptime}%</span>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <span className="text-gray-500 block">الإصدار</span>
            <span className="text-gray-900 font-mono font-bold">{service.version}</span>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            <span className="text-gray-500 block">آخر فحص</span>
            <span className="text-gray-900 font-mono font-bold text-[10px]">{new Date(service.lastCheck).toLocaleTimeString('ar-SA')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Service Detail Modal ──────────────────────────────────────────────────────
function ServiceDetailModal({ service, onClose }: { service: ServiceHealth; onClose: () => void }) {
  const Icon = service.icon;
  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center"><Icon size={20} className="text-emerald-700" /></div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
              <p className="text-xs text-gray-500">{service.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'الحالة', value: service.status === 'healthy' ? 'سليم' : service.status === 'degraded' ? 'متدهور' : 'معطل', icon: Activity },
              { label: 'زمن الاستجابة', value: `${service.latency}ms`, icon: Clock },
              { label: 'مدة التشغيل', value: `${service.uptime}%`, icon: TrendingUp },
              { label: 'الإصدار', value: service.version, icon: Shield },
            ].map((item, i) => {
              const Icn = item.icon;
              return (
                <div key={i} className="bg-gray-100 rounded-xl p-3 border border-gray-200">
                  <Icn size={14} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500 block">{item.label}</span>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{item.value}</p>
                </div>
              );
            })}
          </div>
          <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
            <span className="text-sm font-bold text-gray-700 block mb-2">مؤشرات الأداء (آخر 20 نقطة)</span>
            <div className="flex justify-center"><Sparkline data={service.metrics} height={48} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SystemMonitor() {
  const { addToast } = useUIStore();
  const [services, setServices] = useState<ServiceHealth[]>(initialServices);
  const [resources, setResources] = useState<SystemResources>({
    cpu: 34, memory: 62, storage: 78,
    network: { upload: 1.2, download: 3.5 },
    activeConnections: 128, requestsPerMinute: 450,
  });
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'realtime'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceHealth | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [realtimeEvents]);

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setResources(prev => ({
        ...prev,
        cpu: Math.floor(Math.random() * 40) + 20,
        memory: Math.floor(Math.random() * 30) + 40,
        network: { upload: +(Math.random() * 3 + 0.5).toFixed(1), download: +(Math.random() * 5 + 1).toFixed(1) },
        activeConnections: Math.floor(Math.random() * 100) + 50,
        requestsPerMinute: Math.floor(Math.random() * 500) + 200,
      }));
      setServices(prev => prev.map(s => ({
        ...s,
        latency: Math.max(1, s.latency + Math.floor(Math.random() * 10) - 5),
        metrics: [...s.metrics.slice(1), { timestamp: new Date().toISOString(), value: Math.floor(Math.random() * 100) }],
        lastCheck: new Date().toISOString(),
      })));
      const types = ['INSERT', 'UPDATE', 'DELETE'];
      const sources = ['profiles', 'incidents', 'audit_logs', 'survey_responses'];
      setRealtimeEvents(prev => [...prev.slice(-99), {
        id: `evt-${Date.now()}`,
        type: types[Math.floor(Math.random() * types.length)],
        source: sources[Math.floor(Math.random() * sources.length)],
        timestamp: new Date().toISOString(),
        latency: Math.floor(Math.random() * 50) + 5,
        data: `تغيير في ${sources[Math.floor(Math.random() * sources.length)]}`,
      }]);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const healthPct = Math.round((services.filter(s => s.status === 'healthy').length / services.length) * 100);

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: Activity },
    { id: 'services', label: 'الخدمات', icon: Server },
    { id: 'realtime', label: 'الأحداث الفورية', icon: Wifi },
  ];

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Activity size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                مراقبة النظام
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${healthPct >= 99 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                  {healthPct}% صحي
                </span>
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">مراقبة حية لجميع خدمات النظام والأداء</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAutoRefresh(!autoRefresh)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-bold text-sm ${autoRefresh ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
              {autoRefresh ? <Pause size={14} /> : <Play size={14} />}
              {autoRefresh ? 'تحديث تلقائي' : 'متوقف'}
            </button>
            <button onClick={() => addToast('تم تحديث جميع البيانات', 'success')} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-gray-200 shadow-md">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}>
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Resource Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'المعالج (CPU)', value: resources.cpu, max: 100, icon: Cpu, color: 'cyan' },
              { label: 'الذاكرة (RAM)', value: resources.memory, max: 100, icon: Database, color: 'violet' },
              { label: 'التخزين', value: resources.storage, max: 100, icon: HardDrive, color: 'amber' },
              { label: 'الاتصالات النشطة', value: resources.activeConnections, max: 500, icon: Network, color: 'blue', unit: '' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon size={16} className={`text-${item.color}-600`} />
                    <span className="text-xs text-gray-500">{item.label}</span>
                  </div>
                  <p className="text-2xl font-black text-gray-900 font-mono">{item.value}{item.unit || '%'}</p>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r from-${item.color}-500 to-${item.color}-400 rounded-full transition-all duration-500`} style={{ width: `${(item.value / item.max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-600" /> أداء الشبكة</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1"><Download size={14} className="text-blue-600" /><span className="text-xs text-gray-500">تحميل</span></div>
                  <p className="text-lg font-black text-gray-900 font-mono">{resources.network.download} <span className="text-xs font-normal text-gray-500">MB/s</span></p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1"><Upload size={14} className="text-violet-600" /><span className="text-xs text-gray-500">رفع</span></div>
                  <p className="text-lg font-black text-gray-900 font-mono">{resources.network.upload} <span className="text-xs font-normal text-gray-500">MB/s</span></p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Zap size={16} className="text-amber-600" /> حركة المرور</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1"><Activity size={14} className="text-emerald-600" /><span className="text-xs text-gray-500">طلبات/دقيقة</span></div>
                  <p className="text-lg font-black text-gray-900 font-mono">{resources.requestsPerMinute.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-1"><Users size={14} className="text-cyan-600" /><span className="text-xs text-gray-500">اتصالات نشطة</span></div>
                  <p className="text-lg font-black text-gray-900 font-mono">{resources.activeConnections}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Services Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Server size={16} className="text-cyan-600" /> ملخص الخدمات</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {services.slice(0, 4).map((s, i) => {
                const Icon = s.icon;
                return (
                  <button key={i} onClick={() => setSelectedService(s)} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all group text-right">
                    <Icon size={20} className="text-gray-500 group-hover:text-cyan-600 transition-colors" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors block">{s.name}</span>
                      <span className={`text-xs font-bold ${s.status === 'healthy' ? 'text-emerald-600' : s.status === 'degraded' ? 'text-amber-600' : 'text-rose-600'}`}>
                        {s.latency}ms
                      </span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${s.status === 'healthy' ? 'bg-emerald-400' : s.status === 'degraded' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {services.map((service, i) => (
            <div key={i} className="cursor-pointer" onClick={() => setSelectedService(service)}>
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      )}

      {/* Realtime Tab */}
      {activeTab === 'realtime' && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-emerald-400" />
              <span className="text-sm font-bold text-white">الأحداث الفورية</span>
              <span className="text-xs text-slate-500">| {realtimeEvents.length} حدث</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">مباشر</span>
              <button onClick={() => setRealtimeEvents([])} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          <div ref={logRef} className="h-72 overflow-y-auto p-4 font-mono text-xs space-y-1">
            {realtimeEvents.map(event => (
              <div key={event.id} className="flex items-center gap-2 text-slate-400 hover:bg-slate-800/50 rounded-lg px-2 py-1 transition-colors">
                <span className="text-slate-600 w-16 flex-shrink-0">{new Date(event.timestamp).toLocaleTimeString('ar-SA')}</span>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${event.latency < 30 ? 'bg-emerald-500' : event.latency < 100 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <span className="text-cyan-400 w-16 flex-shrink-0">[{event.type}]</span>
                <span className="text-slate-500 w-20 flex-shrink-0">{event.source}</span>
                <span className="text-slate-400 truncate">{event.data}</span>
                <span className="mr-auto text-slate-600">{event.latency}ms</span>
              </div>
            ))}
            {realtimeEvents.length === 0 && (
              <div className="text-slate-600 text-center py-8">بانتظار الأحداث الفورية...</div>
            )}
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && <ServiceDetailModal service={selectedService} onClose={() => setSelectedService(null)} />}
    </div>
  );
}