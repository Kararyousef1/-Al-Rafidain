import { Shield, Search, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const roleVariants: Record<string, any> = {
  admin: 'danger',
  hr: 'success',
  employee: 'primary',
};

const roleLabels: Record<string, string> = {
  admin: 'مشرف',
  hr: 'HR',
  employee: 'موظف',
};

export default function AuditLogPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, profiles:actor_id(full_name, email)')
        .order('timestamp', { ascending: false });

      if (!error && data) {
        setAuditLogs(data.map((d: any) => ({
          ...d,
          actor: d.profiles ? (d.profiles.full_name || 'مستخدم بدون اسم') : 'نظام',
          actorRole: d.actor_role,
        })));
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filtered = auditLogs.filter(log =>
    !search || log.action?.includes(search) || log.actor?.includes(search) || log.target?.includes(search)
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">🛡️ سجل العمليات</h2>
        <p className="text-sm text-slate-500">تتبع جميع الأنشطة والعمليات في النظام</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث في السجل..."
          className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['الإجراء', 'المستخدم', 'الدور', 'الهدف', 'التفاصيل', 'الوقت'].map(h => (
                  <th key={h} className="text-right py-3 px-4 text-xs font-bold text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <Loader className="animate-spin mx-auto mb-2" />
                    جاري تحميل السجلات...
                  </td>
                </tr>
              ) : filtered.map((log, i) => (
                <tr key={log.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                        <Shield size={12} className="text-orange-500" />
                      </div>
                      <span className="font-semibold text-slate-800">{log.action}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{log.actor}</td>
                  <td className="py-3 px-4">
                    <Badge variant={roleVariants[log.actorRole || 'employee']} size="sm">{roleLabels[log.actorRole || 'employee']}</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{log.target}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs max-w-xs truncate">{log.details}</td>
                  <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                    {log.timestamp ? format(new Date(log.timestamp), 'dd MMM HH:mm', { locale: ar }) : 'غير محدد'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Shield size={36} className="mx-auto mb-2 opacity-30" />
            <p>لا توجد نتائج</p>
          </div>
        )}
      </Card>
    </div>
  );
}
