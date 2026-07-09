import { useState, useEffect } from 'react';
import { structureDepartmentService, structurePositionService, structureRankService, structureShiftService, structureRoleService } from '../../services/sdk';
import { Plus, Edit3, Trash2, Save, X, Building2, Briefcase, Shield, Clock, Layers, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUIStore } from '../../core/stores';
import Card from '../../shared/components/ui/Card';

interface Dept { id: number; name_ar: string; name_en: string; code: string; is_active: boolean; sort_order: number; }
interface Pos { id: number; name_ar: string; name_en: string; department_id: number; is_active: boolean; }
interface Rank { id: number; name_ar: string; name_en: string; code: string; level: number; is_active: boolean; }
interface Shift { id: number; name_ar: string; name_en: string; code: string; start_time: string; end_time: string; is_active: boolean; }
interface Role { id: number; name_ar: string; name_en: string; code: string; is_active: boolean; }

type TabType = 'departments' | 'positions' | 'ranks' | 'shifts' | 'roles';

const tabs: { id: TabType; label: string; icon: any }[] = [
  { id: 'departments', label: 'الأقسام', icon: Building2 },
  { id: 'positions', label: 'المناصب', icon: Briefcase },
  { id: 'ranks', label: 'المراتب', icon: Layers },
  { id: 'shifts', label: 'الورديات', icon: Clock },
  { id: 'roles', label: 'الأدوار', icon: Shield },
];

