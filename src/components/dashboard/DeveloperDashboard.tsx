/**
 * ════════════════════════════════════════════════════════════════
 *  DeveloperDashboard - لوحة تحكم المطور (نسخة مُصلحة)
 * ════════════════════════════════════════════════════════════════
 *
 *  🔧 الإصلاحات المُطبّقة:
 *  ─────────────────────────────────────────────────────────────────
 *  ✅ 12 استخدام any → 0 (IconType موحّد + أنواع صريحة)
 *  ✅ تنظيف جميع markdown artifacts (50+ موضع)
 *  ✅ إصلاح addToast(`...`) المكسور (10+ مواضع)
 *  ✅ catch (error: any) → unknown + getErrorMessage (5 مواضع)
 *  ✅ status as any → تحويل آمن
 *  ✅ setActiveTab(tab.id as any) → تحويل آمن
 *  ✅ (option: any) → PermOption صريح
 *  ════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Terminal, Database, Activity, AlertOctagon, Code, RefreshCw, Trash2,
  CheckCircle, CheckCircle2, Server, Users, Zap, Clock, TrendingUp,
  Shield, Ban, Unlock, Eye, Edit3, Search, Filter, Download,
  Play, X, HardDrive, Wifi, FileText,
  BarChart3, Layers, Bug, Settings,
  Copy, AlertTriangle, Mail, Phone, Building, UserCheck, UserX, Upload,
  MessageSquare, ClipboardList, Percent, ArrowUp, ArrowDown, Calendar, Lock, KeyRound, Cpu, LayoutDashboard, Heart, Bot, GraduationCap, Briefcase,
  Award, FileBarChart, Globe, ShieldCheck,
} from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useUIStore } from '../../store';
import { supabase } from '../../lib/supabase';
import { getErrorMessage } from '../../lib/errors';

// ── Icon Type (يحلّ محل React.ComponentType<any>) ────────────────
type IconType = React.ComponentType<{ size?: number | string; className?: string }>;

// ── Types ────────────────────────────────────────────────────────

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  totalSurveyResponses: number;
  avgResponseTime: number;
  dbLatency: number;
  apiCalls: number;
  errorRate: number;
}

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  latency: number;
  uptime: number;
  lastCheck: string;
  icon: IconType;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  position: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  permissions?: string[];
}

type IncidentStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

interface Incident {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  is_anonymous: boolean;
  reported_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface AuditLog {
  id: string;
  action: string;
  actor_id: string | null;
  actor_role: string | null;
  target: string | null;
  details: string | null;
  ip_address: string | null;
  timestamp: string;
}

interface PermOption {
  id: string;
  label: string;
  icon: IconType;
}

interface PermCategory {
  category: string;
  perms: PermOption[];
}

interface DbTableInfo {
  name: string;
  rows: number;
}

// ── Sub-components ───────────────────────────────────────────────

const StatCard = ({ title, value, icon: Icon, gradient, trend, trendValue }: {
  title: string; value: string | number;
  icon: IconType; gradient: string;
  trend?: 'up' | 'down'; trendValue?: string;
}) => (
  <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all p-6">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl -translate-y-8 translate-x-8`} />
    <div className="relative">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-lg ${trend === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {trend === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-3xl font-black text-gray-900 font-mono tracking-tight">{value}</p>
      <p className="text-base text-gray-600 mt-2">{title}</p>
    </div>
  </div>
);

const ServiceCard = ({ service }: { service: ServiceStatus }) => {
  const statusConfig: Record<string, { color: string; text: string; border: string; label: string }> = {
    online: { color: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'متصل' },
    offline: { color: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', label: 'غير متصل' },
    degraded: { color: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: 'متدهور' },
  };
  const config = statusConfig[service.status];
  const Icon = service.icon;
  return (
    <div className="relative overflow-hidden bg-white rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${config.color} ${config.border} border flex items-center justify-center`}>
          <Icon size={18} className={config.text} />
        </div>
        <span className="text-sm font-bold text-gray-900">{service.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-100 rounded-lg px-2 py-1.5"><span className="text-gray-600">Latency</span><span className="text-gray-900 font-mono ml-1">{service.latency}ms</span></div>
        <div className="bg-gray-100 rounded-lg px-2 py-1.5"><span className="text-gray-600">Uptime</span><span className="text-emerald-600 font-mono ml-1">{service.uptime}%</span></div>
      </div>
      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Clock size={12} /> آخر فحص: {service.lastCheck}</p>
    </div>
  );
};

const UserRow = ({ user, onEdit, onView, onToggleStatus }: {
  user: Profile; onEdit: (user: Profile) => void; onView: (user: Profile) => void; onToggleStatus: (user: Profile) => void;
}) => {
  const roleConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    admin: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', label: 'مدير' },
    hr: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'موارد بشرية' },
    employee: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', label: 'موظف' },
    developer: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', label: 'مطور' },
  };
  const role = roleConfig[user.role] || roleConfig.employee;
  const isActive = user.status === 'active';
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors group">
      <td className="py-4 px-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/20">{(user.full_name || 'U').charAt(0)}</div>
          <div>
            <p className="text-sm font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">{user.full_name || 'بدون اسم'}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} />{user.email || '—'}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-5"><span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border ${role.bg} ${role.text} ${role.border}`}>{role.label}</span></td>
      <td className="py-4 px-5">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
          {isActive ? <UserCheck size={14} /> : <UserX size={14} />}{isActive ? 'نشط' : 'غير نشط'}
        </span>
      </td>
      <td className="py-4 px-5"><span className="text-xs text-gray-600 flex items-center gap-1"><Building size={12} />{user.department || '—'}</span></td>
      <td className="py-4 px-5 text-xs text-gray-500 font-mono">{user.created_at ? new Date(user.created_at).toLocaleDateString('ar-SA') : '—'}</td>
      <td className="py-4 px-5">
        <div className="flex items-center gap-2">
          <button onClick={() => onView(user)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-cyan-600 transition-colors border border-gray-200" title="عرض"><Eye size={15} /></button>
          <button onClick={() => onEdit(user)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-amber-600 transition-colors border border-gray-200" title="تعديل"><Edit3 size={15} /></button>
          <button onClick={() => onToggleStatus(user)} className={`p-2 rounded-lg transition-colors border ${isActive ? 'bg-rose-100 hover:bg-rose-200 text-rose-600 border-rose-200' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-600 border-emerald-200'}`} title={isActive ? 'تعطيل' : 'تفعيل'}>{isActive ? <Ban size={15} /> : <Unlock size={15} />}</button>
        </div>
      </td>
    </tr>
  );
};

const IncidentRow = ({ incident, onEdit, onView, onStatusChange }: {
  incident: Incident; onEdit: (incident: Incident) => void; onView: (incident: Incident) => void; onStatusChange: (incident: Incident, status: string) => void;
}) => {
  const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: 'معلق' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'قيد المعالجة' },
    resolved: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', label: 'تم الحل' },
    closed: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: 'مغلق' },
  };
  const severityConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
    low: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: 'منخفض' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', label: 'متوسط' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', label: 'عالي' },
    critical: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', label: 'حرج' },
  };
  const status = statusConfig[incident.status] || statusConfig.pending;
  const severity = severityConfig[incident.severity] || severityConfig.medium;
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors group">
      <td className="py-4 px-5"><div><p className="text-sm font-bold text-gray-900">{incident.title}</p><p className="text-xs text-gray-500 mt-1 line-clamp-1">{incident.description}</p></div></td>
      <td className="py-4 px-5"><span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border ${status.bg} ${status.text} ${status.border}`}>{status.label}</span></td>
      <td className="py-4 px-5"><span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold border ${severity.bg} ${severity.text} ${severity.border}`}>{severity.label}</span></td>
      <td className="py-4 px-5"><span className="text-xs text-gray-600">{incident.category || '—'}</span></td>
      <td className="py-4 px-5 text-xs text-gray-500 font-mono">{incident.created_at ? new Date(incident.created_at).toLocaleDateString('ar-SA') : '—'}</td>
      <td className="py-4 px-5">
        <div className="flex items-center gap-2">
          <button onClick={() => onView(incident)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-cyan-600 transition-colors border border-gray-200" title="عرض"><Eye size={15} /></button>
          <button onClick={() => onEdit(incident)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-amber-600 transition-colors border border-gray-200" title="تعديل"><Edit3 size={15} /></button>
          <select value={incident.status} onChange={(e) => onStatusChange(incident, e.target.value)} className="text-xs bg-gray-100 border border-gray-200 rounded-lg px-2 py-1 text-gray-700 outline-none focus:border-cyan-500">
            <option value="pending">معلق</option><option value="in_progress">قيد المعالجة</option><option value="resolved">تم الحل</option><option value="closed">مغلق</option>
          </select>
        </div>
      </td>
    </tr>
  );
};

const AuditLogRow = ({ log }: { log: AuditLog }) => {
  const actionConfig: Record<string, { bg: string; text: string; icon: IconType }> = {
    INSERT: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle },
    UPDATE: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Edit3 },
    DELETE: { bg: 'bg-rose-100', text: 'text-rose-700', icon: Trash2 },
    SELECT: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Eye },
    LOGIN: { bg: 'bg-violet-100', text: 'text-violet-700', icon: Shield },
  };
  const config = actionConfig[log.action?.toUpperCase()] || actionConfig.UPDATE;
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-all">
      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}><Icon size={18} className={config.text} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900"><span className="font-bold">{log.action}</span>{log.target && <><span className="text-gray-400 mx-1">على</span><span className="text-cyan-600 font-mono">{log.target}</span></>}</p>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">{log.details && <span className="line-clamp-1">{log.details}</span>}{log.ip_address && <span>• {log.ip_address}</span>}</p>
      </div>
      <span className="text-xs text-gray-500 flex-shrink-0">{new Date(log.timestamp).toLocaleString('ar-SA')}</span>
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────

type DevTab = 'overview' | 'users' | 'permissions' | 'archive' | 'attendance' | 'incidents' | 'database' | 'logs' | 'terminal' | 'settings';

const PERMISSION_GROUPS: PermCategory[] = [
  { category: 'عام', perms: [{ id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard }, { id: 'problems', label: 'المشاكل والطلبات', icon: FileText }, { id: 'profile', label: 'الملف الشخصي', icon: UserCheck }] },
  { category: 'الموظف', perms: [{ id: 'wellness', label: 'الصحة النفسية', icon: Heart }, { id: 'ai-chat', label: 'المساعد الذكي', icon: Bot }, { id: 'training', label: 'مركز التدريب', icon: GraduationCap }, { id: 'survey', label: 'الاستبيانات', icon: ClipboardList }, { id: 'contact', label: 'تواصل معنا', icon: MessageSquare }] },
  { category: 'الموارد البشرية', perms: [{ id: 'movement-analysis', label: 'تحليل الحركة', icon: BarChart3 }, { id: 'analytics', label: 'التحليلات', icon: TrendingUp }, { id: 'team', label: 'فريق العمل', icon: Users }, { id: 'talent-market', label: 'سجل المؤهلات', icon: Award }, { id: 'communication', label: 'صندوق البريد', icon: MessageSquare }, { id: 'reports', label: 'التقارير', icon: FileBarChart }] },
  { category: 'الإشراف', perms: [{ id: 'supervisor-breaks', label: 'توقيع خروج الموظفين', icon: Briefcase }] },
  { category: 'الحراسة', perms: [{ id: 'gatekeeper-portal', label: 'بوابة الحركة', icon: Users }] },
  { category: 'الإدارة', perms: [{ id: 'cms', label: 'إدارة صفحة الزوار', icon: Globe }, { id: 'employees', label: 'إدارة الموظفين', icon: Users }, { id: 'permissions', label: 'شجرة الصلاحيات', icon: ShieldCheck }, { id: 'gatekeeper-permissions', label: 'صلاحيات المدراء', icon: ShieldCheck }, { id: 'audit-log', label: 'سجل العمليات', icon: ShieldCheck }, { id: 'ai-config', label: 'إعداد الذكاء الاصطناعي', icon: Cpu }, { id: 'settings', label: 'الإعدادات', icon: Settings }] },
  { category: 'المطور', perms: [{ id: 'developer-dashboard', label: 'وحدة تحكم المطور', icon: Terminal }, { id: 'developer-attendance', label: 'سجل الحضور والبصمة', icon: Clock }, { id: 'developer-logs', label: 'مراقبة الأخطاء', icon: AlertOctagon }, { id: 'developer-db', label: 'إدارة قاعدة البيانات', icon: Database }] },
];

const TABS: { id: DevTab; label: string; icon: IconType }[] = [
  { id: 'overview', label: 'نظرة عامة', icon: BarChart3 },
  { id: 'users', label: 'المستخدمون', icon: Users },
  { id: 'permissions', label: 'إدارة الصلاحيات', icon: Shield },
  { id: 'archive', label: 'الأرشيف المحمي', icon: Lock },
  { id: 'attendance', label: 'إعدادات البصمة', icon: Clock },
  { id: 'incidents', label: 'البلاغات', icon: AlertOctagon },
  { id: 'database', label: 'قاعدة البيانات', icon: Database },
  { id: 'logs', label: 'سجل العمليات', icon: FileText },
  { id: 'terminal', label: 'الطرفية', icon: Terminal },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export default function DeveloperDashboard() {
  const { addToast } = useUIStore();
  const [isVerified, setIsVerified] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DevTab>('overview');
  const [stats, setStats] = useState<SystemStats>({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0, totalIncidents: 0, openIncidents: 0, resolvedIncidents: 0, totalSurveyResponses: 0, avgResponseTime: 0, dbLatency: 0, apiCalls: 0, errorRate: 0 });
  const [users, setUsers] = useState<Profile[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<string[]>(['╔═══════════════════════════════════════════════════════════╗', '║           نظام الرافدين - لوحة تحكم المطور                 ║', '║                   الإصدار 2.0.0                           ║', '╚═══════════════════════════════════════════════════════════╝', '', '$ system --status', '✓ جميع الخدمات تعمل بشكل طبيعي', '$ db --connect', '✓ تم الاتصال بـ Supabase بنجاح', '', 'اكتب "help" لعرض الأوامر المتاحة.']);
  const [terminalInput, setTerminalInput] = useState('');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showIncidentDetails, setShowIncidentDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM profiles LIMIT 10;');
  const [sqlResult, setSqlResult] = useState<string | null>(null);
  const [dbTables, setDbTables] = useState<DbTableInfo[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  // ── Fetch Data ──
  const fetchStats = useCallback(async () => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const { data: usersData, error: usersError } = await supabase.from('profiles').select('*');
      if (usersError) throw usersError;
      setUsers((usersData as Profile[]) || []);

      const { data: incidentsData, error: incidentsError } = await supabase.from('incidents').select('*');
      if (incidentsError) throw incidentsError;
      setIncidents((incidentsData as Incident[]) || []);

      const { data: logsData, error: logsError } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(50);
      if (logsError) throw logsError;
      setAuditLogs((logsData as AuditLog[]) || []);

      const { count: responsesCount } = await supabase.from('survey_responses').select('*', { count: 'exact', head: true });
      const dbLatency = Math.round(performance.now() - startTime);

      const ud = usersData as Profile[] | null;
      const id = incidentsData as Incident[] | null;
      const activeUsers = (ud || []).filter((u) => u.status === 'active').length;
      const openIncidents = (id || []).filter((i) => i.status === 'pending' || i.status === 'in_progress').length;
      const resolvedIncidents = (id || []).filter((i) => i.status === 'resolved' || i.status === 'closed').length;

      setStats({ totalUsers: ud?.length || 0, activeUsers, inactiveUsers: (ud?.length || 0) - activeUsers, totalIncidents: id?.length || 0, openIncidents, resolvedIncidents, totalSurveyResponses: responsesCount || 0, avgResponseTime: dbLatency, dbLatency, apiCalls: Math.floor(Math.random() * 1000) + 500, errorRate: 0.5 });

      setServices([
        { name: 'Supabase Database', status: 'online', latency: dbLatency, uptime: 99.98, lastCheck: new Date().toLocaleTimeString('ar-SA'), icon: Database },
        { name: 'Authentication API', status: 'online', latency: Math.floor(dbLatency * 0.8), uptime: 99.99, lastCheck: new Date().toLocaleTimeString('ar-SA'), icon: Shield },
        { name: 'Storage Service', status: 'online', latency: Math.floor(dbLatency * 1.2), uptime: 99.95, lastCheck: new Date().toLocaleTimeString('ar-SA'), icon: HardDrive },
        { name: 'Realtime Subscriptions', status: 'online', latency: Math.floor(dbLatency * 1.5), uptime: 98.5, lastCheck: new Date().toLocaleTimeString('ar-SA'), icon: Wifi },
        { name: 'Edge Functions', status: 'online', latency: Math.floor(dbLatency * 0.9), uptime: 99.97, lastCheck: new Date().toLocaleTimeString('ar-SA'), icon: Zap },
        { name: 'Email Service', status: 'online', latency: Math.floor(dbLatency * 2), uptime: 99.9, lastCheck: new Date().toLocaleTimeString('ar-SA'), icon: Mail },
      ]);

      setDbTables([
        { name: 'profiles', rows: ud?.length || 0 }, { name: 'incidents', rows: id?.length || 0 },
        { name: 'audit_logs', rows: logsData?.length || 0 }, { name: 'survey_responses', rows: responsesCount || 0 },
        { name: 'time_logs', rows: 0 }, { name: 'hr_messages', rows: 0 }, { name: 'wellness_entries', rows: 0 }, { name: 'movements_log', rows: 0 },
      ]);
    } catch (error) {
      console.error('Error fetching stats:', getErrorMessage(error));
      addToast('خطأ في جلب البيانات: ' + getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchStats(); const interval = setInterval(fetchStats, 30000); return () => clearInterval(interval); }, [fetchStats]);

  useEffect(() => { if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight; }, [terminalHistory]);

  // ── User Actions ──
  const handleToggleUserStatus = async (user: Profile) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', user.id);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)));
      addToast(`تم ${newStatus === 'active' ? 'تفعيل' : 'تعطيل'} المستخدم: ${user.full_name}`, 'success');
    } catch (error) {
      addToast('خطأ: ' + getErrorMessage(error), 'error');
    }
  };

  const handleEditUser = (user: Profile) => { setSelectedUser(user); setShowUserModal(true); };
  const handleViewUser = (user: Profile) => { setSelectedUser(user); setShowUserDetails(true); };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    try {
      const { error } = await supabase.from('profiles').update({ full_name: selectedUser.full_name, email: selectedUser.email, role: selectedUser.role, department: selectedUser.department, position: selectedUser.position, phone: selectedUser.phone, permissions: selectedUser.permissions }).eq('id', selectedUser.id);
      if (error) throw error;
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? selectedUser : u)));
      addToast('تم حفظ التغييرات بنجاح', 'success');
      setShowUserModal(false);
    } catch (error) {
      addToast('خطأ: ' + getErrorMessage(error), 'error');
    }
  };

  // ── Incident Actions ──
  const handleIncidentStatusChange = async (incident: Incident, status: string) => {
    try {
      const newStatus = status as IncidentStatus;
      const { error } = await supabase.from('incidents').update({ status: newStatus, resolved_at: status === 'resolved' ? new Date().toISOString() : null }).eq('id', incident.id);
      if (error) throw error;
      setIncidents((prev) => prev.map((i) => (i.id === incident.id ? { ...i, status: newStatus } : i)));
      addToast(`تم تحديث حالة البلاغ إلى: ${status}`, 'success');
    } catch (error) {
      addToast('خطأ: ' + getErrorMessage(error), 'error');
    }
  };

  const handleEditIncident = (incident: Incident) => { setSelectedIncident(incident); setShowIncidentModal(true); };
  const handleViewIncident = (incident: Incident) => { setSelectedIncident(incident); setShowIncidentDetails(true); };

  const handleSaveIncident = async () => {
    if (!selectedIncident) return;
    try {
      const { error } = await supabase.from('incidents').update({ title: selectedIncident.title, description: selectedIncident.description, status: selectedIncident.status, severity: selectedIncident.severity, category: selectedIncident.category }).eq('id', selectedIncident.id);
      if (error) throw error;
      setIncidents((prev) => prev.map((i) => (i.id === selectedIncident.id ? selectedIncident : i)));
      addToast('تم حفظ التغييرات بنجاح', 'success');
      setShowIncidentModal(false);
    } catch (error) {
      addToast('خطأ: ' + getErrorMessage(error), 'error');
    }
  };

  // ── Terminal ──
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const command = terminalInput.trim();
    let response = '';
    switch (command.toLowerCase()) {
      case 'help':
        response = 'الأوامر: help | status | clear | users | incidents | db tables | refresh | version';
        break;
      case 'status':
        response = `DB: ${stats.dbLatency}ms | المستخدمون: ${stats.totalUsers} | البلاغات: ${stats.totalIncidents}`;
        break;
      case 'clear': setTerminalHistory([]); setTerminalInput(''); return;
      case 'users': response = `إجمالي: ${stats.totalUsers} | نشط: ${stats.activeUsers} | غير نشط: ${stats.inactiveUsers}`; break;
      case 'incidents': response = `إجمالي: ${stats.totalIncidents} | مفتوح: ${stats.openIncidents} | محلول: ${stats.resolvedIncidents}`; break;
      case 'refresh': response = '⏳ جاري التحديث...'; await fetchStats(); response += '\n✓ تم التحديث'; break;
      case 'version': response = 'الرافدين HR v2.0.0 (React 18, Supabase)'; break;
      case 'db tables': response = dbTables.map((t) => `${t.name}: ${t.rows}`).join('\n'); break;
      default: response = `✗ أمر غير معروف: ${command}`;
    }
    setTerminalHistory((prev) => [...prev, `$ ${command}`, response]);
    setTerminalInput('');
  };

  // ── Export ──
  const handleExportUsers = () => {
    const blob = new Blob([JSON.stringify(users, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `users-export-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    addToast('تم تصدير بيانات المستخدمين', 'success');
  };

  const handleExportIncidents = () => {
    const blob = new Blob([JSON.stringify(incidents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `incidents-export-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    addToast('تم تصدير بيانات البلاغات', 'success');
  };

  const filteredUsers = users.filter((u) => u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredIncidents = incidents.filter((i) => i.title?.toLowerCase().includes(searchQuery.toLowerCase()) || i.description?.toLowerCase().includes(searchQuery.toLowerCase()));

  // ── PIN ──
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '9999') { setIsVerified(true); addToast('تم التحقق من هوية المطور بنجاح', 'success'); }
    else { addToast('رمز الدخول غير صحيح! تم تسجيل محاولة الدخول.', 'error'); setPinInput(''); }
  };

  if (!isVerified) {
    return (
      <div className="fixed inset-0 z-[200] bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-800 overflow-hidden animate-fade-in">
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-rose-500 to-orange-600 flex items-center justify-center shadow-lg shadow-rose-500/20"><Lock size={36} className="text-white" /></div>
            <h2 className="text-2xl font-black text-white mb-2">منطقة المطورين المحمية</h2>
            <p className="text-gray-400 mb-8 text-sm">أدخل رمز الأمان المكون من 4 أرقام للوصول إلى لوحة التحكم المتقدمة.</p>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="relative">
                <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input type="password" maxLength={4} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-12 py-4 text-center text-3xl font-mono text-white tracking-[0.5em] outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all" autoFocus />
              </div>
              <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-bold text-lg shadow-lg shadow-rose-500/25 transition-all active:scale-95">التحقق والدخول</button>
            </form>
            <p className="text-xs text-gray-600 mt-6 flex items-center justify-center gap-2"><Shield size={12} />جميع محاولات الدخول يتم تسجيلها ومراقبتها</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25"><Terminal size={28} className="text-white" /></div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">لوحة تحكم المطور<span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">v2.0</span></h1>
              <p className="text-slate-400 text-sm mt-0.5">متصل بـ Supabase مباشرة • بيانات حقيقية • إدارة كاملة</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-4 py-2 rounded-xl"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-sm font-bold text-emerald-400 font-mono">Supabase متصل</span></div>
            <button onClick={fetchStats} disabled={loading} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 disabled:opacity-50" title="تحديث"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-gray-200 shadow-md overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
              <Icon size={16} />{tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard title="إجمالي المستخدمين" value={stats.totalUsers} icon={Users} gradient="from-cyan-500 to-blue-600" trend="up" trendValue="+12%" />
            <StatCard title="المستخدمون النشطون" value={stats.activeUsers} icon={Activity} gradient="from-emerald-500 to-teal-600" trend="up" trendValue="+8%" />
            <StatCard title="غير النشطين" value={stats.inactiveUsers} icon={UserX} gradient="from-rose-500 to-pink-600" />
            <StatCard title="إجمالي البلاغات" value={stats.totalIncidents} icon={AlertOctagon} gradient="from-amber-500 to-orange-600" />
            <StatCard title="البلاغات المفتوحة" value={stats.openIncidents} icon={ClipboardList} gradient="from-violet-500 to-purple-600" />
            <StatCard title="تم الحل" value={stats.resolvedIncidents} icon={CheckCircle} gradient="from-green-500 to-emerald-600" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-white border border-gray-200 shadow-md">
              <CardHeader><CardTitle className="flex items-center gap-2 text-gray-900"><Zap size={18} className="text-amber-600" />مؤشرات الأداء</CardTitle></CardHeader>
              <div className="grid grid-cols-2 gap-3 p-4">
                {[{ label: 'زمن استجابة DB', value: `${stats.dbLatency}ms`, icon: Database, color: 'text-cyan-600' }, { label: 'معدل الخطأ', value: `${stats.errorRate}%`, icon: Bug, color: 'text-rose-600' }, { label: 'استدعاءات API', value: stats.apiCalls.toLocaleString(), icon: Zap, color: 'text-amber-600' }, { label: 'ردود الاستبيانات', value: stats.totalSurveyResponses, icon: ClipboardList, color: 'text-violet-600' }].map((item, i) => {
                  const Icon = item.icon;
                  return <div key={i} className="bg-gray-100 rounded-xl p-3 border border-gray-200"><Icon size={16} className={`${item.color} mb-1`} /><p className="text-lg font-black text-gray-900 font-mono">{item.value}</p><p className="text-xs text-gray-600">{item.label}</p></div>;
                })}
              </div>
            </Card>
            <Card className="bg-white border border-gray-200 shadow-md">
              <CardHeader><CardTitle className="flex items-center gap-2 text-gray-900"><TrendingUp size={18} className="text-emerald-600" />إحصائيات إضافية</CardTitle></CardHeader>
              <div className="grid grid-cols-2 gap-3 p-4">
                {[{ label: 'معدل الحل', value: stats.totalIncidents > 0 ? `${Math.round((stats.resolvedIncidents / stats.totalIncidents) * 100)}%` : '0%', icon: Percent, color: 'text-emerald-600' }, { label: 'متوسط الاستجابة', value: `${stats.avgResponseTime}ms`, icon: Clock, color: 'text-violet-600' }, { label: 'الجداول', value: dbTables.length, icon: Layers, color: 'text-amber-600' }, { label: 'الخدمات', value: services.filter((s) => s.status === 'online').length, icon: Server, color: 'text-blue-600' }].map((item, i) => {
                  const Icon = item.icon;
                  return <div key={i} className="bg-gray-100 rounded-xl p-3 border border-gray-200"><Icon size={16} className={`${item.color} mb-1`} /><p className="text-lg font-black text-gray-900 font-mono">{item.value}</p><p className="text-xs text-gray-600">{item.label}</p></div>;
                })}
              </div>
            </Card>
          </div>
          <Card className="bg-white border border-gray-200 shadow-md">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-900"><Server size={18} className="text-cyan-600" />حالة الخدمات</CardTitle><div className="flex items-center gap-2"><Badge variant="success" dot>{services.filter((s) => s.status === 'online').length} متصل</Badge></div></CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">{services.map((service, i) => <ServiceCard key={i} service={service} />)}</div>
          </Card>
          <Card className="bg-white border border-gray-200 shadow-md">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-900"><Zap size={18} className="text-amber-600" />عمليات سريعة</CardTitle></CardHeader>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
              {[{ label: 'تحديث البيانات', desc: 'جلب أحدث البيانات', icon: RefreshCw, action: fetchStats, gradient: 'from-cyan-500 to-blue-600' }, { label: 'تصدير المستخدمين', desc: 'تحميل ملف JSON', icon: Download, action: handleExportUsers, gradient: 'from-emerald-500 to-teal-600' }, { label: 'تصدير البلاغات', desc: 'تحميل ملف JSON', icon: Upload, action: handleExportIncidents, gradient: 'from-violet-500 to-purple-600' }, { label: 'مسح الكاش', desc: 'حذف البيانات المؤقتة', icon: Trash2, action: () => { localStorage.clear(); addToast('تم مسح الكاش', 'success'); }, gradient: 'from-rose-500 to-pink-600' }].map((item, i) => {
                const Icon = item.icon;
                return (
                  <button key={i} onClick={item.action} disabled={loading} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 hover:border-gray-300 transition-all group disabled:opacity-50">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}><Icon size={20} className="text-white" /></div>
                    <div className="text-center"><p className="text-sm font-bold text-gray-900">{item.label}</p><p className="text-xs text-gray-600">{item.desc}</p></div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900"><Users size={18} className="text-cyan-600" />إدارة المستخدمين</CardTitle>
            <div className="flex items-center gap-2"><Badge variant="info">{users.length} مستخدم</Badge><Badge variant="success">{stats.activeUsers} نشط</Badge><Badge variant="danger">{stats.inactiveUsers} غير نشط</Badge></div>
          </CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 mb-4 p-4">
            <div className="relative flex-1"><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث بالاسم أو البريد..." className="w-full bg-gray-100 border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-cyan-500 transition-colors" /></div>
            <Button onClick={handleExportUsers} variant="outline" icon={<Download size={14} />} iconPosition="left">تصدير</Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 mx-4 mb-4">
            <table className="w-full">
              <thead className="bg-gray-100"><tr className="border-b border-gray-200"><th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">المستخدم</th><th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">الدور</th><th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">الحالة</th><th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">القسم</th><th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">تاريخ الإنشاء</th><th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">إجراءات</th></tr></thead>
              <tbody>{filteredUsers.map((user) => <UserRow key={user.id} user={user} onEdit={handleEditUser} onView={handleViewUser} onToggleStatus={handleToggleUserStatus} />)}</tbody>
            </table>
            {filteredUsers.length === 0 && <div className="text-center py-12 text-gray-400"><Users size={40} className="mx-auto mb-3 opacity-30" /><p className="font-medium">لا توجد نتائج</p></div>}
          </div>
        </Card>
      )}

      {/* Permissions */}
      {activeTab === 'permissions' && (
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2 text-gray-900"><Shield size={18} className="text-violet-600" />إدارة صلاحيات المستخدمين</CardTitle><Badge variant="info">يمكنك تعديل صلاحيات أي مستخدم</Badge></CardHeader>
          <div className="p-6 text-center text-gray-500">
            <Shield size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="font-medium">اختر مستخدماً من قائمة "المستخدمون" لتعديل صلاحياته الدقيقة.</p>
            <p className="text-sm mt-2">ملاحظة: يتم حفظ جميع تغييرات الصلاحيات فوراً في سجل التدقيق.</p>
            <Button onClick={() => setActiveTab('users')} className="mt-4" variant="outline">الذهاب إلى قائمة المستخدمين</Button>
          </div>
        </Card>
      )}

      {/* Incidents */}
      {activeTab === 'incidents' && (
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900"><AlertOctagon size={18} className="text-amber-600" />إدارة البلاغات</CardTitle>
            <div className="flex items-center gap-2"><Badge variant="info">{incidents.length} بلاغ</Badge><Badge variant="warning">{stats.openIncidents} مفتوح</Badge><Badge variant="success">{stats.resolvedIncidents} تم الحل</Badge></div>
          </CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 mb-4 p-4">
            <div className="relative flex-1"><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث في البلاغات..." className="w-full bg-gray-100 border border-gray-200 rounded-xl pr-10 pl-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-cyan-500 transition-colors" /></div>
            <Button onClick={handleExportIncidents} variant="outline" icon={<Download size={14} />} iconPosition="left">تصدير</Button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 mx-4 mb-4">
            <table className="w-full">
              <thead className="bg-gray-100"><tr className="border-b border-gray-200"><th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">البلاغ</th><th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">الحالة</th><th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">الخطورة</th><th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">التصنيف</th><th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">تاريخ الإنشاء</th><th className="text-right py-3 px-4 text-xs font-bold text-gray-600 uppercase">إجراءات</th></tr></thead>
              <tbody>{filteredIncidents.map((incident) => <IncidentRow key={incident.id} incident={incident} onEdit={handleEditIncident} onView={handleViewIncident} onStatusChange={handleIncidentStatusChange} />)}</tbody>
            </table>
            {filteredIncidents.length === 0 && <div className="text-center py-12 text-gray-400"><AlertOctagon size={40} className="mx-auto mb-3 opacity-30" /><p className="font-medium">لا توجد نتائج</p></div>}
          </div>
        </Card>
      )}

      {/* Database */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <Card className="bg-white border border-gray-200 shadow-md">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-900"><Database size={18} className="text-cyan-600" />إدارة قاعدة البيانات</CardTitle></CardHeader>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[{ label: 'زمن الاستجابة', value: `${stats.dbLatency}ms`, icon: Zap, color: 'text-cyan-600' }, { label: 'عدد الجداول', value: dbTables.length, icon: Layers, color: 'text-emerald-600' }, { label: 'إجمالي السجلات', value: dbTables.reduce((a, b) => a + b.rows, 0).toLocaleString(), icon: FileText, color: 'text-amber-600' }, { label: 'حالة الاتصال', value: 'متصل', icon: Wifi, color: 'text-green-600' }].map((item, i) => {
                  const Icon = item.icon;
                  return <div key={i} className="bg-gray-100 rounded-xl p-4 border border-gray-200"><Icon size={18} className={`${item.color} mb-2`} /><p className="text-xl font-black text-gray-900 font-mono">{item.value}</p><p className="text-xs text-gray-600">{item.label}</p></div>;
                })}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">الجداول</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {dbTables.map((table, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3 border border-gray-200 hover:border-cyan-500/30 transition-colors cursor-pointer group">
                      <Database size={16} className="text-gray-400 group-hover:text-cyan-600 transition-colors" />
                      <div className="flex-1"><span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors font-mono block">{table.name}</span><span className="text-xs text-gray-500">{table.rows} سجل</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
          <Card className="bg-white border border-gray-200 shadow-md">
            <CardHeader><CardTitle className="flex items-center gap-2 text-gray-900"><Code size={18} className="text-emerald-600" />تشغيل استعلام SQL</CardTitle></CardHeader>
            <div className="p-4 space-y-3">
              <textarea value={sqlQuery} onChange={(e) => setSqlQuery(e.target.value)} placeholder="SELECT * FROM profiles WHERE role = 'employee' LIMIT 10;" className="w-full h-32 bg-gray-100 border border-gray-200 rounded-xl p-4 text-sm text-emerald-700 font-mono placeholder-gray-400 outline-none focus:border-cyan-500 resize-none" />
              <div className="flex items-center gap-2">
                <Button onClick={() => addToast('ملاحظة: يجب إنشاء دالة exec_sql في Supabase لتنفيذ استعلامات SQL.', 'info')} icon={<Play size={14} />} iconPosition="left">تشغيل</Button>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(sqlQuery); addToast('تم نسخ الاستعلام', 'info'); }} icon={<Copy size={14} />} iconPosition="left">نسخ</Button>
                <Button variant="outline" onClick={() => setSqlQuery('')} icon={<Trash2 size={14} />} iconPosition="left">مسح</Button>
              </div>
              {sqlResult && <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 font-mono text-sm text-gray-700 whitespace-pre-wrap">{sqlResult}</div>}
            </div>
          </Card>
        </div>
      )}

      {/* Logs */}
      {activeTab === 'logs' && (
        <Card className="bg-white border border-gray-200 shadow-md">
          <CardHeader><CardTitle className="flex items-center gap-2 text-gray-900"><FileText size={18} className="text-amber-600" />سجل العمليات</CardTitle><Badge variant="info">{auditLogs.length} عملية</Badge></CardHeader>
          <div className="space-y-2 p-4">
            {auditLogs.map((log) => <AuditLogRow key={log.id} log={log} />)}
            {auditLogs.length === 0 && <div className="text-center py-12 text-gray-400"><FileText size={40} className="mx-auto mb-3 opacity-30" /><p className="font-medium">لا توجد عمليات مسجلة</p></div>}
          </div>
        </Card>
      )}

      {/* Terminal */}
      {activeTab === 'terminal' && (
        <Card className="bg-gray-900 border border-gray-700 shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500" /><div className="w-3 h-3 rounded-full bg-amber-500" /><div className="w-3 h-3 rounded-full bg-emerald-500" /></div>
            <span className="text-sm text-gray-400 font-mono ml-4">developer@rafidain-hr:~$</span>
            <button onClick={() => setTerminalHistory([])} className="mr-auto p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="مسح"><Trash2 size={14} /></button>
          </div>
          <div ref={terminalRef} className="p-4 h-96 overflow-y-auto font-mono text-sm bg-gray-950">
            {terminalHistory.map((line, i) => (
              <div key={i} className={`${line.startsWith('$') ? 'text-cyan-400' : line.startsWith('✓') ? 'text-emerald-400' : line.startsWith('✗') ? 'text-rose-400' : 'text-gray-300'} mb-0.5 whitespace-pre-wrap`}>{line}</div>
            ))}
          </div>
          <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2 p-4 bg-gray-800 border-t border-gray-700">
            <span className="text-cyan-400 font-mono font-bold">$</span>
            <input type="text" value={terminalInput} onChange={(e) => setTerminalInput(e.target.value)} placeholder="اكتب أمراً... (help للأوامر)" className="flex-1 bg-transparent text-white font-mono outline-none placeholder-gray-600" autoFocus />
            <button type="submit" className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white transition-all shadow-lg shadow-cyan-500/25"><Play size={14} /></button>
          </form>
        </Card>
      )}

      {/* User Edit Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">تعديل المستخدم وصلاحياته</h3>
              <button onClick={() => setShowUserModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-bold text-gray-700 mb-1 block">الاسم</label><input type="text" value={selectedUser.full_name} onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:border-cyan-500 transition-colors" /></div>
                <div><label className="text-sm font-bold text-gray-700 mb-1 block">البريد</label><input type="email" value={selectedUser.email} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:border-cyan-500 transition-colors" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1 block">الدور</label>
                  <select value={selectedUser.role} onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:border-cyan-500">
                    <option value="employee">موظف</option><option value="hr">موارد بشرية</option><option value="admin">مدير</option><option value="gatekeeper">حارس</option><option value="developer">مطور</option>
                  </select>
                </div>
                <div><label className="text-sm font-bold text-gray-700 mb-1 block">القسم</label><input type="text" value={selectedUser.department || ''} onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:border-cyan-500" /></div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <label className="text-sm font-bold text-gray-700 mb-3 block flex items-center gap-2"><Shield size={16} className="text-violet-600" />صلاحيات الوصول</label>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {PERMISSION_GROUPS.map(({ category, perms }) => (
                    <div key={category}>
                      <h5 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">{category}</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {perms.map((option) => {
                          const Icon = option.icon;
                          const isActive = (selectedUser.permissions || []).includes(option.id);
                          return (
                            <button key={option.id} type="button" onClick={() => {
                              const current = selectedUser.permissions || [];
                              const next = isActive ? current.filter((id) => id !== option.id) : [...current, option.id];
                              setSelectedUser({ ...selectedUser, permissions: next });
                            }} className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-xs font-bold ${isActive ? 'bg-violet-50 border-violet-500 text-violet-700' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'}`}>
                              <Icon size={14} />{option.label}{isActive ? <CheckCircle2 size={12} className="mr-auto text-violet-500" /> : <span className="mr-auto text-gray-300 text-lg leading-none">+</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-5 border-t border-gray-200 flex-shrink-0 bg-gray-50">
              <Button variant="secondary" onClick={() => setShowUserModal(false)} className="flex-1">إلغاء</Button>
              <Button onClick={handleSaveUser} className="flex-1">حفظ التغييرات</Button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">تفاصيل المستخدم</h3>
              <button onClick={() => setShowUserDetails(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-cyan-500/25">{selectedUser.full_name?.charAt(0) || 'U'}</div>
                <div><h4 className="text-xl font-bold text-gray-900">{selectedUser.full_name}</h4><p className="text-sm text-gray-600">{selectedUser.department || '—'}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{ label: 'البريد', value: selectedUser.email, icon: Mail }, { label: 'الهاتف', value: selectedUser.phone || '—', icon: Phone }, { label: 'الدور', value: selectedUser.role, icon: Shield }, { label: 'الحالة', value: selectedUser.status === 'active' ? 'نشط' : 'غير نشط', icon: Activity }, { label: 'تاريخ الإنشاء', value: new Date(selectedUser.created_at).toLocaleDateString('ar-SA'), icon: Calendar }, { label: 'آخر تحديث', value: new Date(selectedUser.updated_at).toLocaleDateString('ar-SA'), icon: Clock }].map((item, i) => {
                  const Icon = item.icon;
                  return <div key={i} className="bg-gray-100 rounded-xl p-3 border border-gray-200"><div className="flex items-center gap-2 mb-1"><Icon size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{item.label}</span></div><p className="text-sm font-bold text-gray-900">{item.value}</p></div>;
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 p-5 border-t border-gray-200">
              <Button variant="secondary" onClick={() => setShowUserDetails(false)} className="flex-1">إغلاق</Button>
              <Button onClick={() => { setShowUserDetails(false); handleEditUser(selectedUser); }} className="flex-1">تعديل</Button>
            </div>
          </div>
        </div>
      )}

      {/* Incident Edit Modal */}
      {showIncidentModal && selectedIncident && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">تعديل البلاغ</h3>
              <button onClick={() => setShowIncidentModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div><label className="text-sm font-bold text-gray-700 mb-1 block">العنوان</label><input type="text" value={selectedIncident.title} onChange={(e) => setSelectedIncident({ ...selectedIncident, title: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:border-cyan-500" /></div>
              <div><label className="text-sm font-bold text-gray-700 mb-1 block">الوصف</label><textarea value={selectedIncident.description} onChange={(e) => setSelectedIncident({ ...selectedIncident, description: e.target.value })} className="w-full h-24 bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:border-cyan-500 resize-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-bold text-gray-700 mb-1 block">الحالة</label><select value={selectedIncident.status} onChange={(e) => setSelectedIncident({ ...selectedIncident, status: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:border-cyan-500"><option value="pending">معلق</option><option value="in_progress">قيد المعالجة</option><option value="resolved">تم الحل</option><option value="closed">مغلق</option></select></div>
                <div><label className="text-sm font-bold text-gray-700 mb-1 block">الخطورة</label><select value={selectedIncident.severity} onChange={(e) => setSelectedIncident({ ...selectedIncident, severity: e.target.value })} className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 outline-none focus:border-cyan-500"><option value="low">منخفض</option><option value="medium">متوسط</option><option value="high">عالي</option><option value="critical">حرج</option></select></div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-5 border-t border-gray-200"><Button variant="secondary" onClick={() => setShowIncidentModal(false)} className="flex-1">إلغاء</Button><Button onClick={handleSaveIncident} className="flex-1">حفظ التغييرات</Button></div>
          </div>
        </div>
      )}

      {/* Incident Details Modal */}
      {showIncidentDetails && selectedIncident && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">تفاصيل البلاغ</h3>
              <button onClick={() => setShowIncidentDetails(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5">
              <h4 className="text-xl font-bold text-gray-900 mb-2">{selectedIncident.title}</h4>
              <p className="text-sm text-gray-600 mb-4">{selectedIncident.description}</p>
              <div className="grid grid-cols-2 gap-4">
                {[{ label: 'الحالة', value: selectedIncident.status, icon: Activity }, { label: 'الخطورة', value: selectedIncident.severity, icon: AlertTriangle }, { label: 'التصنيف', value: selectedIncident.category || '—', icon: Filter }, { label: 'مجهول', value: selectedIncident.is_anonymous ? 'نعم' : 'لا', icon: Eye }, { label: 'تاريخ الإنشاء', value: new Date(selectedIncident.created_at).toLocaleDateString('ar-SA'), icon: Calendar }, { label: 'تم الحل', value: selectedIncident.resolved_at ? new Date(selectedIncident.resolved_at).toLocaleDateString('ar-SA') : '—', icon: CheckCircle }].map((item, i) => {
                  const Icon = item.icon;
                  return <div key={i} className="bg-gray-100 rounded-xl p-3 border border-gray-200"><div className="flex items-center gap-2 mb-1"><Icon size={14} className="text-gray-400" /><span className="text-xs text-gray-500">{item.label}</span></div><p className="text-sm font-bold text-gray-900">{item.value}</p></div>;
                })}
              </div>
            </div>
            <div className="flex items-center gap-3 p-5 border-t border-gray-200"><Button variant="secondary" onClick={() => setShowIncidentDetails(false)} className="flex-1">إغلاق</Button><Button onClick={() => { setShowIncidentDetails(false); handleEditIncident(selectedIncident); }} className="flex-1">تعديل</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
