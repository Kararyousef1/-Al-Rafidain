import { useState } from 'react';
import { Send, MessageSquare, Phone, Mail, Clock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useUIStore, useAuthStore } from '../../store';
import { supabase } from '../../lib/supabase';

export default function ContactPage() {
  const { addToast } = useUIStore();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ subject: '', message: '', priority: 'normal' });
  const [sending, setSending] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.message) {
      addToast('يرجى ملء جميع الحقول', 'warning');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from('hr_messages').insert({
        employee_id: user?.id,
        subject: form.subject,
        message: form.message,
        priority: form.priority,
        status: 'new',
      });
      if (error) throw error;
      setForm({ subject: '', message: '', priority: 'normal' });
      addToast('تم إرسال رسالتك إلى فريق الموارد البشرية ✅', 'success');
    } catch (err) {
      console.error(err);
      addToast('حدث خطأ أثناء إرسال الرسالة', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h2 className="text-xl font-extrabold text-slate-800">💬 تواصل مع الموارد البشرية</h2>

      {/* Contact info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Phone, label: 'الهاتف', value: '+966 11 123 4567', color: 'bg-emerald-50 text-emerald-600' },
          { icon: Mail, label: 'البريد', value: 'hr@kayan.sa', color: 'bg-blue-50 text-blue-600' },
          { icon: Clock, label: 'ساعات العمل', value: '8 ص - 5 م', color: 'bg-purple-50 text-purple-600' },
        ].map((info, i) => {
          const Icon = info.icon;
          return (
            <Card key={i} className={`text-center ${info.color.split(' ')[0]}`}>
              <div className={`w-10 h-10 rounded-xl ${info.color} flex items-center justify-center mx-auto mb-2`}>
                <Icon size={18} />
              </div>
              <p className="text-xs text-slate-500 mb-0.5">{info.label}</p>
              <p className="text-xs font-bold text-slate-700">{info.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Form */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare size={18} className="text-indigo-600" />
          <h3 className="font-bold text-slate-800">إرسال رسالة</h3>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">الموضوع <span className="text-red-500">*</span></label>
            <input
              value={form.subject}
              onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="موضوع رسالتك"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">الأولوية</label>
            <div className="flex gap-2">
              {[
                { value: 'low', label: 'منخفضة', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
                { value: 'normal', label: 'عادية', color: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
                { value: 'urgent', label: 'عاجلة', color: 'border-red-300 bg-red-50 text-red-700' },
              ].map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, priority: p.value }))}
                  className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer ${
                    form.priority === p.value ? p.color : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">الرسالة <span className="text-red-500">*</span></label>
            <textarea
              value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
              placeholder="اكتب رسالتك هنا بالتفصيل..."
              rows={6}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder-slate-400 outline-none resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <Button type="submit" fullWidth loading={sending} icon={<Send size={14} />} iconPosition="left">
            إرسال الرسالة
          </Button>
        </form>
      </Card>

      {/* Previous messages */}
      <Card>
        <h3 className="font-bold text-slate-800 mb-4">📨 الرسائل السابقة</h3>
        <div className="space-y-3">
          {[
            { subject: 'استفسار عن الإجازة السنوية', date: '2024-11-20', status: 'تم الرد', color: 'bg-emerald-50 text-emerald-700' },
            { subject: 'طلب تعديل بيانات الراتب', date: '2024-11-05', status: 'قيد المعالجة', color: 'bg-amber-50 text-amber-700' },
          ].map((msg, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-slate-700">{msg.subject}</p>
                <p className="text-xs text-slate-400 mt-0.5">{msg.date}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${msg.color}`}>{msg.status}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
