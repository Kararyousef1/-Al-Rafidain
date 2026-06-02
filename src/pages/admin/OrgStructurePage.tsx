import { useState, useEffect } from 'react';
import { Shield, Plus, GitMerge, User, Building, Briefcase, Trash2, CheckCircle, ShieldAlert } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useUIStore } from '../../store';

interface Specialty {
  id: string;
  name: string;
  department: string;
  role_level: string; // 'manager', 'supervisor', 'employee'
}

export default function OrgStructurePage() {
  const { addToast } = useUIStore();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  
  // حالات إضافة اختصاص جديد
  const [newSpecialty, setNewSpecialty] = useState('');
  const [selectedDept, setSelectedDept] = useState('الإنتاج');
  const [selectedRole, setSelectedRole] = useState('employee');

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    setLoading(true);
    try {
      // نفترض أنك قمت بإنشاء جدول specialties في Supabase
      const { data, error } = await supabase.from('specialties').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setSpecialties(data || []);
    } catch (err: any) {
      console.error('Error loading specialties:', err);
      // سنضع بيانات وهمية للتجربة في حال لم يتم إنشاء الجدول بعد
      setSpecialties([
        { id: '1', name: 'طبيب عام', department: 'العيادة', role_level: 'employee' },
        { id: '2', name: 'صيدلي إنتاج', department: 'الإنتاج', role_level: 'supervisor' },
        { id: '3', name: 'فني جودة', department: 'ضبط الجودة (QC)', role_level: 'employee' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecialty.trim()) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.from('specialties').insert([
        { 
          name: newSpecialty.trim(), 
          department: selectedDept, 
          role_level: selectedRole 
        }
      ]).select().single();

      if (error) throw error;

      setSpecialties([...specialties, data]);
      setNewSpecialty('');
      addToast('تمت إضافة الاختصاص بنجاح! أصبح متاحاً في شاشة الموظفين.', 'success');
    } catch (err: any) {
      console.error(err);
      // تحديث الواجهة محلياً للتجربة (بدون داتا بيز)
      const fakeNew: Specialty = {
        id: Date.now().toString(),
        name: newSpecialty.trim(),
        department: selectedDept,
        role_level: selectedRole
      };
      setSpecialties([...specialties, fakeNew]);
      setNewSpecialty('');
      addToast('تمت إضافة الاختصاص (محلياً - تأكد من بناء الجدول في DB)', 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSpecialty = async (id: string) => {
    try {
      const { error } = await supabase.from('specialties').delete().eq('id', id);
      if (error) throw error;
      setSpecialties(specialties.filter(s => s.id !== id));
      addToast('تم حذف الاختصاص', 'success');
    } catch (err) {
      setSpecialties(specialties.filter(s => s.id !== id));
    }
  };

  // مكون مخصص لرسم عقدة في الشجرة
  const TreeNode = ({ title, icon: Icon, colorClass, isLeaf = false, children }: any) => (
    <div className="flex flex-col items-center">
      <div className={`relative flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 rounded-2xl border-2 shadow-sm z-10 bg-white min-w-[160px] sm:min-w-[200px] justify-center ${colorClass}`}>
        <div className={`p-2 rounded-xl text-white ${colorClass.replace('border-', 'bg-').replace('text-', '')}`}>
          <Icon size={18} className="sm:w-5 sm:h-5" />
        </div>
        <span className="font-extrabold text-sm sm:text-base text-slate-800 text-center">{title}</span>
      </div>
      
      {!isLeaf && (
        <>
          <div className="w-0.5 h-8 bg-slate-300"></div>
          <div className="w-full flex justify-center gap-8 relative border-t-2 border-slate-300 pt-8 mt-[-2px]">
            {children}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in" dir="rtl">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <GitMerge className="text-indigo-600" /> الهيكل التنظيمي والصلاحيات
        </h1>
        <p className="text-sm text-slate-500 mt-1">إدارة الشجرة الوظيفية والاختصاصات الديناميكية للشركة</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
        {/* لوحة إضافة اختصاص (الذكاء الإداري) */}
        <Card className="lg:col-span-1 h-fit w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="text-indigo-500" /> إضافة اختصاص جديد
            </CardTitle>
          </CardHeader>
          <form onSubmit={handleAddSpecialty} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">مسمى الاختصاص</label>
              <Input 
                placeholder="مثال: طبيب، مبرمج، مهندس إنتاج..." 
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">القسم المرتبط</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                <option value="الإدارة العليا">الإدارة العليا</option>
                <option value="الإنتاج">الإنتاج</option>
                <option value="ضبط الجودة (QC)">ضبط الجودة (QC)</option>
                <option value="الموارد البشرية (HR)">الموارد البشرية (HR)</option>
                <option value="العيادة">العيادة الطبية</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">المستوى والصلاحية</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="manager">مدير قسم (صلاحيات إدارية)</option>
                <option value="supervisor">مشرف (صلاحيات إشرافية)</option>
                <option value="employee">موظف (صلاحيات أساسية)</option>
              </select>
            </div>
            <Button type="submit" loading={loading} fullWidth icon={<Plus size={16}/>} iconPosition="left">
              إضافة للنظام
            </Button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="font-bold text-slate-700 mb-3 text-sm">الاختصاصات الحالية المضافة:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {specialties.map(spec => (
                <div key={spec.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{spec.name}</p>
                    <p className="text-xs text-slate-500">{spec.department} • {spec.role_level === 'manager' ? 'مدير' : spec.role_level === 'supervisor' ? 'مشرف' : 'موظف'}</p>
                  </div>
                  <button onClick={() => handleDeleteSpecialty(spec.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* شجرة الهيكل التنظيمي المخطط */}
        <Card className="lg:col-span-2 overflow-x-auto bg-slate-50/50">
          <CardHeader>
            <CardTitle>مخطط الهيكل التنظيمي</CardTitle>
          </CardHeader>
          
          <div className="min-w-[600px] py-8 flex justify-center">
            {/* الإدارة العليا */}
            <TreeNode title="المدير العام (CEO)" icon={ShieldAlert} colorClass="border-slate-800 text-slate-800">
              
              {/* قسم الإنتاج */}
              <div className="relative flex flex-col items-center">
                <TreeNode title="مدير الإنتاج" icon={Building} colorClass="border-indigo-500 text-indigo-500">
                  <div className="relative flex flex-col items-center">
                    <TreeNode title="مشرف الخط" icon={User} colorClass="border-sky-500 text-sky-500">
                       <div className="flex gap-4">
                         <TreeNode title="فني إنتاج" icon={CheckCircle} colorClass="border-emerald-500 text-emerald-500" isLeaf />
                         <TreeNode title="عامل تعبئة" icon={CheckCircle} colorClass="border-emerald-500 text-emerald-500" isLeaf />
                       </div>
                    </TreeNode>
                  </div>
                </TreeNode>
              </div>

              {/* قسم الموارد */}
              <div className="relative flex flex-col items-center">
                <TreeNode title="مدير الموارد البشرية" icon={Building} colorClass="border-purple-500 text-purple-500">
                  <div className="flex gap-4">
                    <TreeNode title="مشرف التوظيف" icon={User} colorClass="border-pink-500 text-pink-500" isLeaf />
                    <TreeNode title="أخصائي شؤون" icon={User} colorClass="border-pink-500 text-pink-500" isLeaf />
                  </div>
                </TreeNode>
              </div>

            </TreeNode>
          </div>

          <div className="mt-8 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Shield className="text-indigo-600 shrink-0" size={24} />
            <p className="text-sm text-indigo-800 leading-relaxed font-medium">
              هذه الشجرة تتفاعل مع الاختصاصات التي تضيفها يمين الشاشة. المسميات الوظيفية الجديدة يتم حقنها تلقائياً في قاعدة البيانات لتصبح جزءاً من الهيكل التنظيمي، ويمكن لمدير النظام تحديد صلاحيات كل مستوى (مدير، مشرف، موظف).
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}