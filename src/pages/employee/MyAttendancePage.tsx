import { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, XCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function MyAttendancePage() {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ today: false, thisWeek: 0, thisMonth: 0 });

  useEffect(() => {
    if (!user) return;
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const startOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

      const { data } = await supabase
        .from('time_logs')
        .select('*')
        .eq('employee_id', user?.id)
        .gte('timestamp', startOfMonth)
        .order('timestamp', { ascending: false });

      if (data) {
        setLogs(data);
        const todayLogs = data.filter(l => l.timestamp?.startsWith(today));
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        const weekLogs = data.filter(l => new Date(l.timestamp) >= weekAgo);
        setStats({
          today: todayLogs.some(l => l.log_type === 'check_in'),
          thisWeek: weekLogs.filter(l => l.log_type === 'check_in').length,
          thisMonth: data.filter(l => l.log_type === 'check_in').length,
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-extrabold flex items-center gap-2"><Clock size={24} /> حضوري</h2>
        <p className="text-white/70 mt-1">سجل حضورك وانصرافك اليومي</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin" size={24} /></div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
              <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${stats.today ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {stats.today ? <CheckCircle size={20} /> : <XCircle size={20} />}
              </div>
              <p className="text-2xl font-black">{stats.today ? 'حاضر' : 'غائب'}</p>
              <p className="text-xs text-slate-500">اليوم</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
              <p className="text-2xl font-black">{stats.thisWeek}</p>
              <p className="text-xs text-slate-500">هذا الأسبوع</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100 text-center">
              <p className="text-2xl font-black">{stats.thisMonth}</p>
              <p className="text-xs text-slate-500">هذا الشهر</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar size={16} /> سجل الحضور</h3>
            {logs.length === 0 ? (
              <div className="text-center py-8 text-slate-400">لا توجد سجلات حضور بعد</div>
            ) : (
              <div className="space-y-2">
                {logs.slice(0, 20).map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.log_type === 'check_in' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {log.log_type === 'check_in' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      </div>
                      <span className="text-sm font-semibold">{log.log_type === 'check_in' ? 'حضور' : 'انصراف'}</span>
                    </div>
                    <span className="text-xs text-slate-500">{format(new Date(log.timestamp), 'dd MMM yyyy - HH:mm', { locale: ar })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}