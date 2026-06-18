import { useState, useEffect, useCallback } from 'react';
import {
  Clock, Calendar, CheckCircle, XCircle, Loader,
  Sun, Moon, Sunrise, Timer, ChevronRight, ChevronLeft,
  TrendingUp, TrendingDown, BarChart3, AlertTriangle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore, useUIStore } from '../../store';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import {
  determineShift, calculateLateMinutes,
  calculateTotalHours, calculateEarlyLeaveMinutes,
  STATUS_COLORS, STATUS_LABELS,
  AttendanceLog, AttendanceSummary as AttendanceSummaryType, ShiftType,
  DEFAULT_SHIFT_TIMINGS
} from '../../utils/shiftUtils';

export default function MyAttendancePage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<AttendanceSummaryType[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [todayStatus, setTodayStatus] = useState<{
    checked: boolean;
    checkIn?: string;
    checkOut?: string;
    shiftType?: ShiftType;
    status?: string;
    totalHours?: number;
    lateMinutes?: number;
  }>({ checked: false });
  const [stats, setStats] = useState({
    total: 0, present: 0, late: 0, absent: 0,
    totalHours: 0, avgHours: 0, weeklyStreak: 0,
  });

  // الحصول على معرف الموظف الحقيقي
  useEffect(() => {
    if (!user?.id) return;
    const getEmployeeId = async () => {
      const { data } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (data) setEmployeeId(data.id);
    };
    getEmployeeId();
  }, [user]);

  const fetchAttendance = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const startDate = format(new Date(currentYear, currentMonth, 1), 'yyyy-MM-dd');
      const endDate = format(new Date(currentYear, currentMonth + 1, 0), 'yyyy-MM-dd');
      const today = format(new Date(), 'yyyy-MM-dd');

      const [logsRes, summaryRes] = await Promise.all([
        supabase.from('attendance_logs')
          .select('*')
          .eq('employee_id', employeeId)
          .gte('shift_date', startDate)
          .lte('shift_date', endDate)
          .order('punch_time', { ascending: false }) as any,
        supabase.from('attendance_summary')
          .select('*')
          .eq('employee_id', employeeId)
          .gte('shift_date', startDate)
          .lte('shift_date', endDate)
          .order('shift_date', { ascending: false }) as any,
      ]);

      const logsData = logsRes.data || [];
      const summaryData = summaryRes.data || [];

      setLogs(logsData);
      setSummary(summaryData);

      // حالة اليوم
      const todaySummary = summaryData.find((s: any) => s.shift_date === today);
      if (todaySummary) {
        setTodayStatus({
          checked: true,
          checkIn: todaySummary.check_in,
          checkOut: todaySummary.check_out,
          shiftType: todaySummary.shift_type,
          status: todaySummary.status,
          totalHours: todaySummary.total_hours,
          lateMinutes: todaySummary.late_minutes,
        });
      } else {
        const todayLog = logsData.filter((l: any) => l.shift_date === today);
        if (todayLog.length > 0) {
          // Determine check-in and check-out based on punch_type if available
          let checkIn: string | undefined;
          let checkOut: string | undefined;
          
          if (todayLog[0]?.punch_type) {
            // If punch_type is available, use it to identify check-in/check-out
            const checkInEntry = todayLog.find((l: any) => l.punch_type === 'check-in' || l.punch_type === 'الدخول');
            const checkOutEntry = todayLog.find((l: any) => l.punch_type === 'check-out' || l.punch_type === 'الخروج');
            checkIn = checkInEntry?.punch_time;
            checkOut = checkOutEntry?.punch_time;
          } else {
            // Fallback: sort by time and use first as check-in, last as check-out
            const sorted = [...todayLog].sort((a: any, b: any) => 
              new Date(a.punch_time).getTime() - new Date(b.punch_time).getTime()
            );
            checkIn = sorted[0]?.punch_time;
            checkOut = sorted.length > 1 ? sorted[sorted.length - 1].punch_time : undefined;
          }
          
          const shiftType = checkIn ? determineShift(checkIn) : undefined;
          setTodayStatus({
            checked: true,
            checkIn,
            checkOut,
            shiftType,
            status: checkOut ? 'حضور_بوقت' : 'حضور',
            totalHours: checkOut ? calculateTotalHours(checkIn, checkOut) : undefined,
            lateMinutes: checkIn && shiftType ? calculateLateMinutes(checkIn, shiftType) : undefined,
          });
        } else {
          setTodayStatus({ checked: false });
        }
      }

      // إحصائيات
      const present = summaryData.filter((s: any) => s.status === 'حضور_بوقت' || s.status === 'متأخر').length;
      const late = summaryData.filter((s: any) => s.status === 'متأخر').length;
      const absent = summaryData.filter((s: any) => s.status === 'غائب').length;
      const totalHours = summaryData.reduce((sum: number, s: any) => sum + (s.total_hours || 0), 0);
      setStats({
        total: summaryData.length,
        present,
        late,
        absent,
        totalHours,
        avgHours: summaryData.length > 0 ? totalHours / summaryData.length : 0,
        weeklyStreak: Math.min(summaryData.filter((s: any) => s.status !== 'غائب').length, 7),
      });

    } catch (err: any) {
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId, user?.id, currentMonth, currentYear]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const navigateMonth = (delta: number) => {
    const newDate = new Date(currentYear, currentMonth + delta);
    setCurrentMonth(newDate.getMonth());
    setCurrentYear(newDate.getFullYear());
  };

  const monthName = format(new Date(currentYear, currentMonth), 'MMMM yyyy', { locale: ar });
  const shiftIcon = (type?: ShiftType) => {
    switch (type) {
      case 'صباحي': return <Sun size={14} className="text-amber-500" />;
      case 'مسائي': return <Moon size={14} className="text-indigo-500" />;
      case 'ليلي': return <Sunrise size={14} className="text-blue-500" />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold flex items-center gap-2"><Clock size={24} /> حضوري</h2>
            <p className="text-white/70 mt-1">سجل الحضور والانصراف مع تحليل ذكي</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader className="animate-spin" size={32} /></div>
      ) : (
        <>
          {/* Today Status */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">حالة اليوم</span>
                  <span className="text-sm text-slate-500">{format(new Date(), 'EEEE', { locale: ar })}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <div className="px-4 pb-4">
              {todayStatus.checked ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 text-center">
                    <div className="flex justify-center mb-1">
                      {shiftIcon(todayStatus.shiftType)}
                    </div>
                    <p className="text-xs text-slate-500">الوردية</p>
                    <p className="font-bold text-slate-700">{todayStatus.shiftType || 'صباحي'}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500">وقت الحضور</p>
                    <p className="font-bold text-slate-700">
                      {todayStatus.checkIn ? format(new Date(todayStatus.checkIn), 'HH:mm') : '--:--'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500">وقت الانصراف</p>
                    <p className="font-bold text-slate-700">
                      {todayStatus.checkOut ? format(new Date(todayStatus.checkOut), 'HH:mm') : '--:--'}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500">إجمالي الساعات</p>
                    <p className="font-bold text-slate-700">{todayStatus.totalHours?.toFixed(1) || '0'} س</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  <AlertTriangle size={24} className="mx-auto mb-2" />
                  <p className="font-medium">لا يوجد تسجيل حضور لليوم</p>
                  <p className="text-xs mt-1">يرجى تسجيل الدخول عبر جهاز البصمة</p>
                </div>
              )}
            </div>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <p className="text-xs font-bold text-slate-500">إجمالي أيام الحضور</p>
              <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats.present}</p>
              <p className="text-xs text-slate-400">من أصل {stats.total} يوم</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <p className="text-xs font-bold text-amber-600">تأخير</p>
              <p className="text-2xl font-extrabold text-amber-700 mt-1">{stats.late}</p>
              <p className="text-xs text-amber-500">مرة هذا الشهر</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <p className="text-xs font-bold text-red-600">غياب</p>
              <p className="text-2xl font-extrabold text-red-700 mt-1">{stats.absent}</p>
              <p className="text-xs text-red-500">يوم</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <p className="text-xs font-bold text-emerald-600">متوسط الساعات</p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1">{stats.avgHours.toFixed(1)}</p>
              <p className="text-xs text-emerald-500">ساعة/يوم</p>
            </div>
          </div>

          {/* Monthly Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center justify-between">
                  <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-slate-100 rounded-lg">
                    <ChevronRight size={18} />
                  </button>
                  <span className="font-bold text-slate-700">{monthName}</span>
                  <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-slate-100 rounded-lg">
                    <ChevronLeft size={18} />
                  </button>
                </div>
              </CardTitle>
            </CardHeader>
            <div className="px-4 pb-4">
              {summary.length === 0 ? (
                <div className="text-center py-8 text-slate-400">لا توجد سجلات حضور لهذا الشهر</div>
              ) : (
                <div className="grid grid-cols-7 gap-2 text-center">
                  {['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'].map(d => (
                    <div key={d} className="text-xs font-bold text-slate-500 py-1">{d}</div>
                  ))}
                  {(() => {
                    const days: React.ReactNode[] = [];
                    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
                    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

                    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
                      days.push(<div key={`empty-${i}`} />);
                    }

                    for (let d = 1; d <= daysInMonth; d++) {
                      const dateStr = format(new Date(currentYear, currentMonth, d), 'yyyy-MM-dd');
                      const daySummary = summary.find(s => s.shift_date === dateStr);
                      const today = format(new Date(), 'yyyy-MM-dd') === dateStr;
                      let bg = 'bg-slate-50';
                      let icon = null;
                      if (daySummary) {
                        if (daySummary.status === 'حضور_بوقت') bg = 'bg-emerald-100';
                        else if (daySummary.status === 'متأخر') bg = 'bg-amber-100';
                        else if (daySummary.status === 'غائب') bg = 'bg-red-100';
                        else if (daySummary.status === 'مجاز') bg = 'bg-purple-100';
                        else if (daySummary.status === 'عطلة') bg = 'bg-slate-100';
                      }
                      days.push(
                        <div key={d} className={`${bg} rounded-lg p-1.5 ${today ? 'ring-2 ring-indigo-400' : ''}`}>
                          <p className="text-xs font-bold text-slate-700">{d}</p>
                          {daySummary?.total_hours && (
                            <p className="text-[9px] text-slate-500">{daySummary.total_hours.toFixed(1)}س</p>
                          )}
                        </div>
                      );
                    }
                    return days;
                  })()}
                </div>
              )}
            </div>
          </Card>

          {/* Recent Logs */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">سجل البصمات</span>
                  <span className="text-xs text-slate-500">{logs.length} تسجيل</span>
                </div>
              </CardTitle>
            </CardHeader>
            <div className="px-4 pb-4 space-y-2 max-h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Clock size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="font-medium">لا توجد بصمات مسجلة</p>
                </div>
              ) : (
                logs.slice(0, 30).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-100 text-indigo-600">
                        <Clock size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {determineShift(log.punch_time)}
                        </p>
                        <p className="text-xs text-slate-500">{log.punch_type === 'check-in' ? 'حضور' : 'انصراف'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {format(new Date(log.punch_time), 'dd MMM - HH:mm', { locale: ar })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}