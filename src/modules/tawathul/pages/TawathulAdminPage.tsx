/**
 * إدارة بوابة التواصل — للإدارة / HR / المطور
 */

import { useEffect, useState } from 'react';
import { Settings2, ShieldAlert, BarChart3, Save } from 'lucide-react';
import { canAdminTawathul } from '../permissions';
import { useAuthStore, useUIStore } from '../../../core/stores';
import { tawathulAdminService } from '../services';
import type { TawathulSettings } from '../types';
import Button from '../../../shared/components/ui/Button';
import Card from '../../../shared/components/ui/Card';

export default function TawathulAdminPage() {
  const { user } = useAuthStore();
  const addToast = useUIStore((s) => s.addToast);
  const allowed = canAdminTawathul(user?.role, user?.permissions);
  const [settings, setSettings] = useState<TawathulSettings | null>(null);
  const [stats, setStats] = useState({ conversations: 0, messages: 0, members: 0, channels: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      setLoading(true);
      try {
        const [s, st] = await Promise.all([
          tawathulAdminService.getSettings(),
          tawathulAdminService.getStats(),
        ]);
        setSettings(
          s || {
            id: '',
            tenant_id: '',
            is_enabled: true,
            allow_dms: true,
            allow_groups: true,
            allow_channels: true,
            allow_file_upload: true,
            max_file_size_mb: 25,
          },
        );
        setStats(st);
      } catch (e: any) {
        addToast(e?.message || 'تعذّر تحميل الإعدادات', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed, addToast]);

  if (!allowed) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center p-8 bg-white rounded-2xl border" dir="rtl">
        <ShieldAlert className="mx-auto text-amber-500 mb-3" size={40} />
        <h1 className="font-bold text-slate-800">إدارة بوابة التواصل للمشرفين فقط</h1>
      </div>
    );
  }

  const toggle = (key: keyof TawathulSettings) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: !(settings as any)[key] });
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await tawathulAdminService.updateSettings(settings);
      setSettings(updated);
      addToast('تم حفظ إعدادات بوابة التواصل', 'success');
    } catch (e: any) {
      addToast(e?.message || 'فشل الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
          <Settings2 size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">إدارة بوابة التواصل</h1>
          <p className="text-sm text-slate-500">إعدادات الشركة · الإحصائيات · السياسات</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'المحادثات', value: stats.conversations },
          { label: 'الرسائل', value: stats.messages },
          { label: 'العضويات', value: stats.members },
          { label: 'القنوات', value: stats.channels },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <BarChart3 size={14} /> {s.label}
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {loading ? '…' : s.value}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 space-y-4">
        <h2 className="font-bold text-slate-800">سياسات البوابة</h2>
        {loading || !settings ? (
          <p className="text-sm text-slate-400">جاري التحميل…</p>
        ) : (
          <>
            {(
              [
                ['is_enabled', 'تفعيل بوابة التواصل'],
                ['allow_dms', 'السماح بالمحادثات الفردية'],
                ['allow_groups', 'السماح بالمجموعات'],
                ['allow_channels', 'السماح بالقنوات'],
                ['allow_file_upload', 'السماح برفع الملفات'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0 cursor-pointer"
              >
                <span className="text-sm text-slate-700">{label}</span>
                <input
                  type="checkbox"
                  className="accent-indigo-600 w-4 h-4"
                  checked={!!(settings as any)[key]}
                  onChange={() => toggle(key)}
                />
              </label>
            ))}

            <label className="flex items-center justify-between gap-3 py-2">
              <span className="text-sm text-slate-700">الحد الأقصى لحجم الملف (MB)</span>
              <input
                type="number"
                min={1}
                max={100}
                value={settings.max_file_size_mb}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_file_size_mb: Number(e.target.value) || 25,
                  })
                }
                className="w-24 rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-left"
              />
            </label>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => void save()} loading={saving} icon={<Save size={14} />}>
                حفظ الإعدادات
              </Button>
            </div>
          </>
        )}
      </Card>

      <Card className="p-5 text-sm text-slate-600 leading-relaxed">
        <p className="font-semibold text-slate-800 mb-1">ملاحظات تشغيل</p>
        <ul className="list-disc pr-5 space-y-1">
          <li>نفّذ SQL: 300 ثم 301 ثم 302 على Supabase.</li>
          <li>Bucket التخزين: <code>tawathul</code> (أو fallback على public-assets).</li>
          <li>العزل يتم عبر tenant_id + RLS + عضوية المحادثة.</li>
        </ul>
      </Card>
    </div>
  );
}
