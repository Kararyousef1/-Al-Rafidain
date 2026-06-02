import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Shield, User, Settings, Save, AlertCircle, BarChart3, Users,
  Filter, GitMerge, Search, ChevronDown, ChevronUp, Eye, EyeOff,
  Download, RefreshCw, Clock, CheckCircle, XCircle, Maximize2,
  Minimize2, ZoomIn, ZoomOut, RotateCcw, Info, Star, Lock,
  Unlock, Bell, Activity, TrendingUp, Award
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';

// ═══════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════

const AVAILABLE_PERMISSIONS = [
  {
    key: 'can_view_reports',
    label: 'الاطلاع على التقارير المالية',
    description: 'عرض كامل التقارير المالية والتحليلات المتقدمة',
    icon: BarChart3,
    color: 'blue',
    risk: 'medium'
  },
  {
    key: 'can_edit_employees',
    label: 'إدارة بيانات الموظفين',
    description: 'تعديل وحذف وإضافة بيانات الموظفين',
    icon: Users,
    color: 'amber',
    risk: 'high'
  },
  {
    key: 'can_manage_cms',
    label: 'التحكم في موقع الزوار',
    description: 'إدارة كاملة لمحتوى الموقع الإلكتروني',
    icon: Settings,
    color: 'purple',
    risk: 'medium'
  },
  {
    key: 'can_override_hierarchy',
    label: 'تخطي الهيكلية التنظيمية',
    description: 'رؤية جميع الأقسام بغض النظر عن المرتبة',
    icon: GitMerge,
    color: 'rose',
    risk: 'critical'
  },
  {
    key: 'can_audit_logs',
    label: 'مراقبة سجل التدقيق',
    description: 'الاطلاع على جميع العمليات والأنشطة في النظام',
    icon: Activity,
    color: 'emerald',
    risk: 'high'
  }
];

const RANK_CONFIG = {
  executive: {
    label: 'مدير تنفيذي',
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    border: 'border-rose-300',
    gradient: 'from-rose-500 to-rose-700',
    ring: 'ring-rose-200',
    dot: 'bg-rose-500',
    headerBg: 'bg-rose-50',
    icon: Award
  },
  manager: {
    label: 'مدير قسم',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
    gradient: 'from-amber-500 to-orange-600',
    ring: 'ring-amber-200',
    dot: 'bg-amber-500',
    headerBg: 'bg-amber-50',
    icon: Star
  },
  supervisor: {
    label: 'مشرف',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    gradient: 'from-blue-500 to-blue-700',
    ring: 'ring-blue-200',
    dot: 'bg-blue-500',
    headerBg: 'bg-blue-50',
    icon: Shield
  },
  employee: {
    label: 'موظف',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    gradient: 'from-slate-400 to-slate-600',
    ring: 'ring-slate-200',
    dot: 'bg-slate-400',
    headerBg: 'bg-slate-50',
    icon: User
  }
};

