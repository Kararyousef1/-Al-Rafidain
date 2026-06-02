import { useState, useEffect } from 'react';
import { Clock, Download, FileText, MapPin, Coffee, LogIn, LogOut, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format, differenceInMinutes, startOfDay, endOfDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useUIStore } from '../../store';

export default function AttendancePage() {
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const todayStart = startOfDay(new Date()).toISOString();
        const todayEnd = endOfDay(new Date()).toISOString();

        // جلب جميع الموظفين وسجلات اليوم
        const [{ data: emps }, { data: logs }] = await Promise.all([
          supabase.from('profiles').select('id, full_name, department'),
          supabase.from('time_logs').select('*').gte('timestamp', todayStart).lte('timestamp', todayEnd)
        ]);

        if (!emps || !logs) return;

        // المعالجة والتحليل الدقيق للبيانات
        const analyzed = emps.map(emp => {
          const empLogs = logs.filter(l => l.employee_id === emp.id).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
          const checkIn = empLogs.find(l => l.log_type === 'check_in')?.timestamp;
          const checkOut = empLogs.find(l => l.log_type === 'check_out')?.timestamp;
          const breakStarts = empLogs.filter(l => l.log_type === 'break_start');
          const breakEnds = empLogs.filter(l => l.log_type === 'break_end');
          
          let breakDuration = 0;
          let currentDestination = '';
          let status = 'غائب';
          let statusColor = 'neutral';

          if (checkIn && !checkOut) { status = 'مداوم'; statusColor = 'success'; }
          if (checkIn && checkOut) { status = 'منصرف'; statusColor = 'primary'; }
          if (breakStarts.length > breakEnds.length) {
             status = 'في استراحة'; 
             statusColor = 'warning';
             currentDestination = breakStarts[breakStarts.length - 1].notes || 'غير محدد';
          }

          // حساب إجمالي وقت الاستراحات بالدقيقة
          breakStarts.forEach((bs, index) => {
             const be = breakEnds[index];
             if (be) {
               breakDuration += differenceInMinutes(new Date(be.timestamp), new Date(bs.timestamp));
             } else {
               // الاستراحة ما زالت مستمرة حتى اللحظة
               breakDuration += differenceInMinutes(new Date(), new Date(bs.timestamp));
             }
          });

          return { ...emp, checkIn, checkOut, breakDuration, currentDestination, status, statusColor };
        });

        setAttendanceData(analyzed);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  const handlePrintReport = () => {
    addToast('جاري تجهيز تقرير الحضور اليومي PDF...', 'info');
    setTimeout(() => window.print(), 800);
  };

  return (
    <div className="space-y-6 animate-fade-in print:bg-white print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Clock className="text-indigo-600" /> سجلات الحضور والانصراف
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            مراقبة وتحليل دقيق لحركة الموظفين ليوم: <span className="font-bold text-slate-700">{format(new Date(), 'dd MMMM yyyy', { locale: ar })}</span>
          </p>
        </div>
        <Button icon={<Download size={15}/>} iconPosition="left" onClick={handlePrintReport}>
          تصدير تقرير اليوم
        </Button>
      </div>

      <Card padding="none" className="print:shadow-none print:border-slate-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-right py-4 px-4 font-bold text-slate-500">الموظف</th>
                <th className="text-right py-4 px-4 font-bold text-slate-500">الحالة</th>
                <th className="text-right py-4 px-4 font-bold text-slate-500">وقت الدخول</th>
                <th className="text-right py-4 px-4 font-bold text-slate-500">وقت الخروج</th>
                <th className="text-right py-4 px-4 font-bold text-slate-500">مدة الاستراحات</th>
                <th className="text-right py-4 px-4 font-bold text-slate-500">موقع الاستراحة الحالي</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-500">
                    <Loader className="animate-spin mx-auto mb-3" />
                    جاري تحليل بيانات الحضور...
                  </td>
                </tr>
              ) : attendanceData.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">لا توجد بيانات موظفين</td></tr>
              ) : attendanceData.map((emp, i) => (
                <tr key={emp.id} className={`border-b border-slate-50 hover:bg-slate-50/80 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-800">{emp.full_name}</p>
                    <p className="text-xs text-slate-500">{emp.department || 'بدون قسم'}</p>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={emp.statusColor as any} size="sm">{emp.status}</Badge>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-600">
                    {emp.checkIn ? <span className="flex items-center gap-1.5"><LogIn size={14} className="text-emerald-500"/> {format(new Date(emp.checkIn), 'hh:mm a')}</span> : '---'}
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-600">
                    {emp.checkOut ? <span className="flex items-center gap-1.5"><LogOut size={14} className="text-rose-500"/> {format(new Date(emp.checkOut), 'hh:mm a')}</span> : '---'}
                  </td>
                  <td className="py-4 px-4">
                    {emp.breakDuration > 0 ? (
                      <span className="flex items-center gap-1.5 text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg w-max">
                        <Coffee size={14}/> {emp.breakDuration} دقيقة
                      </span>
                    ) : <span className="text-slate-400">0 دقيقة</span>}
                  </td>
                  <td className="py-4 px-4">
                    {emp.currentDestination ? (
                      <span className="flex items-center gap-1.5 text-indigo-600 text-xs font-semibold">
                        <MapPin size={13}/> {emp.currentDestination}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}