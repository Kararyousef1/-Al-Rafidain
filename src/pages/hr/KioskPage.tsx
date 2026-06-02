import { useState, useEffect, useRef } from 'react';
import { LogIn, LogOut, Search, Clock, CheckCircle, XCircle, Building2, Users, Shield, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useUIStore } from '../../store';

interface AttendanceRecord {
  id:          string;
  employee_id: string;
  log_type:    'check_in' | 'check_out' | 'break_start' | 'break_end';
  timestamp:   string;
  notes?:      string;
  employee?:   { full_name: string, department: string };
}

interface Employee {
  id:         string;
  full_name:  string;
  department: string;
  position:   string;
  email:      string;
  employeeId: string;
  status:     string;
}

export default function KioskPage() {
  const { setActiveView } = useUIStore();
  const [search, setSearch]           = useState('');
  const [employees, setEmployees]     = useState<Employee[]>([]);
  const [records, setRecords]         = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]         = useState(false);
  const [flash, setFlash]             = useState<{ name: string; action: string; color: string } | null>(null);
  const [stats, setStats]             = useState({ present: 0, absent: 0, total: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchRef = useRef<HTMLInputElement>(null);

  // تحديث الساعة كل ثانية
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // جلب البيانات
  useEffect(() => {
    fetchData();
    searchRef.current?.focus();
  }, []);

  const fetchData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [{ data: emps }, { data: att }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, department, position, employee_id, status'),
      supabase.from('time_logs').select('*').gte('timestamp', today.toISOString()).order('timestamp', { ascending: false }),
    ]);

    const empList = (emps || []).map(e => ({ ...e, employeeId: e.employee_id }));
    setEmployees(empList);
    
    setRecords((att || []).map(r => ({
      ...r,
      employee: empList.find(e => e.id === r.employee_id)
    })));

    // حساب الإحصائيات
    const checkedInIds = new Set(
      (att || []).filter(r => r.log_type === 'check_in').map(r => r.employee_id)
    );
    const checkedOutIds = new Set(
      (att || []).filter(r => r.log_type === 'check_out').map(r => r.employee_id)
    );
    const present = [...checkedInIds].filter(id => !checkedOutIds.has(id)).length;

    setStats({
      present,
      total: empList.length,
      absent: empList.length - present,
    });
  };

  const filteredEmployees = employees.filter(e =>
    (e.full_name || '').includes(search) ||
    (e.email || '').includes(search) ||
    e.employeeId?.includes(search) ||
    e.department?.includes(search)
  );

  const getLastAction = (employeeId: string): 'check_in' | 'check_out' | null => {
    const empRecords = records.filter(r => r.employee_id === employeeId);
    if (empRecords.length === 0) return null;
    return empRecords[0].log_type as 'check_in' | 'check_out';
  };

  const handleAttendance = async (employee: Employee, action: 'check_in' | 'check_out') => {
    setLoading(true);
    try {
      const record = {
        employee_id: employee.id,
        log_type:    action,
        timestamp:   new Date().toISOString(),
        notes:       'عبر بوابة الحارس',
      };

      const { error } = await supabase.from('time_logs').insert(record);
      if (error) throw error;

      // إظهار تأكيد بصري
      setFlash({
        name:   employee.full_name,
        action: action === 'check_in' ? 'تسجيل دخول ✅' : 'تسجيل خروج 👋',
        color:  action === 'check_in' ? '#10b981' : '#f59e0b',
      });
      setTimeout(() => setFlash(null), 2500);

      setSearch('');
      searchRef.current?.focus();
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'Tajawal','Cairo',sans-serif", direction: 'rtl', padding: '1.5rem' }}>

      {/* ── تأكيد الحضور (Flash) ── */}
      {flash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: flash.color, borderRadius: '24px',
            padding: '3rem 4rem', textAlign: 'center',
            boxShadow: `0 0 80px ${flash.color}66`,
          }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>
              {flash.action.includes('دخول') ? '✅' : '👋'}
            </div>
            <p style={{ color: 'white', fontSize: '2rem', fontWeight: 800 }}>{flash.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.25rem', marginTop: '0.5rem' }}>{flash.action}</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', marginTop: '0.5rem' }}>
              {format(new Date(), 'HH:mm:ss')}
            </p>
          </div>
        </div>
      )}

      {/* ── الهيدر ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setActiveView('hr-dashboard')}
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px',
              width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white'
            }}
            title="العودة للوحة التحكم"
          >
            <LogOut size={18} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={26} color="white" />
          </div>
          <div>
            <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>بوابة الحارس</h1>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>تسجيل الحضور والانصراف</p>
          </div>
        </div>

        {/* الساعة */}
        <div style={{
          background: '#1e293b', borderRadius: '16px',
          padding: '1rem 1.5rem', textAlign: 'center',
          border: '1px solid #334155',
        }}>
          <p style={{ color: '#4f46e5', fontSize: '2rem', fontWeight: 800, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
            {format(currentTime, 'HH:mm:ss')}
          </p>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
            {format(currentTime, 'EEEE، d MMMM yyyy', { locale: ar })}
          </p>
        </div>
      </div>

      {/* ── الإحصائيات ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'الحاضرون', value: stats.present, color: '#10b981', icon: CheckCircle },
          { label: 'الغائبون', value: stats.absent,  color: '#ef4444', icon: XCircle },
          { label: 'إجمالي الموظفين', value: stats.total, color: '#6366f1', icon: Users },
        ].map(({ label, value, color, icon: Icon }, i) => (
          <div key={i} style={{
            background: '#1e293b', borderRadius: '16px',
            padding: '1.25rem', border: `1px solid ${color}33`,
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: `${color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <p style={{ color, fontSize: '2rem', fontWeight: 800, margin: 0 }}>{value}</p>
              <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* ── البحث والتسجيل ── */}
        <div>
          {/* حقل البحث */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={18} color="#64748b" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الموظف أو القسم..."
              style={{
                width: '100%', padding: '1rem 3rem 1rem 1rem',
                background: '#1e293b', border: '2px solid #334155',
                borderRadius: '14px', color: 'white', fontSize: '1rem',
                outline: 'none', boxSizing: 'border-box',
                fontFamily: "'Tajawal','Cairo',sans-serif",
              }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#334155'}
            />
          </div>

          {/* قائمة الموظفين */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '60vh', overflowY: 'auto' }}>
            {filteredEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                <Users size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                <p>لا يوجد موظفون مطابقون</p>
              </div>
            ) : (
              filteredEmployees.map(emp => {
                const lastAction = getLastAction(emp.id);
                const isIn = lastAction === 'check_in';

                return (
                  <div key={emp.id} style={{
                    background: '#1e293b', borderRadius: '14px',
                    padding: '1rem', border: '1px solid #334155',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '1rem',
                  }}>
                    {/* معلومات الموظف */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                      }}>
                        {emp.full_name?.charAt(0) || '؟'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {emp.full_name || 'بدون اسم'}
                        </p>
                        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
                          {emp.department} · {emp.employeeId || 'بدون رقم'}
                        </p>
                      </div>
                    </div>

                    {/* الحالة والأزرار */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {lastAction && (
                        <span style={{
                          padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                          background: isIn ? '#10b98122' : '#f59e0b22',
                          color: isIn ? '#10b981' : '#f59e0b',
                        }}>
                          {isIn ? 'داخل' : 'خارج'}
                        </span>
                      )}
                      <button
                        onClick={() => handleAttendance(emp, isIn ? 'check_out' : 'check_in')}
                        disabled={loading}
                        style={{
                          padding: '8px 16px', borderRadius: '10px', border: 'none',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          background: isIn
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white', fontWeight: 700, fontSize: '0.85rem',
                          display: 'flex', alignItems: 'center', gap: '6px',
                          fontFamily: "'Tajawal','Cairo',sans-serif",
                        }}>
                        {isIn
                          ? <><LogOut size={14} /> خروج</>
                          : <><LogIn size={14} /> دخول</>
                        }
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── سجل اليوم ── */}
        <div>
          <h3 style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600, margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            سجل اليوم — {records.length} سجل
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '65vh', overflowY: 'auto' }}>
            {records.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                <Clock size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                <p>لا توجد سجلات اليوم بعد</p>
              </div>
            ) : (
              records.map(record => (
                <div key={record.id} style={{
                  background: '#1e293b', borderRadius: '12px',
                  padding: '0.875rem 1rem',
                  border: `1px solid ${record.log_type === 'check_in' ? '#10b98133' : '#f59e0b33'}`,
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                    background: record.log_type === 'check_in' ? '#10b98122' : '#f59e0b22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {record.log_type === 'check_in'
                      ? <LogIn size={16} color="#10b981" />
                      : <LogOut size={16} color="#f59e0b" />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'white', fontWeight: 600, margin: 0, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {record.employee?.full_name || 'غير محدد'}
                    </p>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>{record.employee?.department || 'بدون قسم'}</p>
                  </div>
                  <div style={{ textAlign: 'left', flexShrink: 0 }}>
                    <p style={{
                      fontWeight: 700, fontSize: '0.875rem', margin: 0,
                      color: record.log_type === 'check_in' ? '#10b981' : '#f59e0b',
                    }}>
                      {record.log_type === 'check_in' ? 'دخول' : 'خروج'}
                    </p>
                    <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0 }}>
                      {record.timestamp ? format(new Date(record.timestamp), 'HH:mm:ss') : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}