export default function StructureManager() {
  const { addToast } = useUIStore();
  const [tab, setTab] = useState<TabType>('departments');
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [positions, setPositions] = useState<Pos[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const tables = { departments, positions, ranks, shifts, roles };
  const setters = { setDepartments, setPositions, setRanks, setShifts, setRoles };
  const tableNames = { departments: 'structure_departments', positions: 'structure_positions', ranks: 'structure_ranks', shifts: 'structure_shifts', roles: 'structure_roles' };

  const structureServices: Record<string, any> = {
    departments: structureDepartmentService,
    positions: structurePositionService,
    ranks: structureRankService,
    shifts: structureShiftService,
    roles: structureRoleService,
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [d, p, r, s, rolesData] = await Promise.all([
        structureDepartmentService.findAllDepts(),
        structurePositionService.findAllPositions(),
        structureRankService.findAllRanks(),
        structureShiftService.findAllShifts(),
        structureRoleService.findAllRoles(),
      ]);
      if (d) setDepartments(d); if (p) setPositions(p);
      if (r) setRanks(r); if (s) setShifts(s);
      if (rolesData) setRoles(rolesData);
    } catch (err) { addToast('فشل تحميل البيانات', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (item: any) => {
    try {
      const service = structureServices[tab];
      await service.upsertItem(item);
      addToast(item.id ? 'تم التحديث بنجاح' : 'تمت الإضافة بنجاح', 'success');
      setShowForm(false); setEditing(null);
      fetchData();
    } catch (err: any) { addToast(`خطأ: ${err.message}`, 'error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      const service = structureServices[tab];
      await service.deleteItem(id);
      addToast('تم الحذف بنجاح', 'success');
      fetchData();
    } catch (err: any) { addToast(`خطأ: ${err.message}`, 'error'); }
  };

  const syncStructureToProfiles = async (item: any, sourceTab: TabType) => {
    // لا حاجة لمزامنة فورية - إدارة الموظفين تسحب من structure_* مباشرة
  };

  const getDeptName = (id: number) => departments.find(d => d.id === id)?.name_ar || `قسم #${id}`;

  const emptyForm = () => {
    switch (tab) {
      case 'departments': return { name_ar: '', name_en: '', code: '', is_active: true, sort_order: 0 };
      case 'positions': return { name_ar: '', name_en: '', department_id: departments[0]?.id || 0, is_active: true };
      case 'ranks': return { name_ar: '', name_en: '', code: '', level: 0, is_active: true };
      case 'shifts': return { name_ar: '', name_en: '', code: '', start_time: '', end_time: '', is_active: true };
      case 'roles': return { name_ar: '', name_en: '', code: '', is_active: true };
    }
  };

  const renderForm = () => {
    const f = editing || emptyForm();
    const update = (key: string, val: any) => {
      if (editing) setEditing({ ...editing, [key]: val });
      else setEditing({ ...emptyForm(), [key]: val });
    };

    return (
      <Card className="border-2 border-indigo-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{editing?.id ? 'تعديل' : 'إضافة'}</h3>
          <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">الاسم بالعربية</label>
            <input type="text" value={f.name_ar} onChange={e => update('name_ar', e.target.value)} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">الاسم بالإنجليزية</label>
            <input type="text" value={f.name_en || ''} onChange={e => update('name_en', e.target.value)} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-left" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">الرمز (Code)</label>
            <input type="text" value={f.code || ''} onChange={e => update('code', e.target.value)} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-left font-mono" dir="ltr" />
          </div>
          {tab === 'positions' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">القسم</label>
              <select value={f.department_id || departments[0]?.id} onChange={e => update('department_id', parseInt(e.target.value))} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500">
                {departments.filter(d => d.is_active).map(d => <option key={d.id} value={d.id}>{d.name_ar}</option>)}
              </select>
            </div>
          )}
          {tab === 'ranks' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">المستوى</label>
              <input type="number" value={f.level} onChange={e => update('level', parseInt(e.target.value))} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
            </div>
          )}
          {(tab === 'shifts') && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">بداية الوردية</label>
                <input type="time" value={f.start_time || ''} onChange={e => update('start_time', e.target.value)} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">نهاية الوردية</label>
                <input type="time" value={f.end_time || ''} onChange={e => update('end_time', e.target.value)} className="w-full border rounded-xl px-3 py-2 outline-none focus:border-indigo-500" />
              </div>
            </>
          )}
          <div className="flex items-center gap-2 pt-5">
            <input type="checkbox" checked={f.is_active !== false} onChange={e => update('is_active', e.target.checked)} className="w-5 h-5 text-indigo-600" />
            <label className="text-sm font-semibold">نشط</label>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 rounded-xl font-bold bg-slate-100 hover:bg-slate-200">إلغاء</button>
          <button onClick={() => handleSave(f)} disabled={!f.name_ar?.trim()} className="px-4 py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            <Save size={16} /> {editing?.id ? 'تحديث' : 'إضافة'}
          </button>
        </div>
      </Card>
    );
  };

  const renderList = () => {
    const data = tables[tab];
    if (loading) return <div className="text-center py-10"><RefreshCw className="animate-spin mx-auto" size={32} /></div>;

    return (
      <div className="space-y-2">
        {data.map((item: any) => (
          <div key={item.id} className={`bg-white rounded-xl p-4 border flex items-center justify-between transition-all ${item.is_active === false ? 'border-slate-200 opacity-60' : 'border-slate-200 hover:shadow-sm'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.is_active === false ? 'bg-slate-100' : 'bg-indigo-100'}`}>
                {tab === 'departments' && <Building2 size={18} className={item.is_active === false ? 'text-slate-400' : 'text-indigo-600'} />}
                {tab === 'positions' && <Briefcase size={18} className={item.is_active === false ? 'text-slate-400' : 'text-emerald-600'} />}
                {tab === 'ranks' && <Layers size={18} className={item.is_active === false ? 'text-slate-400' : 'text-amber-600'} />}
                {tab === 'shifts' && <Clock size={18} className={item.is_active === false ? 'text-slate-400' : 'text-cyan-600'} />}
                {tab === 'roles' && <Shield size={18} className={item.is_active === false ? 'text-slate-400' : 'text-purple-600'} />}
              </div>
              <div>
                <p className="font-bold text-slate-800">{item.name_ar}</p>
                <p className="text-xs text-slate-500">
                  {item.name_en && <span className="ml-3">{item.name_en}</span>}
                  <span className="font-mono text-indigo-400">{item.code}</span>
                  {item.level !== undefined && <span className="mr-3">مستوى {item.level}</span>}
                  {item.department_id && <span className="mr-3">← {getDeptName(item.department_id)}</span>}
                  {item.start_time && <span className="mr-3">{item.start_time} - {item.end_time}</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {item.is_active === false && <CheckCircle2 size={16} className="text-red-400" />}
              <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit3 size={16} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-center py-10 text-slate-400">لا توجد بيانات</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="text-indigo-600" /> إدارة هيكلية النظام
          </h2>
          <p className="text-slate-500 text-sm mt-1">إضافة وتعديل الأقسام والمناصب والمراتب والورديات والأدوار</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold">
          <Plus size={18} /> إضافة
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setShowForm(false); setEditing(null); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm transition-all ${tab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Info Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {tabs.map(t => (
          <div key={t.id} className={`rounded-xl p-3 border text-center ${tab === t.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
            <p className="text-2xl font-black text-slate-800">{tables[t.id].length}</p>
            <p className="text-xs text-slate-500">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      {showForm && renderForm()}

      {/* List */}
      {renderList()}
    </div>
  );
}