import { useState } from 'react';
import { Heart, Smile, Activity, Brain } from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import { supabase } from '../../lib/supabase';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { WellnessData } from '../../types';

const moodEmojis: Record<WellnessData['mood'], { emoji: string; label: string; color: string }> = {
  great: { emoji: '😄', label: 'ممتاز', color: 'border-emerald-400 bg-emerald-50' },
  good: { emoji: '🙂', label: 'جيد', color: 'border-blue-400 bg-blue-50' },
  neutral: { emoji: '😐', label: 'عادي', color: 'border-amber-400 bg-amber-50' },
  bad: { emoji: '😕', label: 'سيء', color: 'border-orange-400 bg-orange-50' },
  terrible: { emoji: '😢', label: 'سيء جداً', color: 'border-red-400 bg-red-50' },
};

const tips = [
  { icon: '🧘', title: 'تأمل يومي', desc: 'خصص 10 دقائق للتأمل صباحاً لتحسين تركيزك' },
  { icon: '🚶', title: 'المشي أثناء الراحة', desc: 'تحرك وامشِ خلال استراحة الغداء لتجديد نشاطك' },
  { icon: '💤', title: 'نوم كافٍ', desc: '7-8 ساعات يومياً تحسن إنتاجيتك بنسبة 30%' },
  { icon: '🥤', title: 'اشرب الماء', desc: 'اشرب 8 أكواب ماء يومياً لتحسين مزاجك وتركيزك' },
];

export default function WellnessPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [mood, setMood] = useState<WellnessData['mood']>('good');
  const [stress, setStress] = useState(30);
  const [energy, setEnergy] = useState(70);
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const score = Math.round((100 - stress) * 0.4 + energy * 0.4 +
        (mood === 'great' ? 90 : mood === 'good' ? 75 : mood === 'neutral' ? 60 : mood === 'bad' ? 40 : 20) * 0.2);
      
      const { error } = await supabase.from('wellness_entries').insert({
        employee_id: user?.id,
        date: format(new Date(), 'yyyy-MM-dd'),
        score,
        mood,
        stress,
        energy,
        notes: notes || null
      });
      if (error) throw error;
      setShowForm(false);
      setNotes('');
      addToast('تم تسجيل حالتك اليوم بنجاح ✅', 'success');
    } catch (err) {
      console.error(err);
      addToast('حدث خطأ أثناء حفظ الحالة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Today's check-in */}
      {!showForm ? (
        <Card className="border-2 border-dashed border-rose-200 bg-rose-50/30 text-center">
          <Heart size={32} className="mx-auto mb-3 text-rose-400" />
          <p className="font-bold text-slate-700 mb-1">كيف حالك اليوم؟</p>
          <p className="text-sm text-slate-500 mb-4">سجّل مزاجك وحالتك النفسية يومياً لمتابعة صحتك</p>
          <Button onClick={() => setShowForm(true)} icon={<Smile size={15} />} iconPosition="left">
            تسجيل يومي
          </Button>
        </Card>
      ) : (
        <Card className="space-y-5">
          <h3 className="font-bold text-slate-800">📝 تسجيل الحالة اليومية</h3>

          {/* Mood */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">كيف مزاجك اليوم؟</p>
            <div className="flex gap-2">
              {(Object.entries(moodEmojis) as [WellnessData['mood'], typeof moodEmojis[keyof typeof moodEmojis]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setMood(key)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    mood === key ? val.color + ' border-opacity-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl">{val.emoji}</span>
                  <span className="text-xs font-medium text-slate-600">{val.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Brain size={15} className="text-red-500" /> مستوى التوتر
              </p>
              <span className={`text-sm font-bold ${stress >= 70 ? 'text-red-600' : stress >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {stress}%
              </span>
            </div>
            <input
              type="range" min="0" max="100" value={stress}
              onChange={e => setStress(Number(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>منخفض</span><span>متوسط</span><span>مرتفع</span>
            </div>
          </div>

          {/* Energy */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Activity size={15} className="text-emerald-500" /> مستوى الطاقة
              </p>
              <span className={`text-sm font-bold ${energy >= 70 ? 'text-emerald-600' : energy >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                {energy}%
              </span>
            </div>
            <input
              type="range" min="0" max="100" value={energy}
              onChange={e => setEnergy(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Notes */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">ملاحظات (اختياري)</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="شارك أي شيء تودّ التعبير عنه..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowForm(false)} className="flex-1">إلغاء</Button>
            <Button onClick={handleSubmit} loading={submitting} className="flex-1" icon={<Heart size={14} />} iconPosition="left">
              حفظ الحالة
            </Button>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 نصائح للصحة النفسية</CardTitle>
        </CardHeader>
        <div className="grid md:grid-cols-2 gap-3">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
              <span className="text-2xl">{tip.icon}</span>
              <div>
                <p className="font-bold text-slate-800 text-sm">{tip.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
