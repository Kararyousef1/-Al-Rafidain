import { useState } from 'react';
import { ChevronRight, Eye, EyeOff, Sparkles, Send, Info } from 'lucide-react';
import { useProblemStore, useAuthStore, useUIStore } from '../../store';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { TextArea, Select } from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { ProblemCategory, ProblemSeverity } from '../../types';

const aiSuggestions: Record<string, { severity: ProblemSeverity; actions: string[]; summary: string }> = {
  technical: {
    severity: 'high',
    actions: ['التواصل مع قسم تقنية المعلومات', 'توثيق المشكلة بالتفصيل', 'تحديد تأثيرها على العمل'],
    summary: 'مشكلة تقنية تؤثر على سير العمل وتتطلب متابعة عاجلة',
  },
  salary: {
    severity: 'critical',
    actions: ['التواصل الفوري مع قسم المالية', 'تقديم وثائق داعمة', 'متابعة يومية'],
    summary: 'مشكلة مالية حرجة تستوجب المعالجة الفورية',
  },
  hr: {
    severity: 'medium',
    actions: ['مراجعة سياسة الموارد البشرية', 'جدولة اجتماع مع HR', 'توثيق الطلب'],
    summary: 'طلب إداري يتعلق بالموارد البشرية',
  },
  management: {
    severity: 'medium',
    actions: ['التواصل مع المدير المباشر', 'طلب وساطة HR إذا لزم', 'توثيق التواصل السابق'],
    summary: 'مشكلة إدارية تتطلب تدخل الموارد البشرية',
  },
  workplace: {
    severity: 'medium',
    actions: ['الإبلاغ لقسم الصيانة', 'توثيق المشكلة بصور', 'متابعة الحل'],
    summary: 'مشكلة في بيئة العمل تؤثر على الإنتاجية',
  },
  other: {
    severity: 'low',
    actions: ['توثيق المشكلة', 'التواصل مع الجهة المختصة'],
    summary: 'مشكلة عامة تحتاج للمراجعة',
  },
};

