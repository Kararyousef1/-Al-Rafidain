import { useState, useEffect, useMemo } from 'react';
import { Search, Star, Award, MapPin, Briefcase, Download, Loader, Mail, Phone, BarChart2, Users, User, GraduationCap, Languages, Smile, X, FileText, LayoutTemplate } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useUIStore } from '../../store';

export default function TalentMarketPage() {
  const { addToast } = useUIStore();
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewCv, setPreviewCv] = useState<any | null>(null);

  useEffect(() => {
    const fetchTalents = async () => {
      setLoading(true);
      try {
        // جلب الموظفين مع مهاراتهم وشهاداتهم
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, department, position, profile_image, cv_data');

        if (error) throw error;
        setTalents(profiles || []);
      } catch (err) {
        console.error('Error fetching talents:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTalents();
  }, []);

  const filteredTalents = talents.filter(t => {
    const searchLower = search.toLowerCase();
    if (t.full_name?.toLowerCase().includes(searchLower)) return true;
    if (t.position?.toLowerCase().includes(searchLower)) return true;
    // البحث بالمهارات
    if (Array.isArray(t.cv_data?.skills) && t.cv_data.skills.some((s: any) => s.name?.toLowerCase().includes(searchLower))) return true;
    return false;
  });

  // حساب إحصائيات المهارات والمناصب (مثال: كم مهندس، كم مبرمج...)
  const { topSkills, topPositions, topLanguages, cvCount } = useMemo(() => {
    const skillMap: Record<string, number> = {};
    const posMap: Record<string, number> = {};
    const langMap: Record<string, number> = {};
    let cvs = 0;

    talents.forEach(t => {
      // حساب المناصب
      const pos = t.position || 'غير محدد';
      posMap[pos] = (posMap[pos] || 0) + 1;

      // حساب المهارات
      (Array.isArray(t.cv_data?.skills) ? t.cv_data.skills : []).forEach((s: any) => {
        const skillName = s.name;
        if (skillName) skillMap[skillName] = (skillMap[skillName] || 0) + 1;
      });

      // حساب السير الذاتية واللغات
      if (t.cv_data && t.cv_data.summary) {
        cvs++;
      }
      if (t.cv_data && Array.isArray(t.cv_data.languages)) {
        t.cv_data.languages.forEach((l: any) => {
          if (l.name) langMap[l.name.trim()] = (langMap[l.name.trim()] || 0) + 1;
        });
      }
    });

    return {
      topSkills: Object.entries(skillMap).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topPositions: Object.entries(posMap).sort((a, b) => b[1] - a[1]).slice(0, 5),
      topLanguages: Object.entries(langMap).sort((a, b) => b[1] - a[1]).slice(0, 5),
      cvCount: cvs
    };
  }, [talents]);

  const handlePrintCV = (talent: any) => {
    addToast(`جاري تحضير السيرة الذاتية لـ ${talent.full_name}...`, 'info');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fade-in print:bg-white print:p-0">
      {/* Header (Hidden in Print) */}
      <div className="print:hidden">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
          <Award className="text-indigo-600" /> سجل مؤهلات وكفاءات الموظفين
        </h2>
        <p className="text-sm text-slate-500 mt-1">تتبع وتحليل المهارات، الشهادات، واكتشاف المواهب داخل مؤسستك</p>
      </div>

      {/* Search (Hidden in Print) */}
      <div className="relative print:hidden">
        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث بالاسم، المسمى الوظيفي، أو المهارة (مثال: تصميم، React، تسويق)..."
          className="w-full bg-white border border-slate-200 rounded-2xl pr-12 pl-4 py-3 text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 shadow-sm"
        />
      </div>

      {/* الإحصائيات التجميعية للمؤهلات */}
      {!loading && talents.length > 0 && (
        <div className="grid md:grid-cols-3 gap-5 print:hidden">
          <Card className="bg-indigo-50/50 border-indigo-100">
            <CardHeader>
              <CardTitle className="text-indigo-800 text-sm flex items-center gap-2"><Briefcase size={16}/> التوزيع حسب المسمى الوظيفي</CardTitle>
            </CardHeader>
            <div className="space-y-3 mt-2">
              {topPositions.map(([pos, count]) => (
                <div key={pos} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700 w-1/3 truncate">{pos}</span>
                  <div className="flex-1 h-2 bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(count / talents.length) * 100}%` }} />
                  </div>
                  <span className="text-xs font-black text-indigo-700 w-10 text-left">{count} موظف</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="bg-amber-50/50 border-amber-100">
            <CardHeader>
              <CardTitle className="text-amber-800 text-sm flex items-center gap-2"><Star size={16}/> أكثر المهارات توفراً بالشركة</CardTitle>
            </CardHeader>
            <div className="space-y-3 mt-2">
              {topSkills.map(([skill, count]) => (
                <div key={skill} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700 w-1/3 truncate">{skill}</span>
                  <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(count / talents.length) * 100}%` }} />
                  </div>
                  <span className="text-xs font-black text-amber-700 w-10 text-left">{count} شخص</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="bg-emerald-50/50 border-emerald-100">
            <CardHeader>
              <CardTitle className="text-emerald-800 text-sm flex items-center gap-2"><FileText size={16}/> السير الذاتية المرفوعة واللغات</CardTitle>
            </CardHeader>
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between mb-4 bg-white p-2.5 rounded-xl border border-emerald-100 shadow-sm">
                <span className="text-xs font-bold text-slate-600">موظفون أنشأوا السيرة الذكية:</span>
                <span className="text-sm font-black text-emerald-600 bg-emerald-100 px-3 py-1 rounded-lg">{cvCount} / {talents.length}</span>
              </div>
              {topLanguages.map(([lang, count]) => (
                <div key={lang} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-700 w-1/3 truncate">{lang}</span>
                  <div className="flex-1 h-2 bg-emerald-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(count / talents.length) * 100}%` }} />
                  </div>
                  <span className="text-xs font-black text-emerald-700 w-10 text-left">{count} شخص</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader className="animate-spin" />
            <span>جاري تحميل بيانات المواهب...</span>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-5 print:grid-cols-1 print:gap-8">
          {filteredTalents.map(talent => (
            <Card key={talent.id} className="flex flex-col print:shadow-none print:border-slate-300 print:break-inside-avoid">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {talent.profile_image ? (
                    <img src={talent.profile_image} alt={talent.full_name} className="w-14 h-14 rounded-2xl object-cover shadow-lg print:hidden" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-extrabold shadow-lg print:hidden">
                      {talent.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{talent.full_name}</h3>
                    <p className="text-indigo-600 font-medium text-sm flex items-center gap-1.5"><Briefcase size={14}/> {talent.position || 'غير محدد'}</p>
                    <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5"><MapPin size={12}/> {talent.department || 'القسم غير محدد'}</p>
                  </div>
                </div>
                <div className="print:hidden">
                  {talent.cv_data && Object.keys(talent.cv_data).length > 0 ? (
                    <button onClick={() => setPreviewCv(talent)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"><LayoutTemplate size={14}/> عرض السيرة الذكية</button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">لا يوجد سيرة</span>
                  )}
                </div>
              </div>

              {/* Contact Info (Only prominent in print or hover) */}
              <div className="flex gap-4 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
                <span className="flex items-center gap-1"><Mail size={12}/> {talent.email}</span>
                {talent.phone && <span className="flex items-center gap-1"><Phone size={12}/> {talent.phone}</span>}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Star size={12}/> أبرز المهارات</p>
                  <div className="flex flex-wrap gap-2">
                    {!Array.isArray(talent.cv_data?.skills) || talent.cv_data.skills.length === 0 ? (
                      <span className="text-xs text-slate-400">لم يضف مهارات بعد</span>
                    ) : talent.cv_data.skills.map((s: any, idx: number) => (
                      <Badge key={idx} variant="primary" className="px-2.5 py-1">
                        {s.name} <span className="opacity-50 ml-1 text-[10px]">{s.level}</span>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Award size={12}/> التعليم والمؤهلات</p>
                  <div className="space-y-1.5">
                    {!Array.isArray(talent.cv_data?.education) || talent.cv_data.education.length === 0 ? (
                      <span className="text-xs text-slate-400">لا توجد مؤهلات</span>
                    ) : talent.cv_data.education.map((c: any, idx: number) => (
                      <p key={idx} className="text-sm text-slate-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {c.degree} <span className="text-xs text-slate-400">({c.institution})</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── مودال عرض السيرة الذاتية المبنية بذكاء ── */}
      {previewCv && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white" onClick={() => setPreviewCv(null)}>
          <div className="bg-white w-full max-w-4xl min-h-[800px] rounded-3xl shadow-2xl relative my-8 print:my-0 print:shadow-none print:rounded-none animate-fade-in" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center print:hidden bg-slate-50 rounded-t-3xl">
              <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><LayoutTemplate className="text-indigo-600"/> السيرة الذاتية - {previewCv.full_name}</h3>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => window.print()} icon={<Download size={14}/>} className="shadow-sm hover:-translate-y-0.5">طباعة / حفظ PDF</Button>
                <button onClick={() => setPreviewCv(null)} className="p-2 bg-white rounded-lg text-slate-500 shadow-sm border border-slate-200 hover:text-slate-800 transition-colors"><X size={16}/></button>
              </div>
            </div>
            
            {/* CV Render Canvas */}
            <div className="p-8 sm:p-12 print:p-8">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10 border-b-2 border-slate-800 pb-8">
                {previewCv.profile_image ? (
                  <img src={previewCv.profile_image} className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 shadow-md" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-800 text-white flex items-center justify-center text-5xl font-black shadow-md">
                    {previewCv.full_name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1 text-center sm:text-right mt-2 sm:mt-0">
                  <h1 className="text-4xl font-black text-slate-900 mb-2">{previewCv.full_name}</h1>
                  <h2 className="text-xl font-bold text-indigo-600 mb-4">{previewCv.position || 'موظف'}</h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-5 text-sm text-slate-600 font-bold">
                    {previewCv.email && <span className="flex items-center gap-1.5"><Mail size={16} className="text-slate-400"/> {previewCv.email}</span>}
                    {previewCv.phone && <span className="flex items-center gap-1.5"><Phone size={16} className="text-slate-400"/> {previewCv.phone}</span>}
                    {previewCv.cv_data?.age && <span className="flex items-center gap-1.5"><User size={16} className="text-slate-400"/> العمر: {previewCv.cv_data.age}</span>}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-10">
                {/* Main Column */}
                <div className="sm:col-span-2 space-y-10">
                  {previewCv.cv_data?.summary && (
                    <section>
                      <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><User size={20} className="text-indigo-600"/> نبذة تعريفية</h3>
                      <p className="text-sm text-slate-700 leading-relaxed text-justify font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">{previewCv.cv_data.summary}</p>
                    </section>
                  )}
                  
                  {Array.isArray(previewCv.cv_data?.experience) && previewCv.cv_data.experience.length > 0 && (
                    <section>
                      <h3 className="text-xl font-black text-slate-800 mb-5 flex items-center gap-2"><Briefcase size={20} className="text-indigo-600"/> الخبرات العملية</h3>
                      <div className="space-y-6">
                        {previewCv.cv_data.experience.map((exp: any, i: number) => (
                          <div key={i} className="relative pl-4 border-r-2 border-indigo-200 pr-5">
                            <div className="absolute top-1.5 -right-[7px] w-3 h-3 rounded-full bg-indigo-500 shadow-sm" />
                            <h4 className="font-black text-slate-800 text-lg">{exp.role}</h4>
                            <div className="flex justify-between text-sm text-indigo-600 mb-2 font-bold mt-1">
                              <span>{exp.company}</span>
                              <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-xs">{exp.period}</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium mt-2">{exp.desc}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {Array.isArray(previewCv.cv_data?.education) && previewCv.cv_data.education.length > 0 && (
                    <section>
                      <h3 className="text-xl font-black text-slate-800 mb-5 flex items-center gap-2"><GraduationCap size={20} className="text-indigo-600"/> التعليم والمؤهلات</h3>
                      <div className="space-y-5">
                        {previewCv.cv_data.education.map((edu: any, i: number) => (
                          <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <h4 className="font-black text-slate-800 text-base">{edu.degree}</h4>
                            <div className="flex justify-between text-sm text-slate-600 font-bold mt-1.5">
                              <span>{edu.institution}</span>
                              <span className="text-indigo-600">{edu.period}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-10">
                  {Array.isArray(previewCv.cv_data?.skills) && previewCv.cv_data.skills.length > 0 && (
                    <section>
                      <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Star size={20} className="text-indigo-600"/> المهارات</h3>
                      <div className="flex flex-col gap-2.5">
                        {previewCv.cv_data.skills.map((s: any, i: number) => (
                          <div key={i} className="bg-slate-50 border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold w-full flex justify-between items-center shadow-sm">
                            {s.name} <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-1 rounded-lg">{s.level}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {Array.isArray(previewCv.cv_data?.languages) && previewCv.cv_data.languages.length > 0 && (
                    <section>
                      <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Languages size={20} className="text-indigo-600"/> اللغات</h3>
                      <ul className="space-y-3">
                        {previewCv.cv_data.languages.map((lang: any, i: number) => (
                          <li key={i} className="flex justify-between items-center text-sm font-bold text-slate-700 border-b border-slate-100 pb-3 last:border-0">
                            {lang.name} <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg text-[10px]">{lang.level}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {Array.isArray(previewCv.cv_data?.hobbies) && previewCv.cv_data.hobbies.length > 0 && (
                    <section>
                      <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><Smile size={20} className="text-indigo-600"/> الاهتمامات</h3>
                      <div className="flex flex-wrap gap-2">
                        {previewCv.cv_data.hobbies.map((h: string, i: number) => (
                          <span key={i} className="bg-indigo-50 border border-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-xs font-black shadow-sm">{h}</span>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}