const RISK_CONFIG = {
  low: { label: 'منخفض', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  medium: { label: 'متوسط', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  high: { label: 'عالي', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  critical: { label: 'حرج', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' }
};

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

interface EmployeeNode {
  id: string;
  full_name: string;
  role: string;
  rank: string;
  position: string;
  manufacturing_dept: string;
  manager_id: string | null;
  custom_permissions: Record<string, boolean>;
  children?: EmployeeNode[];
}

interface AuditLog {
  id: string;
  emp_id: string;
  emp_name: string;
  changed_by: string;
  permission_key: string;
  old_value: boolean;
  new_value: boolean;
  timestamp: string;
}

// ═══════════════════════════════════════════════
// SUB COMPONENTS
// ═══════════════════════════════════════════════

// ── Stats Card ──
const StatCard = ({
  title, value, subtitle, icon: Icon, gradient, delay = 0
}: {
  title: string; value: number | string; subtitle?: string;
  icon: React.ElementType; gradient: string; delay?: number;
}) => (
  <div
    className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient} transition-transform hover:-translate-y-1 hover:shadow-xl`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
    <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <Icon size={24} />
        </div>
        <TrendingUp size={16} className="opacity-60" />
      </div>
      <h3 className="text-3xl font-black mb-1">{value}</h3>
      <p className="text-white/80 text-sm font-bold">{title}</p>
      {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
    </div>
  </div>
);

// ── Permission Toggle ──
const PermissionToggle = ({
  perm, checked, onChange
}: {
  perm: typeof AVAILABLE_PERMISSIONS[0];
  checked: boolean;
  onChange: (val: boolean) => void;
}) => {
  const Icon = perm.icon;
  const risk = RISK_CONFIG[perm.risk as keyof typeof RISK_CONFIG];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    rose: 'bg-rose-100 text-rose-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <div
      onClick={() => onChange(!checked)}
      className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        checked
          ? 'border-indigo-400 bg-indigo-50 shadow-md shadow-indigo-100'
          : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorMap[perm.color]}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h5 className="font-bold text-slate-800 text-sm">{perm.label}</h5>
            <div
              className={`w-11 h-6 rounded-full relative transition-all duration-300 shrink-0 ${
                checked ? 'bg-indigo-500' : 'bg-slate-200'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${
                  checked ? 'right-1' : 'left-1'
                }`}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{perm.description}</p>
          <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-bold border ${risk.bg} ${risk.color} ${risk.border}`}>
            <Lock size={9} />
            مستوى الخطورة: {risk.label}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Audit Log Item ──
const AuditLogItem = ({ log }: { log: AuditLog }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
      log.new_value ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
    }`}>
      {log.new_value ? <Unlock size={14} /> : <Lock size={14} />}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-slate-700">
        <span className="text-indigo-600">{log.emp_name}</span>
        {' - '}
        {AVAILABLE_PERMISSIONS.find(p => p.key === log.permission_key)?.label || log.permission_key}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {log.old_value
          ? <span className="text-xs text-rose-600 font-bold flex items-center gap-1"><CheckCircle size={10} /> مفعّل ← </span>
          : <span className="text-xs text-slate-400 font-bold">معطّل ← </span>}
        {log.new_value
          ? <span className="text-xs text-emerald-600 font-bold flex items-center gap-1"><CheckCircle size={10} /> مفعّل</span>
          : <span className="text-xs text-rose-500 font-bold flex items-center gap-1"><XCircle size={10} /> معطّل</span>}
      </div>
      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
        <Clock size={10} />
        {new Date(log.timestamp).toLocaleString('ar-SA')}
      </p>
    </div>
  </div>
);

// ═══════════════════════════════════════════════
// ORG NODE
// ═══════════════════════════════════════════════

const OrgNode = ({
  node, selectedId, onSelect, searchTerm, collapsedNodes, onToggleCollapse, depth = 0
}: {
  node: EmployeeNode;
  selectedId: string | null;
  onSelect: (emp: EmployeeNode) => void;
  searchTerm: string;
  collapsedNodes: Set<string>;
  onToggleCollapse: (id: string) => void;
  depth?: number;
}) => {
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isCollapsed = collapsedNodes.has(node.id);
  const hasCustom = Object.values(node.custom_permissions || {}).some(v => v);
  const rankConfig = RANK_CONFIG[node.rank as keyof typeof RANK_CONFIG] || RANK_CONFIG.employee;
  const permCount = Object.values(node.custom_permissions || {}).filter(Boolean).length;

  const matchesSearch = searchTerm
    ? node.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.manufacturing_dept?.toLowerCase().includes(searchTerm.toLowerCase())
    : true;

  const highlightText = (text: string) => {
    if (!searchTerm || !text) return text;
    const idx = text.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + searchTerm.length)}</mark>
        {text.slice(idx + searchTerm.length)}
      </>
    );
  };

  return (
    <li key={node.id}>
      {/* Card */}
      <div className="relative inline-block mx-3">
        <div
          onClick={() => onSelect(node)}
          className={`
            relative group cursor-pointer transition-all duration-300 rounded-2xl
            min-w-[170px] max-w-[200px] overflow-hidden border-2 bg-white shadow-sm
            ${isSelected
              ? `${rankConfig.border} ring-4 ${rankConfig.ring} shadow-lg -translate-y-2`
              : `border-slate-200 hover:${rankConfig.border} hover:shadow-lg hover:-translate-y-1`
            }
            ${!matchesSearch && searchTerm ? 'opacity-30 scale-95' : 'opacity-100'}
          `}
        >
          {/* Top accent bar */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${rankConfig.gradient}`} />

          {/* Content */}
          <div className="p-3">
            {/* Avatar */}
            <div className="relative mx-auto w-14 h-14 mb-2">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${rankConfig.gradient} flex items-center justify-center text-white font-black text-2xl shadow-md`}>
                {node.full_name?.charAt(0) || 'U'}
              </div>
              {hasCustom && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Shield size={9} className="text-white" />
                </div>
              )}
              <div className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 border-white ${rankConfig.dot}`} />
            </div>

            {/* Info */}
            <div className="text-center">
              <h4 className="font-black text-slate-800 text-sm leading-tight truncate" title={node.full_name}>
                {highlightText(node.full_name || 'غير محدد')}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 truncate font-medium" title={node.position}>
                {highlightText(node.position || '')}
              </p>
              {node.manufacturing_dept && (
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {highlightText(node.manufacturing_dept)}
                </p>
              )}
            </div>

            {/* Rank Badge */}
            <div className="mt-2.5 flex flex-col items-center gap-1.5">
              <span className={`text-[11px] font-black px-3 py-1 rounded-full ${rankConfig.bg} ${rankConfig.text}`}>
                {rankConfig.label}
              </span>
              {permCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Shield size={9} />
                  {permCount} صلاحية إضافية
                </span>
              )}
            </div>
          </div>

          {/* Hover Info Tooltip */}
          <div className="absolute inset-x-0 -bottom-1 translate-y-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 pointer-events-none px-2">
            <div className="bg-slate-800 text-white text-xs rounded-xl p-3 shadow-2xl text-right leading-relaxed mt-1">
              <p className="font-bold text-white/90 mb-1">انقر لإدارة الصلاحيات</p>
              {node.manufacturing_dept && <p className="text-slate-300">القسم: {node.manufacturing_dept}</p>}
              <p className="text-slate-300">الصلاحيات: {permCount || 'لا توجد إضافية'}</p>
            </div>
          </div>
        </div>

        {/* Collapse Toggle Button */}
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(node.id); }}
            className={`absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black transition-all hover:scale-110 bg-gradient-to-br ${rankConfig.gradient}`}
            title={isCollapsed ? 'توسيع' : 'طي'}
          >
            {isCollapsed
              ? <span className="text-[10px] font-black">+{node.children!.length}</span>
              : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && !isCollapsed && (
        <ul>
          {node.children!.map(child => (
            <OrgNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              searchTerm={searchTerm}
              collapsedNodes={collapsedNodes}
              onToggleCollapse={onToggleCollapse}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

export default function AdminPermissionsTree() {
  const [employees, setEmployees] = useState<EmployeeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<EmployeeNode | null>(null);
  const [permissionsState, setPermissionsState] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Controls
  const [rootFilter, setRootFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'permissions' | 'audit' | 'info'>('permissions');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showStats, setShowStats] = useState(true);

  const treeRef = useRef<HTMLDivElement>(null);

  // ── Fetch Data ──
  const fetchHierarchy = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHierarchy(); }, [fetchHierarchy]);

  // ── Select Employee ──
  const handleSelect = (emp: EmployeeNode) => {
    setSelectedEmp(emp);
    setPermissionsState(emp.custom_permissions || {});
    setSaveSuccess(false);
    setActiveTab('permissions');
    // Mock audit logs for this employee
    setAuditLogs([
      {
        id: '1',
        emp_id: emp.id,
        emp_name: emp.full_name,
        changed_by: 'المدير العام',
        permission_key: 'can_view_reports',
        old_value: false,
        new_value: true,
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: '2',
        emp_id: emp.id,
        emp_name: emp.full_name,
        changed_by: 'مدير النظام',
        permission_key: 'can_audit_logs',
        old_value: true,
        new_value: false,
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString()
      }
    ]);
  };

  // ── Save Permissions ──
  const handleSavePermissions = async () => {
    if (!selectedEmp) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ custom_permissions: permissionsState })
        .eq('id', selectedEmp.id);
      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await fetchHierarchy(true);

      // Update selected employee state locally
      setSelectedEmp(prev => prev ? { ...prev, custom_permissions: permissionsState } : null);
    } catch (err: any) {
      alert('خطأ في الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle All Permissions ──
  const handleToggleAll = (value: boolean) => {
    const newState: Record<string, boolean> = {};
    AVAILABLE_PERMISSIONS.forEach(p => { newState[p.key] = value; });
    setPermissionsState(newState);
  };

  // ── Collapse Controls ──
  const handleToggleCollapse = (id: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCollapseAll = () => {
    setCollapsedNodes(new Set(employees.filter(e => e.manager_id).map(e => e.manager_id!)));
  };

  const handleExpandAll = () => {
    setCollapsedNodes(new Set());
  };

  // ── Reset Tree View ──
  const handleResetView = () => {
    setZoom(100);
    setCollapsedNodes(new Set());
    if (treeRef.current) {
      treeRef.current.scrollTo({ top: 0, left: treeRef.current.scrollWidth / 2, behavior: 'smooth' });
    }
  };

  // ── Export (Simple) ──
  const handleExport = () => {
    const data = employees.map(e => ({
      الاسم: e.full_name,
      المسمى: e.position,
      القسم: e.manufacturing_dept,
      المرتبة: RANK_CONFIG[e.rank as keyof typeof RANK_CONFIG]?.label || e.rank,
      الصلاحيات: Object.entries(e.custom_permissions || {})
        .filter(([, v]) => v)
        .map(([k]) => AVAILABLE_PERMISSIONS.find(p => p.key === k)?.label || k)
        .join(' | ')
    }));
    const csvContent = '\uFEFF' + [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `org-chart-${new Date().toLocaleDateString('ar')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Build Tree ──
  const { tree, stats, departments } = useMemo(() => {
    const empMap = new Map<string, EmployeeNode>();
    employees.forEach(e => empMap.set(e.id, {
      ...e,
      children: [],
      custom_permissions: e.custom_permissions || {}
    }));

    employees.forEach(e => {
      const node = empMap.get(e.id)!;
      if (e.manager_id && empMap.has(e.manager_id)) {
        empMap.get(e.manager_id)!.children!.push(node);
      }
    });

    let roots: EmployeeNode[] = rootFilter === 'all'
      ? Array.from(empMap.values()).filter(e => !e.manager_id)
      : Array.from(empMap.values()).filter(e => e.rank === rootFilter);

    if (deptFilter !== 'all') {
      roots = roots.filter(r => r.manufacturing_dept === deptFilter);
    }

    const totalCustom = employees.filter(e =>
      Object.values(e.custom_permissions || {}).some(v => v)
    ).length;

    const rankCounts = {
      executive: employees.filter(e => e.rank === 'executive').length,
      manager: employees.filter(e => e.rank === 'manager').length,
      supervisor: employees.filter(e => e.rank === 'supervisor').length,
      employee: employees.filter(e => e.rank === 'employee').length,
    };

    const depts = ['all', ...new Set(
      employees.map(e => e.manufacturing_dept).filter(Boolean) as string[]
    )];

    return {
      tree: roots,
      stats: { total: employees.length, totalCustom, rankCounts },
      departments: depts
    };
  }, [employees, rootFilter, deptFilter]);

  // ── Search Results Count ──
  const searchResultsCount = useMemo(() => {
    if (!searchTerm) return 0;
    return employees.filter(e =>
      e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.manufacturing_dept?.toLowerCase().includes(searchTerm.toLowerCase())
    ).length;
  }, [employees, searchTerm]);

  const activePermissionsCount = Object.values(permissionsState).filter(Boolean).length;
  const originalPermissionsCount = Object.values(selectedEmp?.custom_permissions || {}).filter(Boolean).length;
  const hasChanges = JSON.stringify(permissionsState) !== JSON.stringify(selectedEmp?.custom_permissions || {});

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  return (
    <div className="space-y-6 pb-24" dir="rtl">

      {/* ── CSS ── */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse-border { 0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 0 8px rgba(99,102,241,0); } }

        .fade-in { animation: fadeIn 0.4s ease both; }
        .slide-in { animation: slideIn 0.3s ease both; }

        .org-tree { display: flex; justify-content: center; padding-top: 20px; }
        .org-tree ul {
          padding-top: 30px; position: relative;
          display: flex; justify-content: center;
          padding-right: 0; padding-left: 0;
        }
        .org-tree li {
          text-align: center; list-style-type: none;
          position: relative; padding: 30px 5px 0;
          display: flex; flex-direction: column; align-items: center;
        }
        .org-tree li::before, .org-tree li::after {
          content: ''; position: absolute; top: 0; right: 50%;
          border-top: 2px solid #cbd5e1; width: 50%; height: 30px;
        }
        .org-tree li::after {
          right: auto; left: 50%;
          border-left: 2px solid #cbd5e1; border-right: none;
        }
        .org-tree li:only-child::after, .org-tree li:only-child::before { display: none; }
        .org-tree li:only-child { padding-top: 0; }
        .org-tree li:first-child::before, .org-tree li:last-child::after { border: 0 none; }
        .org-tree li:last-child::before { border-right: 2px solid #cbd5e1; border-radius: 0 5px 0 0; }
        .org-tree li:first-child::after { border-radius: 5px 0 0 0; }
        .org-tree ul ul::before {
          content: ''; position: absolute; top: 0; left: 50%;
          border-left: 2px solid #cbd5e1; width: 0; height: 30px;
        }

        .tree-canvas::-webkit-scrollbar { width: 8px; height: 8px; }
        .tree-canvas::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 8px; }
        .tree-canvas::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
        .tree-canvas::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .toggle-switch { transition: all 0.3s ease; }
      `}</style>

      {/* ── HEADER ── */}
      <div className="fade-in flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <GitMerge className="text-white" size={24} />
            </div>
            الهيكل التنظيمي والصلاحيات
          </h2>
          <p className="text-slate-500 mt-2 text-base font-medium">
            إدارة متقدمة للصلاحيات والهيكل التنظيمي — {stats.total} موظف
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            {showStats ? <EyeOff size={16} /> : <Eye size={16} />}
            {showStats ? 'إخفاء' : 'عرض'} الإحصائيات
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} />
            تصدير CSV
          </button>
          <button
            onClick={() => fetchHierarchy(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            تحديث
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 fade-in">
          <StatCard
            title="إجمالي الموظفين"
            value={stats.total}
            subtitle="في جميع الأقسام"
            icon={Users}
            gradient="bg-gradient-to-br from-indigo-500 to-indigo-700"
            delay={0}
          />
          <StatCard
            title="صلاحيات مخصصة"
            value={stats.totalCustom}
            subtitle="موظف لديه استثناءات"
            icon={Shield}
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
            delay={50}
          />
          <StatCard
            title="المدراء التنفيذيون"
            value={stats.rankCounts.executive}
            subtitle={`${stats.rankCounts.manager} مدير قسم`}
            icon={Award}
            gradient="bg-gradient-to-br from-rose-500 to-rose-700"
            delay={100}
          />
          <StatCard
            title="المشرفون والموظفون"
            value={stats.rankCounts.supervisor + stats.rankCounts.employee}
            subtitle={`${stats.rankCounts.supervisor} مشرف | ${stats.rankCounts.employee} موظف`}
            icon={Activity}
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            delay={150}
          />
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── LEFT: ORG TREE ── */}
        <div className="lg:col-span-2 space-y-4 fade-in">

          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
            {/* Row 1: Search */}
            <div className="relative">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن موظف، منصب، أو قسم..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-sm font-medium outline-none focus:border-indigo-400 focus:bg-white transition-all"
              />
              {searchTerm && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {searchResultsCount} نتيجة
                  </span>
                  <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
              )}
            </div>

            {/* Row 2: Filters + Zoom */}
            <div className="flex flex-wrap items-center gap-3">
              <Filter size={16} className="text-slate-500 shrink-0" />
              <select
                value={rootFilter}
                onChange={e => setRootFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 flex-1 min-w-[160px]"
              >
                <option value="all">🏢 الهيكل الكامل</option>
                <option value="executive">👔 المدراء التنفيذيون</option>
                <option value="manager">🗂️ مدراء الأقسام</option>
                <option value="supervisor">👁️ المشرفون</option>
              </select>
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400 flex-1 min-w-[120px]"
              >
                {departments.map(d => (
                  <option key={d} value={d}>{d === 'all' ? '🏭 جميع الأقسام' : d}</option>
                ))}
              </select>

              {/* Zoom */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1 text-slate-500 hover:text-slate-800 transition-colors">
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-black text-slate-600 w-10 text-center">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-1 text-slate-500 hover:text-slate-800 transition-colors">
                  <ZoomIn size={16} />
                </button>
              </div>
            </div>

            {/* Row 3: Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
              <button onClick={handleExpandAll} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all">
                <ChevronDown size={13} /> توسيع الكل
              </button>
              <button onClick={handleCollapseAll} className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">
                <ChevronUp size={13} /> طي الكل
              </button>
              <button onClick={handleResetView} className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all">
                <RotateCcw size={13} /> إعادة ضبط
              </button>
              <div className="mr-auto flex items-center gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span>لديه صلاحيات مخصصة</span>
                </div>
              </div>
            </div>
          </div>

          {/* ORG CHART CANVAS */}
          <div className={`relative bg-gradient-to-br from-slate-50 to-blue-50/30 border-2 border-slate-200 rounded-2xl overflow-hidden shadow-inner transition-all ${isFullscreen ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl' : 'min-h-[580px]'}`}>
            
            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="absolute top-3 left-3 z-20 p-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-sm transition-all hover:bg-white"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                backgroundSize: '30px 30px'
              }}
            />

            {loading ? (
              <div className="h-[580px] flex flex-col items-center justify-center text-slate-500">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-lg">جاري بناء الهيكل التنظيمي...</p>
                <p className="text-sm text-slate-400 mt-1">يرجى الانتظار</p>
              </div>
            ) : tree.length === 0 ? (
              <div className="h-[580px] flex flex-col items-center justify-center text-slate-400">
                <Users size={64} className="text-slate-200 mb-4" />
                <p className="font-bold text-lg text-slate-500">لا يوجد موظفون في هذا المستوى</p>
                <p className="text-sm mt-1">جرب تغيير الفلاتر المحددة</p>
              </div>
            ) : (
              <div
                ref={treeRef}
                className="overflow-auto tree-canvas relative z-10"
                style={{ height: isFullscreen ? 'calc(100vh - 32px)' : '580px' }}
              >
                <div
                  className="org-tree min-w-max p-10 transition-transform duration-300"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                >
                  <ul>
                    {tree.map(rootNode => (
                      <OrgNode
                        key={rootNode.id}
                        node={rootNode}
                        selectedId={selectedEmp?.id || null}
                        onSelect={handleSelect}
                        searchTerm={searchTerm}
                        collapsedNodes={collapsedNodes}
                        onToggleCollapse={handleToggleCollapse}
                      />
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: SIDE PANEL ── */}
        <div className="slide-in">
          <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            {selectedEmp ? (
              <div>
                {/* Employee Header */}
                <div className={`relative p-5 ${RANK_CONFIG[selectedEmp.rank as keyof typeof RANK_CONFIG]?.headerBg || 'bg-slate-50'}`}>
                  <button
                    onClick={() => setSelectedEmp(null)}
                    className="absolute top-4 left-4 w-7 h-7 flex items-center justify-center bg-white/80 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-all text-sm font-bold shadow-sm"
                  >
                    ✕
                  </button>
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${RANK_CONFIG[selectedEmp.rank as keyof typeof RANK_CONFIG]?.gradient || 'from-slate-400 to-slate-600'} flex items-center justify-center text-white font-black text-3xl mx-auto mb-3 shadow-lg`}>
                      {selectedEmp.full_name?.charAt(0) || 'U'}
                    </div>
                    <h3 className="font-black text-xl text-slate-800">{selectedEmp.full_name}</h3>
                    <p className="text-sm font-bold text-indigo-600 mt-1">{selectedEmp.position}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                      <span>{selectedEmp.manufacturing_dept}</span>
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <span className={`text-xs font-black px-3 py-1.5 rounded-full ${RANK_CONFIG[selectedEmp.rank as keyof typeof RANK_CONFIG]?.bg} ${RANK_CONFIG[selectedEmp.rank as keyof typeof RANK_CONFIG]?.text}`}>
                        {RANK_CONFIG[selectedEmp.rank as keyof typeof RANK_CONFIG]?.label || selectedEmp.rank}
                      </span>
                      {originalPermissionsCount > 0 && (
                        <span className="text-xs font-bold px-2 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <Shield size={10} /> {originalPermissionsCount} صلاحية
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                  {[
                    { key: 'permissions', label: 'الصلاحيات', icon: Shield },
                    { key: 'audit', label: 'السجل', icon: Clock },
                    { key: 'info', label: 'المعلومات', icon: Info }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex-1 py-3 text-xs font-black flex items-center justify-center gap-1.5 transition-all border-b-2 ${
                        activeTab === tab.key
                          ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <tab.icon size={14} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-5 max-h-[480px] overflow-y-auto tree-canvas">
                  {/* ── TAB: Permissions ── */}
                  {activeTab === 'permissions' && (
                    <div className="space-y-4 fade-in">
                      {/* Warning */}
                      <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 flex items-start gap-2 text-xs">
                        <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-500" />
                        <p className="leading-relaxed font-semibold">
                          الصلاحيات المخصصة تتجاوز القيود الافتراضية للمرتبة الوظيفية.
                        </p>
                      </div>

                      {/* Bulk Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleAll(true)}
                          className="flex-1 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-1"
                        >
                          <Unlock size={12} /> تفعيل الكل
                        </button>
                        <button
                          onClick={() => handleToggleAll(false)}
                          className="flex-1 py-2 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100 transition-all flex items-center justify-center gap-1"
                        >
                          <Lock size={12} /> إلغاء الكل
                        </button>
                      </div>

                      {/* Active count */}
                      {hasChanges && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 text-xs text-indigo-700 font-bold flex items-center gap-2 fade-in">
                          <Bell size={13} />
                          {activePermissionsCount} صلاحية مفعّلة — لديك تغييرات غير محفوظة
                        </div>
                      )}

                      {/* Permissions List */}
                      <div className="space-y-3">
                        {AVAILABLE_PERMISSIONS.map(perm => (
                          <PermissionToggle
                            key={perm.key}
                            perm={perm}
                            checked={permissionsState[perm.key] || false}
                            onChange={(val) => setPermissionsState(prev => ({ ...prev, [perm.key]: val }))}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── TAB: Audit ── */}
                  {activeTab === 'audit' && (
                    <div className="space-y-3 fade-in">
                      <h4 className="font-black text-slate-700 text-sm flex items-center gap-2">
                        <Clock size={14} className="text-indigo-500" />
                        آخر التغييرات على الصلاحيات
                      </h4>
                      {auditLogs.length > 0 ? (
                        auditLogs.map(log => <AuditLogItem key={log.id} log={log} />)
                      ) : (
                        <div className="text-center py-10 text-slate-400">
                          <Clock size={32} className="mx-auto mb-2 text-slate-200" />
                          <p className="text-sm font-bold">لا توجد سجلات تغيير</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── TAB: Info ── */}
                  {activeTab === 'info' && (
                    <div className="space-y-4 fade-in">
                      <h4 className="font-black text-slate-700 text-sm flex items-center gap-2">
                        <Info size={14} className="text-indigo-500" />
                        معلومات الموظف
                      </h4>
                      <div className="space-y-3">
                        {[
                          { label: 'الاسم الكامل', value: selectedEmp.full_name },
                          { label: 'المسمى الوظيفي', value: selectedEmp.position },
                          { label: 'القسم', value: selectedEmp.manufacturing_dept },
                          { label: 'المرتبة', value: RANK_CONFIG[selectedEmp.rank as keyof typeof RANK_CONFIG]?.label || selectedEmp.rank },
                          { label: 'الدور في النظام', value: selectedEmp.role },
                          { label: 'المعرف', value: selectedEmp.id.slice(0, 12) + '...' },
                        ].map(item => (
                          <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
                            <span className="text-xs font-bold text-slate-500">{item.label}</span>
                            <span className="text-xs font-black text-slate-800 bg-slate-50 px-2 py-1 rounded-lg max-w-[140px] truncate text-right">
                              {item.value || '—'}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Permissions summary */}
                      <div className="mt-4">
                        <h5 className="font-black text-slate-700 text-xs mb-3 flex items-center gap-1">
                          <Shield size={12} className="text-indigo-500" />
                          ملخص الصلاحيات الحالية
                        </h5>
                        <div className="space-y-2">
                          {AVAILABLE_PERMISSIONS.map(perm => (
                            <div key={perm.key} className="flex items-center justify-between">
                              <span className="text-xs text-slate-600 font-medium">{perm.label}</span>
                              {selectedEmp.custom_permissions?.[perm.key]
                                ? <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                                : <XCircle size={16} className="text-slate-300 shrink-0" />
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                {activeTab === 'permissions' && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    {saveSuccess && (
                      <div className="mb-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3 text-sm font-bold flex items-center gap-2 fade-in">
                        <CheckCircle size={16} /> تم حفظ الصلاحيات بنجاح!
                      </div>
                    )}
                    <button
                      onClick={handleSavePermissions}
                      disabled={saving || !hasChanges}
                      className={`w-full py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all shadow-md
                        ${hasChanges
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-indigo-200 hover:shadow-lg'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }
                        disabled:opacity-60
                      `}
                    >
                      {saving ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          {hasChanges ? 'اعتماد التغييرات' : 'لا توجد تغييرات'}
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="p-8 text-center py-24 flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-28 h-28 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center border-2 border-indigo-100">
                    <Shield size={52} className="text-indigo-200" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                    <Settings size={14} className="text-white" />
                  </div>
                </div>
                <h3 className="font-black text-xl text-slate-700 mb-2">اختر موظفاً</h3>
                <p className="text-sm text-slate-400 leading-relaxed max-w-[220px]">
                  انقر على أي بطاقة موظف في الهيكل التنظيمي لإدارة صلاحياته المخصصة
                </p>
                <div className="mt-6 space-y-2 w-full max-w-[200px]">
                  {[RANK_CONFIG.executive, RANK_CONFIG.manager, RANK_CONFIG.supervisor].map((cfg, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${cfg.bg} ${cfg.text} text-xs font-bold`}>
                      <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}