export default function NewProblemPage() {
  const { user } = useAuthStore();
  const { setActiveView, addToast } = useUIStore();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'technical' as ProblemCategory,
    severity: 'medium' as ProblemSeverity,
    isAnonymous: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [dynamicSuggestion, setDynamicSuggestion] = useState<{ severity: ProblemSeverity; actions: string[]; summary: string } | null>(null);
  const [step, setStep] = useState(1);

  const currentSuggestion = dynamicSuggestion || aiSuggestions[form.category];

  const handleAIAnalyze = async () => {
    if (!form.title || !form.description) {
      addToast('يرجى ملء العنوان والوصف أولاً', 'warning');
      return;
    }
    setAiAnalyzing(true);
    
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing");

      const prompt = `أنت خبير موارد بشرية في منصة الرافدين. قم بتحليل المشكلة التالية التي يواجهها موظف.
العنوان: ${form.title}
الوصف: ${form.description}
الفئة: ${form.category}

قم بالرد بصيغة JSON صحيحة فقط بدون أي نصوص إضافية، تحتوي على المفاتيح التالية:
- "severity": (اختر واحدة فقط بناءً على خطورة المشكلة: "low", "medium", "high", "critical")
- "summary": (ملخص قصير ومهني للمشكلة في سطر واحد)
- "actions": (مصفوفة نصوص تحتوي على 3 خطوات عملية لحل المشكلة)`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error('فشل الاتصال بـ Gemini API');
      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;
      
      // تنظيف الاستجابة للحصول على JSON صافي
      const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      setDynamicSuggestion({
        severity: parsed.severity || 'medium',
        summary: parsed.summary || 'تم تحليل المشكلة بنجاح',
        actions: parsed.actions || ['التواصل مع الموارد البشرية']
      });

      setForm(prev => ({ ...prev, severity: parsed.severity || 'medium' }));
      setAiDone(true);
      addToast('تم تحليل المشكلة بنجاح 🤖', 'success');
    } catch (err) {
      console.error('AI Analysis failed:', err);
      // الرجوع للبيانات الافتراضية في حال فشل الاتصال أو عدم وجود المفتاح
      setDynamicSuggestion(aiSuggestions[form.category]);
      setForm(prev => ({ ...prev, severity: aiSuggestions[form.category].severity }));
      setAiDone(true);
      addToast('تم تحليل المشكلة (وضع عدم الاتصال)', 'info');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      addToast('يرجى ملء جميع الحقول المطلوبة', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('incidents').insert({
        title: form.title,
        description: form.description,
        category: form.category,
        severity: form.severity,
        is_anonymous: form.isAnonymous,
        reported_by: form.isAnonymous ? null : user?.id,
        status: 'pending',
        ai_analysis: dynamicSuggestion || undefined
      });
      if (error) throw error;
      addToast('تم رفع مشكلتك بنجاح ✅', 'success');
      setActiveView('employee-problems');
    } catch (err) {
      console.error(err);
      addToast('حدث خطأ أثناء رفع المشكلة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveView('employee-problems')}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">رفع مشكلة جديدة</h2>
          <p className="text-sm text-slate-500">سيتم مراجعة مشكلتك من قِبَل فريق الموارد البشرية</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {step > s ? '✓' : s}
            </div>
            <span className={`text-xs font-medium ${step >= s ? 'text-indigo-600' : 'text-slate-400'}`}>
              {s === 1 ? 'تفاصيل المشكلة' : s === 2 ? 'التحليل الذكي' : 'المراجعة والإرسال'}
            </span>
            {s < 3 && <div className={`flex-1 h-px ${step > s ? 'bg-indigo-300' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <Card className="space-y-4">
            <h3 className="font-bold text-slate-800 mb-2">📝 تفاصيل المشكلة</h3>

            <Input
              label="عنوان المشكلة"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="وصف موجز وواضح للمشكلة"
              required
            />

            <TextArea
              label="وصف تفصيلي"
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="اشرح المشكلة بالتفصيل: متى بدأت؟ كيف تؤثر عليك؟ ما الذي جربته حتى الآن؟"
              rows={5}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="فئة المشكلة"
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value as ProblemCategory, }))}
                options={[
                  { value: 'technical', label: '💻 تقني' },
                  { value: 'hr', label: '👥 موارد بشرية' },
                  { value: 'management', label: '📋 إدارة' },
                  { value: 'workplace', label: '🏢 بيئة عمل' },
                  { value: 'salary', label: '💰 رواتب' },
                  { value: 'other', label: '📌 أخرى' },
                ]}
              />
              <Select
                label="مستوى الأولوية"
                value={form.severity}
                onChange={e => setForm(prev => ({ ...prev, severity: e.target.value as ProblemSeverity }))}
                options={[
                  { value: 'low', label: '🟢 منخفض' },
                  { value: 'medium', label: '🟡 متوسط' },
                  { value: 'high', label: '🟠 عالٍ' },
                  { value: 'critical', label: '🔴 حرج' },
                ]}
              />
            </div>

            {/* Anonymity toggle */}
            <div className={`rounded-xl p-4 border-2 transition-all cursor-pointer ${
              form.isAnonymous ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-slate-50'
            }`} onClick={() => setForm(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {form.isAnonymous ? <EyeOff size={20} className="text-indigo-600" /> : <Eye size={20} className="text-slate-500" />}
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {form.isAnonymous ? 'الإبلاغ مجهول الهوية' : 'الإبلاغ بهويتك'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {form.isAnonymous ? 'لن يعرف أحد هويتك - ضمان سرية تامة' : 'سيتم إظهار اسمك لفريق HR'}
                    </p>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full transition-all ${form.isAnonymous ? 'bg-indigo-600' : 'bg-slate-300'} relative`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isAnonymous ? 'left-1' : 'right-1'}`} />
                </div>
              </div>
            </div>

            <Button fullWidth onClick={() => setStep(2)} type="button">
              التالي: التحليل الذكي
            </Button>
          </Card>
        )}

        {step === 2 && (
          <Card className="space-y-4">
            <h3 className="font-bold text-slate-800 mb-2">🤖 التحليل بالذكاء الاصطناعي</h3>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
              <div className="flex items-start gap-3">
                <Info size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-indigo-700">
                  سيقوم الذكاء الاصطناعي بتحليل مشكلتك واقتراح مستوى الأولوية والإجراءات المناسبة
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-slate-500 mb-2">ملخص المشكلة:</p>
              <p className="text-sm font-semibold text-slate-800">{form.title || 'لم يتم إدخال عنوان'}</p>
              <p className="text-xs text-slate-500 line-clamp-3">{form.description || 'لم يتم إدخال وصف'}</p>
            </div>

            {aiDone && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                <p className="text-sm font-bold text-emerald-700">✅ نتيجة التحليل</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">الأولوية المقترحة:</span>
                  <Badge variant={currentSuggestion.severity === 'critical' ? 'danger' : currentSuggestion.severity === 'high' ? 'danger' : currentSuggestion.severity === 'medium' ? 'warning' : 'success'}>
                    {currentSuggestion.severity === 'critical' ? 'حرج' : currentSuggestion.severity === 'high' ? 'عالٍ' : currentSuggestion.severity === 'medium' ? 'متوسط' : 'منخفض'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600">{currentSuggestion.summary}</p>
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-1">الإجراءات المقترحة:</p>
                  <ul className="space-y-1">
                    {currentSuggestion.actions.map((action, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              fullWidth
              onClick={handleAIAnalyze}
              loading={aiAnalyzing}
              icon={<Sparkles size={15} />}
              iconPosition="left"
              type="button"
            >
              {aiDone ? 'إعادة التحليل' : 'تحليل بالذكاء الاصطناعي'}
            </Button>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)} type="button" className="flex-1">
                رجوع
              </Button>
              <Button onClick={() => setStep(3)} type="button" className="flex-1">
                التالي: مراجعة
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="space-y-4">
            <h3 className="font-bold text-slate-800 mb-2">✅ مراجعة وإرسال</h3>

            <div className="space-y-3">
              {[
                { label: 'العنوان', value: form.title },
                { label: 'الفئة', value: form.category === 'technical' ? 'تقني' : form.category === 'hr' ? 'موارد بشرية' : form.category === 'management' ? 'إدارة' : form.category === 'workplace' ? 'بيئة عمل' : form.category === 'salary' ? 'رواتب' : 'أخرى' },
                { label: 'الأولوية', value: form.severity === 'critical' ? 'حرج' : form.severity === 'high' ? 'عالٍ' : form.severity === 'medium' ? 'متوسط' : 'منخفض' },
                { label: 'الهوية', value: form.isAnonymous ? 'مجهول الهوية' : user?.name || user?.full_name || 'معروف' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                  <span className="text-xs text-slate-500">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-700">{item.value}</span>
                </div>
              ))}
              <div className="bg-slate-50 rounded-xl px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">الوصف</p>
                <p className="text-sm text-slate-700 line-clamp-3">{form.description}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)} type="button" className="flex-1">
                رجوع
              </Button>
              <Button
                type="submit"
                loading={submitting}
                icon={<Send size={15} />}
                iconPosition="left"
                className="flex-1"
              >
                إرسال المشكلة
              </Button>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
}
