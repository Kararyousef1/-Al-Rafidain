import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Toast from '../../components/ui/Toast';
import type { 
  GatekeeperSession, 
  GatekeeperVisitorLog, 
  VisitorFormData 
} from '../../types/gatekeeper';
import { useAuthStore } from '../../store';
import { differenceInSeconds, format } from 'date-fns';
import { 
  UserPlus, 
  Users, 
  Clock, 
  Calendar,
  LogOut,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle,
  Download,
  Sun,
  Moon,
  BellRing,
  Shield,
  Zap
} from 'lucide-react';
import './gatekeeper.css';

export default function GatekeeperPage() {
  const { user } = useAuthStore();
  const [currentSession, setCurrentSession] = useState<GatekeeperSession | null>(null);
  const [visitors, setVisitors] = useState<GatekeeperVisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [gkName, setGkName] = useState('');
  const [gkPin, setGkPin] = useState('');
  const [takeoverName, setTakeoverName] = useState('');
  const [takeoverPin, setTakeoverPin] = useState('');
  const [editingVisitor, setEditingVisitor] = useState<GatekeeperVisitorLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  // أوقات السماح لفتح الورديات
  const currentHour = new Date().getHours();
  const isMorningValid = currentHour >= 8 && currentHour < 16;
  const isEveningValid = currentHour >= 16 && currentHour <= 23;
  const isNightValid = currentHour >= 0 && currentHour < 8;

  // حالات حركة الموظفين (تحديد التبويب الافتراضي بناءً على نوع الحارس)
  const initialTab = user?.gatekeeper_type === 'employee_movement' ? 'employees' : 'visitors';
  const [activeTab, setActiveTab] = useState<'visitors' | 'employees'>(initialTab);
  const [employees, setEmployees] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [approvedBreaks, setApprovedBreaks] = useState<any[]>([]);
  const [showMovementModal, setShowMovementModal] = useState(false);

  // حالات تأكيد الوصول وكشف التلاعب
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [arrivalData, setArrivalData] = useState<any>(null);
  const [actualLocation, setActualLocation] = useState('عاد لمكان الخروج');

  const [movementForm, setMovementForm] = useState({
    employee_id: '',
    employee_name: '',
    department: 'الإنتاج',
    customDepartment: '',
    destination: 'الكافتيريا',
    customDestination: '',
    notes: ''
  });

  const [formData, setFormData] = useState<VisitorFormData | any>({
    name: '',
    phone: '',
    company: '',
    purpose: '',
    notes: '',
    location: ''
  });

  // إنشاء جلسة جديدة عند فتح الصفحة
  useEffect(() => {
    initializeSession();
    loadEmployees();
  }, []);

  // الاشتراك في التحديثات اللحظية عندما تكون الجلسة متوفرة
  useEffect(() => {
    if (!currentSession) return;

    const channel = supabase
      .channel('gatekeeper-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gatekeeper_visitor_logs' },
        () => {
          loadVisitors(currentSession.id);
        }
      )
      .subscribe();
      
    const sessionChannel = supabase
      .channel('session-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'gatekeeper_sessions', filter: `id=eq.${currentSession.id}` },
        (payload) => {
          const newSession = payload.new as GatekeeperSession;
          if (!newSession.is_active) {
            setCurrentSession(null);
            showToast('تم إغلاق الوردية (تم الإعتماد أو انتهاء الوقت)', 'info');
          } else {
            setCurrentSession(newSession);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(sessionChannel);
    };
  }, [currentSession?.id]);

  // إغلاق الوردية تلقائياً عند انتهاء وقتها
  useEffect(() => {
    if (!currentSession || !currentSession.is_active || !currentSession.expected_end_time) return;

    const checkAutoClose = async () => {
      if (new Date() >= new Date(currentSession.expected_end_time!)) {
        try {
          await supabase.from('gatekeeper_sessions').update({ is_active: false, ended_at: new Date().toISOString() }).eq('id', currentSession.id);
        } catch (e) {}
      }
    };

    const interval = setInterval(checkAutoClose, 60000);
    checkAutoClose();
    return () => clearInterval(interval);
  }, [currentSession?.id, currentSession?.expected_end_time, currentSession?.is_active]);

  const initializeSession = async () => {
    try {
      setLoading(true);
      setDbError(null);

      // البحث عن جلسة نشطة أولاً لتجنب إنشاء جلسة جديدة عند كل تحديث للصفحة
      const { data: activeSession } = await supabase
        .from('gatekeeper_sessions')
        .select('*')
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeSession) {
        setCurrentSession(activeSession);
        await loadVisitors(activeSession.id);
        await loadMovements(activeSession.started_at);
        showToast('تم استعادة الجلسة النشطة', 'success');
        return;
      }
      
      // إذا لم يكن هناك جلسة نشطة، سيبقى currentSession بـ null 
      // وسنعرض شاشة اختيار الوردية للحارس
      setCurrentSession(null);
      setVisitors([]);
      
    } catch (error: any) {
      console.error('Error creating session:', error);
      showToast('فشل في إنشاء الجلسة', 'error');
      setDbError(error.message || 'تأكد من إضافة جداول البوابة في قاعدة البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleStartShift = async (shiftType: string, shiftLabel: string) => {
    if (shiftType === 'morning' && !isMorningValid) return showToast('عذراً، لا يمكن فتح الوردية الصباحية الآن', 'error');
    if (shiftType === 'evening' && !isEveningValid) return showToast('عذراً، لا يمكن فتح الوردية المسائية الآن', 'error');
    if (shiftType === 'night' && !isNightValid) return showToast('عذراً، لا يمكن فتح الوردية الليلية الآن', 'error');

    if (!gkName.trim() || gkPin.length !== 3) {
      showToast('يجب إدخال اسمك ورمز سري من 3 أرقام لبدء الوردية', 'error');
      return;
    }
    setLoading(true);
    try {
      // حساب وقت انتهاء الوردية
      const now = new Date();
      let endTime = new Date(now);
      if (shiftType === 'morning') {
        endTime.setHours(16, 0, 0, 0);
        if (now.getHours() >= 16) endTime.setDate(endTime.getDate() + 1);
      } else if (shiftType === 'evening') {
        endTime.setDate(endTime.getDate() + 1);
        endTime.setHours(0, 0, 0, 0);
      } else if (shiftType === 'night') {
        endTime.setHours(8, 0, 0, 0);
        if (now.getHours() >= 8) endTime.setDate(endTime.getDate() + 1);
      }

      const sessionName = `وردية ${shiftLabel} - ${new Date().toLocaleDateString('ar-SA')}`;
      const { data: session, error } = await supabase
        .from('gatekeeper_sessions')
        .insert({
          session_name: sessionName,
          shift_type: shiftType,
          gatekeeper_name: gkName.trim(),
          pin_code: gkPin,
          expected_end_time: endTime.toISOString(),
          is_active: true,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      setCurrentSession(session);
      await loadMovements(session.started_at);
      showToast(`تم بدء ${sessionName} بنجاح`, 'success');
    } catch (error: any) {
      console.error(error);
      showToast('فشل في بدء الوردية', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!currentSession) return;
    
    // طلب إغلاق الوردية مبكراً
    if (currentSession.expected_end_time && new Date() < new Date(currentSession.expected_end_time)) {
      if (!confirm('وقت الوردية لم ينتهِ بعد. هل تريد طلب إذن بإنهاء مبكر من الإدارة؟')) return;
      setLoading(true);
      try {
        const { error } = await supabase.from('gatekeeper_sessions').update({ handover_status: 'pending_end' }).eq('id', currentSession.id);
        if (error) throw error;
        setCurrentSession({ ...currentSession, handover_status: 'pending_end' });
        showToast('تم إرسال طلب الإنهاء المبكر للإدارة', 'success');
      } catch (err) {
        showToast('فشل في إرسال الطلب', 'error');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!confirm('هل أنت متأكد من إنهاء هذه الوردية؟ سيتم إرسال البيانات للموارد البشرية وإغلاق الشاشة.')) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('gatekeeper_sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('id', currentSession.id);
      if (error) throw error;
      
      showToast('تم إغلاق الوردية وإرسال البيانات بنجاح', 'success');
      setCurrentSession(null);
    } catch (error) {
      showToast('فشل في إنهاء الوردية', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestHandover = async () => {
    if (!currentSession) return;
    if (!confirm('هل أنت متأكد من طلب بديل طارئ؟ سيتم قفل الشاشة وإرسال تنبيه للموارد البشرية.')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('gatekeeper_sessions').update({ handover_status: 'pending' }).eq('id', currentSession.id);
      if (error) throw error;
      setCurrentSession({ ...currentSession, handover_status: 'pending' });
      showToast('تم إرسال الطلب للموارد البشرية', 'success');
    } catch (err) {
      showToast('فشل إرسال الطلب', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeover = async () => {
    if (!takeoverName.trim() || takeoverPin.length !== 3) return;
    if (takeoverPin !== currentSession?.temp_pin) {
      showToast('الرمز المؤقت غير صحيح!', 'error');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.from('gatekeeper_sessions')
        .update({ gatekeeper_name: takeoverName.trim(), handover_status: 'completed', temp_pin: null })
        .eq('id', currentSession.id).select().single();
      if (error) throw error;
      setCurrentSession(data);
      await loadMovements(data.started_at);
      showToast('تم استلام الوردية بنجاح!', 'success');
    } catch (err) {
      showToast('حدث خطأ أثناء الاستلام', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadVisitors = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('gatekeeper_visitor_logs')
        .select(`
          *,
          visitor:gatekeeper_visitors(*)
        `)
        .eq('session_id', sessionId)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      setVisitors(data || []);
    } catch (error: any) {
      console.error('Error loading visitors:', error);
      showToast('فشل في تحميل الزوار', 'error');
    }
  };

  const loadEmployees = async () => {
    // جلب جميع الحسابات (موظفين، مدراء، الخ) ليتمكن الحارس من تسجيل حركتهم
    const { data } = await supabase.from('profiles').select('id, full_name, email, department, shift');
    if (data) setEmployees(data);
  };

  const loadMovements = async (sessionStart?: string) => {
    if (!sessionStart) return;
    const { data, error } = await supabase
      .from('movements_log')
      .select('*')
      .gte('departure_at', sessionStart)
      .order('departure_at', { ascending: false });

    if (!error && data) setMovements(data);
    loadApprovedBreaks();
  };

  const loadApprovedBreaks = async () => {
    const { data, error } = await supabase
      .from('employee_breaks')
      .select(`*, employee:profiles!employee_breaks_employee_id_fkey(full_name, department)`)
      .in('status', ['approved', 'out'])
      .order('created_at', { ascending: false });
    if (!error && data) setApprovedBreaks(data);
  };

  const handleBreakAction = async (breakReq: any, action: 'out' | 'completed') => {
    try {
      setLoading(true);
      const updates: any = { status: action };
      if (action === 'out') updates.out_time = new Date().toISOString();
      if (action === 'completed') updates.return_time = new Date().toISOString();

      const { error } = await supabase.from('employee_breaks').update(updates).eq('id', breakReq.id);
      if (error) throw error;
      showToast(action === 'out' ? 'تم تسجيل خروج الموظف للاستراحة' : 'تم تسجيل عودة الموظف من الاستراحة', 'success');
      loadApprovedBreaks();
    } catch (err) {
      showToast('حدث خطأ أثناء تحديث حالة الاستراحة', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;

    try {
      setLoading(true);

      // إضافة أو تحديث الزائر
      let visitorId: string;

      if (editingVisitor) {
        // تحديث الزائر
        const { error: updateError } = await supabase
          .from('gatekeeper_visitors')
          .update({
            name: formData.name,
            phone: formData.phone,
            company: formData.company,
            purpose: formData.purpose,
            notes: formData.notes,
            location: formData.location,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingVisitor.visitor_id);

        if (updateError) throw updateError;
        visitorId = editingVisitor.visitor_id;
        showToast('تم تحديث بيانات الزائر بنجاح', 'success');
      } else {
        // إضافة زائر جديد
        const { data: visitor, error: visitorError } = await supabase
          .from('gatekeeper_visitors')
          .insert(formData)
          .insert({
            name: formData.name,
            phone: formData.phone,
            company: formData.company,
            purpose: formData.purpose,
            notes: formData.notes,
            location: formData.location
          })
          .select()
          .single();

        if (visitorError) throw visitorError;
        visitorId = visitor.id;

        // إضافة سجل دخول
        const { error: logError } = await supabase
          .from('gatekeeper_visitor_logs')
          .insert({
            session_id: currentSession.id,
            visitor_id: visitorId,
            badge_number: `B${Date.now().toString().slice(-6)}`,
            status: 'checked_in'
          });

        if (logError) throw logError;
        showToast('تم تسجيل الزائر بنجاح', 'success');
      }

      await loadVisitors(currentSession.id);
      resetForm();
    } catch (error: any) {
      console.error('Error saving visitor:', error);
      showToast('فشل في حفظ البيانات', 'error');
      if (error.message?.includes('location') || error.message?.includes('column')) {
        showToast('عذراً! يجب إضافة عمود (location) في Supabase أولاً لتتمكن من الحفظ', 'error');
      } else {
        showToast(error.message || 'فشل في حفظ البيانات', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (log: GatekeeperVisitorLog) => {
    if (!confirm('هل أنت متأكد من تسجيل خروج هذا الزائر؟')) return;

    try {
      const { error } = await supabase
        .from('gatekeeper_visitor_logs')
        .update({
          check_out_time: new Date().toISOString(),
          status: 'checked_out'
        })
        .eq('id', log.id);

      if (error) throw error;

      await loadVisitors(currentSession!.id);
      showToast('تم تسجيل الخروج بنجاح', 'success');
    } catch (error: any) {
      console.error('Error checking out:', error);
      showToast('فشل في تسجيل الخروج', 'error');
    }
  };

  const handleEdit = (log: GatekeeperVisitorLog) => {
    setEditingVisitor(log);
    setFormData({
      name: log.visitor?.name || '',
      phone: log.visitor?.phone || '',
      company: log.visitor?.company || '',
      purpose: log.visitor?.purpose || '',
      notes: log.visitor?.notes || '',
      location: log.visitor?.location || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (log: GatekeeperVisitorLog) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;

    try {
      const { error } = await supabase
        .from('gatekeeper_visitor_logs')
        .delete()
        .eq('id', log.id);

      if (error) throw error;

      await loadVisitors(currentSession!.id);
      showToast('تم حذف السجل بنجاح', 'success');
    } catch (error: any) {
      console.error('Error deleting:', error);
      showToast('فشل في حذف السجل', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      company: '',
      purpose: '',
      notes: '',
      location: ''
    });
    setEditingVisitor(null);
    setShowModal(false);
  };

  const handleMovementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementForm.employee_id) {
      showToast('عذراً! يجب اختيار موظف مسجل في النظام من القائمة', 'error');
      return;
    }
    try {
      setLoading(true);
      const finalDestination = movementForm.destination === 'مخصص' ? movementForm.customDestination : movementForm.destination;
      const finalDepartment = movementForm.department === 'مخصص' ? movementForm.customDepartment : movementForm.department;
      
      // التحقق من أن القسم المختار يطابق القسم الفعلي للموظف
      const matchedEmp = employees.find(emp => emp.id === movementForm.employee_id);
      if (matchedEmp && matchedEmp.department && matchedEmp.department.trim() !== finalDepartment.trim()) {
        showToast(`عذراً! الموظف "${matchedEmp.full_name || 'بدون اسم'}" مسجل في قسم "${matchedEmp.department}" وليس "${finalDepartment}"`, 'error');
        setLoading(false);
        return;
      }

      const approvedBreak = approvedBreaks.find(b => b.employee_id === movementForm.employee_id && b.status === 'approved');
      
      let finalNotes = movementForm.notes;
      if (approvedBreak) {
        const approvalNote = `[تصريح من المشرف: ${approvedBreak.supervisor_name}]`;
        finalNotes = finalNotes ? `${approvalNote} | ${finalNotes}` : approvalNote;
      } else {
        const noApprovalNote = `[بدون تصريح خروج]`;
        finalNotes = finalNotes ? `${noApprovalNote} | ${finalNotes}` : noApprovalNote;
      }

      const { error } = await supabase.from('movements_log').insert({
        employee_id: movementForm.employee_id || null,
        employee_name: movementForm.employee_name,
        department: finalDepartment,
        logged_by_id: user?.id,
        destination: finalDestination,
        notes: finalNotes,
        departure_at: new Date().toISOString()
      });

      if (error) throw error;

      if (approvedBreak) {
        // Update break status to out
        await supabase.from('employee_breaks').update({ status: 'out', out_time: new Date().toISOString() }).eq('id', approvedBreak.id);
      }

      showToast('تم تسجيل خروج الموظف بنجاح', 'success');
      setShowMovementModal(false);
      setMovementForm({ employee_id: '', employee_name: '', department: 'الإنتاج', customDepartment: '', destination: 'الكافتيريا', customDestination: '', notes: '' });
      await loadMovements(currentSession?.started_at);
    } catch (error: any) {
      console.error('Movement Error:', error);
      // رسالة مخصصة لتذكيرك بتحديث قاعدة البيانات
      if (error.message?.includes('department')) {
        showToast('عذراً! يجب تشغيل كود إضافة حقل "القسم" في Supabase أولاً', 'error');
      } else {
        showToast(error.message || 'فشل في تسجيل الحركة', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // دالة مخصصة لتوليد البيانات الوهمية للتجربة
  const generateMockMovements = async () => {
    if (!currentSession) {
      showToast('يجب فتح وردية أولاً لتسجيل الحركات', 'error');
      return;
    }
    setLoading(true);
    try {
      const mockData = [
        {
          employee_id: null,
          employee_name: 'موظف مصرح له',
          department: 'الإنتاج',
          destination: 'العيادة',
          notes: '[تصريح من المشرف: أحمد المدير] | ذهاب للعيادة الطبية',
          logged_by_id: user?.id,
          departure_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          employee_id: null,
          employee_name: 'موظف غير مصرح',
          department: 'المستودعات',
          destination: 'البوابة الخارجية',
          notes: '[بدون تصريح خروج] | خروج طارئ بدون إذن مسبق',
          logged_by_id: user?.id,
          departure_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          returned_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        }
      ];

      const { error } = await supabase.from('movements_log').insert(mockData);
      if (error) throw error;
      
      showToast('تم إدراج الحركات الوهمية بنجاح!', 'success');
      await loadMovements(currentSession.started_at);
    } catch (err: any) {
      showToast(err.message || 'فشل الإدراج', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmArrival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arrivalData || !currentSession) return;

    setLoading(true);
    try {
      let updatedNotes = arrivalData.notes || '';
      let isViolation = false;

      // كشف الكذبة: إذا كان المكان الفعلي لا يطابق الوجهة المصرح بها، وليس مجرد عودة عادية
      if (actualLocation !== 'عاد لمكان الخروج' && actualLocation !== arrivalData.destination) {
        isViolation = true;
        const violationText = `[مخالفة مسار 🚨] صرّح بالذهاب إلى (${arrivalData.destination}) ووصل فعلياً إلى (${actualLocation})`;
        updatedNotes = updatedNotes ? `${updatedNotes} | ${violationText}` : violationText;
      } else if (actualLocation !== 'عاد لمكان الخروج') {
        const arrivalText = `[تأكيد وصول] وصل إلى (${actualLocation}) كما صرّح.`;
        updatedNotes = updatedNotes ? `${updatedNotes} | ${arrivalText}` : arrivalText;
      }

      const { error } = await supabase.from('movements_log').update({ 
        returned_at: new Date().toISOString(),
        notes: updatedNotes
      }).eq('id', arrivalData.id);

      if (error) throw error;
      showToast(isViolation ? 'تم رصد مخالفة مسار وتسجيل الوصول' : 'تم تسجيل الوصول بنجاح', isViolation ? 'warning' : 'success');
      setShowArrivalModal(false);
      await loadMovements(currentSession.started_at);
    } catch (error) {
      showToast('فشل في تسجيل الوصول', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const calculateDuration = (departure: string, returned: string | null) => {
    if (!returned) return 'في الخارج ⏳';
    const totalSeconds = differenceInSeconds(new Date(returned), new Date(departure));

    if (totalSeconds < 1) {
      return 'أقل من ثانية';
    }
    if (totalSeconds < 60) {
      return `${totalSeconds} ثانية`;
    }

    const totalMinutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (totalMinutes < 60) {
      let result = `${totalMinutes} دقيقة`;
      if (seconds > 0) {
        result += ` و ${seconds} ثانية`;
      }
      return result;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let result = `${hours} ساعة`;
    if (minutes > 0) {
      result += ` و ${minutes} دقيقة`;
    }
    return result;
  };

  const exportToStyledExcel = (filename: string, headers: string[], data: any[][]) => {
    // تنظيف المدخلات لمنع XSS وضمان الأمان
    const escapeXml = (unsafe: any): string => {
      if (unsafe === null || unsafe === undefined) return '';
      return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // إزالة الأحرف غير الآمنة
    };

    // تحديد عرض الأعمدة تلقائياً بناءً على العنوان
    const getColumnWidth = (header: string): number => {
      if (header === '#') return 35;
      if (header.includes('هاتف') || header.includes('رقم')) return 130;
      if (header.includes('وقت') || header.includes('تاريخ')) return 160;
      if (header.includes('المدة') || header.includes('المستغرق')) return 140;
      if (header.includes('الاسم') || header.includes('الموظف') || header.includes('الزائر')) return 170;
      if (header.includes('ملاحظات') || header.includes('الغرض')) return 200;
      if (header.includes('الشركة') || header.includes('الوجهة') || header.includes('القسم')) return 160;
      if (header.includes('الحالة')) return 110;
      return 120;
    };

    // ألوان الصفوف بالتناوب - نظام لوني موحد وعصري
    const COLORS = {
      headerBg: '#1E1B4B',       // بنفسجي غامق للعنوان
      headerFont: '#FFFFFF',      // أبيض للنص
      accentBorder: '#4F46E5',    // أزرق بنفسجي للحدود
      rowEvenBg: '#EEF2FF',       // بنفسجي فاتح جداً للصفوف الزوجية
      rowOddBg: '#FFFFFF',        // أبيض للصفوف الفردية
      rowFont: '#1E293B',         // رمادي غامق للنص
      rowSubFont: '#475569',      // رمادي للتفاصيل
    };

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
  xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:html="http://www.w3.org/TR/REC-html40">

  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>${escapeXml(filename)}</Title>
    <Author>نظام إدارة البوابة</Author>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>

  <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">
    <WindowHeight>9000</WindowHeight>
    <WindowWidth>13860</WindowWidth>
    <ProtectStructure>False</ProtectStructure>
    <ProtectWindows>False</ProtectWindows>
  </ExcelWorkbook>

  <Styles>

    <!-- ستايل افتراضي للخلايا -->
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center" ss:Horizontal="Right" ss:ReadingOrder="RightToLeft"/>
      <Font ss:FontName="Tahoma" ss:Size="10" ss:Color="${COLORS.rowFont}"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
      </Borders>
    </Style>

    <!-- ستايل العنوان (Header) -->
    <Style ss:ID="Header">
      <Alignment ss:Vertical="Center" ss:Horizontal="Center" ss:ReadingOrder="RightToLeft" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="${COLORS.accentBorder}"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="2" ss:Color="${COLORS.accentBorder}"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="2" ss:Color="${COLORS.accentBorder}"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="2" ss:Color="${COLORS.accentBorder}"/>
      </Borders>
      <Font ss:FontName="Tahoma" ss:Size="12" ss:Color="${COLORS.headerFont}" ss:Bold="1"/>
      <Interior ss:Color="${COLORS.headerBg}" ss:Pattern="Solid"/>
    </Style>

    <!-- صف زوجي -->
    <Style ss:ID="RowEven">
      <Alignment ss:Vertical="Center" ss:Horizontal="Right" ss:ReadingOrder="RightToLeft" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
      </Borders>
      <Font ss:FontName="Tahoma" ss:Size="10" ss:Color="${COLORS.rowFont}"/>
      <Interior ss:Color="${COLORS.rowEvenBg}" ss:Pattern="Solid"/>
    </Style>

    <!-- صف فردي -->
    <Style ss:ID="RowOdd">
      <Alignment ss:Vertical="Center" ss:Horizontal="Right" ss:ReadingOrder="RightToLeft" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
      </Borders>
      <Font ss:FontName="Tahoma" ss:Size="10" ss:Color="${COLORS.rowFont}"/>
      <Interior ss:Color="${COLORS.rowOddBg}" ss:Pattern="Solid"/>
    </Style>

    <!-- ستايل خلية رقم الصف (#) -->
    <Style ss:ID="NumberEven">
      <Alignment ss:Vertical="Center" ss:Horizontal="Center" ss:ReadingOrder="RightToLeft"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
      </Borders>
      <Font ss:FontName="Tahoma" ss:Size="10" ss:Color="${COLORS.rowSubFont}" ss:Bold="1"/>
      <Interior ss:Color="${COLORS.rowEvenBg}" ss:Pattern="Solid"/>
    </Style>

    <Style ss:ID="NumberOdd">
      <Alignment ss:Vertical="Center" ss:Horizontal="Center" ss:ReadingOrder="RightToLeft"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Left"   ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Right"  ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
        <Border ss:Position="Top"    ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#C7D2FE"/>
      </Borders>
      <Font ss:FontName="Tahoma" ss:Size="10" ss:Color="${COLORS.rowSubFont}" ss:Bold="1"/>
      <Interior ss:Color="${COLORS.rowOddBg}" ss:Pattern="Solid"/>
    </Style>

  </Styles>

  <Worksheet ss:Name="البيانات">
    <Table ss:DefaultRowHeight="22" ss:DefaultColumnWidth="100">

      <!-- تحديد عرض الأعمدة -->
      ${headers.map(h => `<Column ss:Width="${getColumnWidth(h)}" ss:AutoFitWidth="0"/>`).join('\n      ')}

      <!-- صف العناوين -->
      <Row ss:Height="32">
        ${headers.map(h => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join('\n        ')}
      </Row>

      <!-- صفوف البيانات -->
      ${data.map((row, rowIndex) => {
        const isEven = rowIndex % 2 === 0;
        const rowStyle = isEven ? 'RowEven' : 'RowOdd';
        const numStyle = isEven ? 'NumberEven' : 'NumberOdd';

        const cells = row.map((cell, colIndex) =>
          `<Cell ss:StyleID="${colIndex === 0 ? numStyle : rowStyle}"><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`
        ).join('\n        ');

        return `<Row ss:AutoFitHeight="1">\n        ${cells}\n      </Row>`;
      }).join('\n      ')}

    </Table>

    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <!-- RTL: من اليمين لليسار -->
      <DisplayRightToLeft/>
      <RightToLeft>1</RightToLeft>
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>1</SplitHorizontal>
      <TopRowBottomPane>1</TopRowBottomPane>
      <ActivePane>2</ActivePane>
      <Panes>
        <Pane>
          <Number>3</Number>
        </Pane>
        <Pane>
          <Number>2</Number>
          <ActiveRow>1</ActiveRow>
        </Pane>
      </Panes>
      <Print>
        <ValidPrinterInfo/>
        <HorizontalResolution>600</HorizontalResolution>
        <VerticalResolution>600</VerticalResolution>
      </Print>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`;

    // إنشاء الملف وتنزيله بأمان
    const blob = new Blob(
      ['\uFEFF' + xml], // BOM لضمان ترميز UTF-8 الصحيح في Excel
      { type: 'application/vnd.ms-excel;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.xls`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // تنظيف الذاكرة بعد التنزيل
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleExportVisitors = () => {
    const headers = ['#', 'الاسم', 'الهاتف', 'الشركة', 'الغرض', 'الموقع/الوجهة', 'وقت الدخول', 'وقت الخروج', 'الحالة'];
    const data = filteredVisitors.map((log, i) => [
      String(i + 1),
      log.visitor?.name || '',
      log.visitor?.phone || '',
      log.visitor?.company || '',
      log.visitor?.purpose || '',
      log.visitor?.location || '',
      format(new Date(log.check_in_time), 'yyyy/MM/dd hh:mm:ss a'),
      log.check_out_time ? format(new Date(log.check_out_time), 'yyyy/MM/dd hh:mm:ss a') : '',
      log.status === 'checked_in' ? 'داخل المبنى' : 'خرج'
    ]);
    exportToStyledExcel(`سجل_الزوار_${format(new Date(), 'yyyy-MM-dd')}`, headers, data);
  };

  const handleExportMovements = () => {
    const headers = ['#', 'اسم الموظف', 'القسم / الصفة', 'الوجهة', 'وقت الخروج', 'وقت العودة', 'الوقت المستغرق', 'ملاحظات'];
    const data = filteredMovements.map((log, i) => {
      const emp = employees.find(e => e.id === log.employee_id);
      const empName = emp?.full_name || log.employee_name || 'غير معروف';
      return [
        String(i + 1), empName, log.department || emp?.department || '-', log.destination,
        format(new Date(log.departure_at), 'yyyy/MM/dd hh:mm:ss a'),
        log.returned_at ? format(new Date(log.returned_at), 'yyyy/MM/dd hh:mm:ss a') : 'في الخارج',
        calculateDuration(log.departure_at, log.returned_at),
        log.notes || ''
      ];
    });
    exportToStyledExcel(`حركة_الموظفين_${format(new Date(), 'yyyy-MM-dd')}`, headers, data);
  };

  const filteredVisitors = visitors.filter(log =>
    log.visitor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.visitor?.phone.includes(searchTerm) ||
    log.visitor?.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMovements = movements.filter(m => {
    const empName = employees.find(e => e.id === m.employee_id)?.full_name || m.employee_name || '';
    return empName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading && !currentSession) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-kayan-500" />
          <p className="text-gray-600">جاري تحميل النظام...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">🚪 نظام إدارة البوابة</h1>
        <p className="page-subtitle">تتبع دخول وخروج الزوار بسهولة</p>
      </div>

      {/* رسالة تنبيه إذا لم تكن قاعدة البيانات متصلة */}
      {dbError && !currentSession && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <div className="text-center py-8">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-700 mb-2">تعذر بدء جلسة البوابة</h3>
            <p className="text-red-600 mb-4 max-w-lg mx-auto">
              هذا يحدث لأن جداول "نظام البوابة" لم يتم إنشاؤها في قاعدة البيانات (Supabase).
              الرجاء التأكد من نسخ كود ملف <code>schema.sql</code> الخاص بالبوابة وتشغيله في Supabase.
            </p>
            <Button onClick={initializeSession} variant="primary">
              <RefreshCw className="w-4 h-4 ml-2 inline-block" /> إعادة المحاولة
            </Button>
          </div>
        </Card>
      )}

      {/* شاشة بدء الوردية (تظهر إذا لم يكن هناك جلسة نشطة) */}
      {!currentSession && !dbError && !loading && (
        <div className="max-w-2xl mx-auto mt-12 text-center animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
            <Shield className="w-20 h-20 text-indigo-500 mx-auto mb-6 opacity-20" />
            <h2 className="text-2xl font-extrabold text-slate-800 mb-2">تسجيل الدخول للوردية</h2>
            <p className="text-slate-500 mb-8">يجب بدء وردية جديدة للتمكن من تسجيل حركة الزوار والموظفين.</p>
            
            <div className="flex gap-4 max-w-sm mx-auto mb-8">
              <Input 
                placeholder="اسم الحارس..." 
                value={gkName} 
                onChange={e => setGkName(e.target.value)} 
              />
              <Input 
                placeholder="الرمز (3 أرقام)" 
                type="password" maxLength={3} 
                value={gkPin} 
                onChange={e => setGkPin(e.target.value.replace(/\D/g, ''))} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button disabled={!isMorningValid} onClick={() => handleStartShift('morning', 'صباحي')} className={`group p-6 rounded-2xl border-2 transition-all text-center ${isMorningValid ? 'border-slate-100 hover:border-amber-400 hover:bg-amber-50 cursor-pointer' : 'border-slate-100 opacity-50 bg-slate-50 cursor-not-allowed'}`}>
                <Sun className={`w-10 h-10 mx-auto mb-3 transition-transform ${isMorningValid ? 'text-amber-500 group-hover:scale-110' : 'text-slate-400'}`} />
                <h3 className="font-bold text-slate-800 mb-1">الوردية الصباحية</h3>
                <p className="text-xs text-slate-500 font-mono">08:00 ص - 04:00 م</p>
              </button>
              
              <button disabled={!isEveningValid} onClick={() => handleStartShift('evening', 'مسائي')} className={`group p-6 rounded-2xl border-2 transition-all text-center ${isEveningValid ? 'border-slate-100 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer' : 'border-slate-100 opacity-50 bg-slate-50 cursor-not-allowed'}`}>
                <Clock className={`w-10 h-10 mx-auto mb-3 transition-transform ${isEveningValid ? 'text-indigo-500 group-hover:scale-110' : 'text-slate-400'}`} />
                <h3 className="font-bold text-slate-800 mb-1">الوردية المسائية</h3>
                <p className="text-xs text-slate-500 font-mono">04:00 م - 12:00 ص</p>
              </button>

              <button disabled={!isNightValid} onClick={() => handleStartShift('night', 'ليلي')} className={`group p-6 rounded-2xl border-2 transition-all text-center ${isNightValid ? 'border-slate-100 hover:border-slate-800 hover:bg-slate-900 cursor-pointer' : 'border-slate-100 opacity-50 bg-slate-50 cursor-not-allowed'}`}>
                <Moon className={`w-10 h-10 mx-auto mb-3 transition-transform ${isNightValid ? 'text-slate-700 group-hover:scale-110 group-hover:text-white' : 'text-slate-400'}`} />
                <h3 className={`font-bold mb-1 ${isNightValid ? 'text-slate-800 group-hover:text-white' : 'text-slate-500'}`}>الوردية الليلية</h3>
                <p className={`text-xs font-mono ${isNightValid ? 'text-slate-500 group-hover:text-slate-400' : 'text-slate-400'}`}>12:00 ص - 08:00 ص</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* شاشة انتظار تسليم الوردية */}
      {currentSession && currentSession.handover_status === 'pending' && (
        <div className="max-w-xl mx-auto mt-12 text-center animate-fade-in">
          <Card className="bg-amber-50 border-amber-200 py-12">
            <BellRing className="w-20 h-20 text-amber-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-extrabold text-amber-800 mb-2">في انتظار موافقة الموارد البشرية</h2>
            <p className="text-amber-700">تم إرسال طلب استبدال طارئ. الشاشة مقفلة حالياً حتى يتم الموافقة وتوليد الرمز للبديل.</p>
          </Card>
        </div>
      )}

      {/* شاشة استلام الوردية للبديل */}
      {currentSession && currentSession.handover_status === 'approved' && (
        <div className="max-w-xl mx-auto mt-12 text-center animate-fade-in">
          <Card className="bg-indigo-50 border-indigo-200 py-12">
            <ArrowRightLeft className="w-20 h-20 text-indigo-500 mx-auto mb-6" />
            <h2 className="text-2xl font-extrabold text-indigo-800 mb-2">استلام الوردية (بديل طارئ)</h2>
            <p className="text-indigo-600 mb-8">يُرجى إدخال اسمك والرمز المؤقت الذي حصلت عليه من الموارد البشرية.</p>
            <div className="flex gap-3 max-w-sm mx-auto mb-6">
              <Input placeholder="اسم الحارس البديل" value={takeoverName} onChange={e => setTakeoverName(e.target.value)} />
              <Input placeholder="الرمز (3 أرقام)" type="password" maxLength={3} value={takeoverPin} onChange={e => setTakeoverPin(e.target.value.replace(/\D/g, ''))} />
            </div>
            <Button onClick={handleTakeover} loading={loading} className="w-full max-w-sm mx-auto">تأكيد واستلام الوردية</Button>
          </Card>
        </div>
      )}

      {/* شاشة انتظار الموافقة على إنهاء الوردية مبكراً */}
      {currentSession && currentSession.handover_status === 'pending_end' && (
        <div className="max-w-xl mx-auto mt-12 text-center animate-fade-in">
          <Card className="bg-red-50 border-red-200 py-12">
            <BellRing className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-extrabold text-red-800 mb-2">في انتظار موافقة الإدارة للإنهاء</h2>
            <p className="text-red-700">تم إرسال طلب إنهاء مبكر. سيتم إغلاق الشاشة تلقائياً فور الموافقة.</p>
          </Card>
        </div>
      )}

      {/* Session Info (اللوحة الطبيعية) */}
      {currentSession && currentSession.handover_status !== 'pending' && currentSession.handover_status !== 'approved' && currentSession.handover_status !== 'pending_end' && (
        <Card className="mb-6 gradient-primary text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{currentSession.session_name}</h3>
                <p className="text-white/90 text-sm font-medium mt-1">
                  الحارس: {currentSession.gatekeeper_name}
                </p>
                <p className="text-white/70 text-xs mt-0.5">
                  ينتهي الدوام: {currentSession.expected_end_time ? new Date(currentSession.expected_end_time).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'}) : 'غير محدد'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-4 sm:gap-6 border-t sm:border-t-0 border-white/10 pt-4 sm:pt-0">
              <div className="text-center">
                <div className="text-3xl font-bold">{currentSession.visitor_count}</div>
                <div className="text-sm text-white/80">زائر اليوم</div>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Button variant="secondary" onClick={() => loadVisitors(currentSession.id)} className="!bg-white !text-indigo-600 !py-1.5">
                  <RefreshCw className="w-4 h-4" /> تحديث
                </Button>
                <div className="flex gap-2">
                  <Button onClick={handleRequestHandover} className="!bg-amber-500 hover:!bg-amber-600 !text-white !border-none !py-1.5 shadow-md flex-1 text-xs px-2" title="تبديل طارئ مع حارس آخر">
                    <ArrowRightLeft className="w-3 h-3" /> بديل طارئ
                  </Button>
                  <Button 
                    onClick={handleEndShift} 
                    className="!bg-red-500 hover:!bg-red-600 !text-white !border-none !py-1.5 shadow-md flex-1 text-xs px-2"
                  >
                    <LogOut className="w-3 h-3" /> {(currentSession.expected_end_time && new Date() < new Date(currentSession.expected_end_time)) ? 'طلب إنهاء' : 'إنهاء الوردية'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── أزرار التبديل (التبويبات) ─── */}
      {currentSession && currentSession.handover_status !== 'pending' && currentSession.handover_status !== 'approved' && currentSession.handover_status !== 'pending_end' && (
        <div className="flex gap-2 sm:gap-4 mb-6 border-b border-gray-200 pb-4 overflow-x-auto hide-scrollbar animate-fade-in">
          {(user?.gatekeeper_type === 'both' || !user?.gatekeeper_type || user?.gatekeeper_type === 'visitor_movement') && (
            <button
              onClick={() => setActiveTab('visitors')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all whitespace-nowrap ${activeTab === 'visitors' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
            >
              <Users className="w-5 h-5 inline-block ml-2" />
              زوار البوابة
            </button>
          )}
          {(user?.gatekeeper_type === 'both' || !user?.gatekeeper_type || user?.gatekeeper_type === 'employee_movement') && (
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm sm:text-base transition-all whitespace-nowrap ${activeTab === 'employees' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'}`}
            >
              <ArrowRightLeft className="w-5 h-5 inline-block ml-2" />
              حركة الموظفين
            </button>
          )}
        </div>
      )}

      {/* ─── قسم زوار البوابة ─── */}
      {currentSession && activeTab === 'visitors' && (
        <>
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="بحث بالاسم أو الهاتف أو الشركة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button onClick={() => setShowModal(true)} className="flex-1 sm:flex-none btn-primary justify-center">
                <UserPlus className="w-5 h-5 ml-1" />
                تسجيل زائر
              </Button>
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header">#</th>
                    <th className="table-header">الاسم</th>
                    <th className="table-header">الهاتف</th>
                    <th className="table-header">الشركة</th>
                    <th className="table-header">الغرض</th>
                    <th className="table-header">الموقع/الوجهة</th>
                    <th className="table-header">وقت الدخول</th>
                    <th className="table-header">الحالة</th>
                    <th className="table-header">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">لا توجد سجلات حتى الآن</p>
                        <p className="text-sm text-gray-400 mt-2">قم بإضافة زائر جديد للبدء</p>
                      </td>
                    </tr>
                  ) : (
                    filteredVisitors.map((log, index) => (
                      <tr key={log.id} className="table-row">
                        <td className="table-cell font-medium">{index + 1}</td>
                        <td className="table-cell font-medium">{log.visitor?.name}</td>
                        <td className="table-cell ltr text-right">{log.visitor?.phone}</td>
                        <td className="table-cell">{log.visitor?.company || '-'}</td>
                        <td className="table-cell">{log.visitor?.purpose || '-'}</td>
                        <td className="table-cell">{log.visitor?.location || '-'}</td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {new Date(log.check_in_time).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="table-cell">
                          {log.status === 'checked_in' ? (
                            <span className="badge-success">✓ داخل المبنى</span>
                          ) : (
                            <span className="badge-gray">⊗ خرج</span>
                          )}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(log)}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </button>
                            {log.status === 'checked_in' && (
                              <button
                                onClick={() => handleCheckout(log)}
                                className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                                title="تسجيل خروج"
                              >
                                <LogOut className="w-4 h-4 text-orange-600" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(log)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ─── قسم حركة الموظفين ─── */}
      {currentSession && activeTab === 'employees' && (
        <>
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="بحث باسم الموظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button onClick={() => setShowMovementModal(true)} className="flex-1 sm:flex-none btn-primary justify-center">
                <UserPlus className="w-5 h-5 ml-1" />
                خروج موظف
              </Button>
              <Button onClick={generateMockMovements} variant="outline" className="flex-1 sm:flex-none border-amber-200 text-amber-700 hover:bg-amber-50 justify-center" title="لغرض التجربة فقط">
                <Zap className="w-5 h-5 ml-2 inline-block" />
                توليد بيانات وهمية
              </Button>
              <Button onClick={handleExportMovements} variant="outline" className="flex-1 sm:flex-none border-emerald-200 text-emerald-700 hover:bg-emerald-50 justify-center">
                <Download className="w-5 h-5 ml-2 inline-block" />
                تصدير Excel
              </Button>
            </div>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header text-right p-4">#</th>
                    <th className="table-header text-right p-4">اسم الموظف</th>
                    <th className="table-header text-right p-4">القسم / الصفة</th>
                    <th className="table-header text-right p-4">الوجهة</th>
                    <th className="table-header text-right p-4">تصريح الخروج</th>
                    <th className="table-header text-right p-4">وقت الخروج</th>
                    <th className="table-header text-right p-4">وقت العودة</th>
                    <th className="table-header text-right p-4">الوقت المستغرق</th>
                    <th className="table-header text-right p-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12">
                        <ArrowRightLeft className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">لا توجد حركات خروج للموظفين اليوم</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((log, index) => {
                      const emp = employees.find(e => e.id === log.employee_id);
                      // استخراج التصريح من الملاحظات
                      const isApproved = log.notes?.includes('[تصريح من المشرف:');
                      const isWithoutApproval = log.notes?.includes('[بدون تصريح خروج]');
                      const supervisorMatch = log.notes?.match(/\[تصريح من المشرف: (.*?)\]/);
                      const supervisorName = supervisorMatch ? supervisorMatch[1] : '';
                      const cleanNotes = log.notes ? log.notes.replace(/\تصريح من المشرف: .*?\?/, '').replace(/\بدون تصريح خروج\?/, '') : '';

                      return (
                        <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="p-4 font-medium">{index + 1}</td>
                        <td className="p-4 font-bold text-slate-800">{emp?.full_name || log.employee_name || 'غير معروف'}</td>
                          <td className="p-4 text-slate-600 font-medium">{log.department || emp?.department || '-'}</td>
                          <td className="p-4">
                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                              {log.destination}
                            </span>
                          </td>
                          <td className="p-4">
                            {isApproved ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold border border-emerald-100 w-fit">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {supervisorName}
                              </div>
                            ) : isWithoutApproval ? (
                              <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold border border-red-100 w-fit">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                بدون تصريح
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-slate-600">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {new Date(log.departure_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="p-4">
                            {log.returned_at ? (
                              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                <CheckCircle className="w-4 h-4" />
                                {new Date(log.returned_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            ) : (
                          <Button size="sm" onClick={() => { setArrivalData(log); setActualLocation('عاد لمكان الخروج'); setShowArrivalModal(true); }} variant="outline" className="text-xs py-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                            تسجيل وصول / عودة
                              </Button>
                            )}
                          </td>
                          <td className="p-4 font-bold text-gray-600">
                            {calculateDuration(log.departure_at, log.returned_at)}
                          </td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-[150px] max-w-[250px]">
                          {cleanNotes ? cleanNotes.split(' | ').map((note: string, idx: number) => (
                            <span key={idx} 
                              className={`truncate text-xs px-2.5 py-1 rounded-lg border max-w-full ${
                                note.includes('مخالفة') ? 'bg-red-50 border-red-200 font-bold text-red-700' : 
                                note.includes('تأكيد') ? 'bg-emerald-50 border-emerald-200 font-bold text-emerald-700' : 
                                'bg-slate-50 border-slate-200 text-slate-600 font-medium'
                              }`}
                              title={note}
                            >
                              {note}
                            </span>
                          )) : <span className="text-gray-400">-</span>}
                        </div>
                      </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ─── قسم تصاريح الاستراحة المعتمدة ─── */}
      {currentSession && activeTab === 'breaks' && (
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              تصاريح الاستراحة المعتمدة من المشرفين
            </h2>
            <p className="text-sm text-slate-500 mt-1">تظهر هنا فقط التصاريح التي وافق عليها المشرف وتنتظر خروج الموظف، أو الموظفين الذين هم في الخارج حالياً.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header text-right p-4">الموظف</th>
                  <th className="table-header text-right p-4">المشرف المعتمد</th>
                  <th className="table-header text-right p-4">الوجهة</th>
                  <th className="table-header text-right p-4">المدة المصرحة</th>
                  <th className="table-header text-right p-4">الحالة</th>
                  <th className="table-header text-right p-4">الإجراء (للحارس)</th>
                </tr>
              </thead>
              <tbody>
                {approvedBreaks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">لا توجد تصاريح استراحة نشطة حالياً</td>
                  </tr>
                ) : (
                  approvedBreaks.map((b) => (
                    <tr key={b.id} className="border-b border-gray-50">
                      <td className="p-4 font-bold text-slate-800">{b.employee?.full_name}</td>
                      <td className="p-4 text-sm font-medium text-slate-600">{b.supervisor_name}</td>
                      <td className="p-4 text-slate-600">{b.destination}</td>
                      <td className="p-4 text-slate-600 font-bold">{b.duration_minutes} دقيقة</td>
                      <td className="p-4">
                        {b.status === 'approved' && <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold">ينتظر الخروج</span>}
                        {b.status === 'out' && <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold">في الخارج</span>}
                      </td>
                      <td className="p-4">
                        {b.status === 'approved' && (
                          <Button size="sm" onClick={() => handleBreakAction(b, 'out')} className="!py-1.5 !px-3 text-xs bg-indigo-600 hover:bg-indigo-700">
                            تسجيل خروجه الآن
                          </Button>
                        )}
                        {b.status === 'out' && (
                          <Button size="sm" onClick={() => handleBreakAction(b, 'completed')} className="!py-1.5 !px-3 text-xs bg-emerald-600 hover:bg-emerald-700">
                            عاد (إنهاء التصريح)
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={resetForm}
        title={editingVisitor ? '✏️ تعديل بيانات الزائر' : '➕ تسجيل زائر جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الاسم الكامل *
            </label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل الاسم الكامل"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رقم الهاتف *
            </label>
            <Input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="05XXXXXXXX"
              className="ltr text-right"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الشركة / الجهة
            </label>
            <Input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="اسم الشركة أو الجهة"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الغرض من الزيارة
            </label>
            <Input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="مثال: اجتماع عمل، مقابلة شخصية..."
            />
          </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            الموقع / الوجهة
          </label>
          <Input
            type="text"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="الموقع أو الوجهة داخل المبنى..."
          />
        </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ملاحظات إضافية
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="أي ملاحظات إضافية..."
              className="input-field min-h-[100px] resize-y"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'جاري الحفظ...' : editingVisitor ? '💾 حفظ التعديلات' : '✓ تسجيل الزائر'}
            </Button>
            <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* مودال كشف مسار الوصول */}
      <Modal
        isOpen={showArrivalModal}
        onClose={() => setShowArrivalModal(false)}
        title="📍 تسجيل وصول موظف"
      >
        <form onSubmit={handleConfirmArrival} className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-4">
            <p className="text-sm text-amber-800">
              صرّح الموظف <strong>{arrivalData?.employee_name || 'غير معروف'}</strong> بأنه ذاهب إلى: <br/>
              <span className="text-lg font-black text-amber-600 mt-1 block">🎯 {arrivalData?.destination}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">أين وصل الموظف فعلياً الآن؟ *</label>
            <select
              required
              value={actualLocation}
              onChange={(e) => setActualLocation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 font-bold"
            >
              <option value="عاد لمكان الخروج">عاد لنفس مكان الخروج (رجوع طبيعي)</option>
              <option value="الموارد البشرية">وصل إلى بوابة الموارد البشرية</option>
              <option value="الإنتاج">وصل إلى بوابة الإنتاج</option>
              <option value="الكافتيريا">وصل إلى الكافتيريا</option>
              <option value="العيادة">وصل إلى العيادة</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'جاري التسجيل...' : '✓ تأكيد الوصول'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* مودال تسجيل حركة الموظفين */}
      <Modal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        title="🏃‍♂️ تسجيل خروج موظف"
      >
        <form onSubmit={handleMovementSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اسم الموظف *</label>
            <input
              type="text"
              required
              placeholder="اكتب اسم الموظف..."
              value={movementForm.employee_name || ''}
              onChange={(e) => {
                const val = e.target.value;
                // تصفية الموظفين ليتطابقوا مع الشفت المفتوح حالياً فقط
                const shiftEmployees = employees.filter(emp => !emp.shift || emp.shift === currentSession?.shift_type || emp.shift === 'all');
                const foundEmp = shiftEmployees.find(emp => (emp.full_name || 'بدون اسم').trim() === val.trim());
                
                let newDept = movementForm.department;
                let newCustomDept = movementForm.customDepartment;
                
                // تغيير قسم الموظف في القائمة تلقائياً بمجرد اختيار اسمه لتسهيل عمل الحارس
                if (foundEmp && foundEmp.department) {
                  const validDepts = ['الإنتاج', 'المراهم', 'الشرابات', 'الحبوب', 'ضبط الجودة (QC)', 'توكيد الجودة (QA)', 'البحث والتطوير (R&D)', 'المستودعات', 'الصيانة', 'الموارد البشرية (HR)', 'تقنية المعلومات (IT)', 'الشؤون التنظيمية', 'الإدارة العليا', 'مشرف', 'مدير قسم', 'مدير'];
                  if (validDepts.includes(foundEmp.department.trim())) {
                    newDept = foundEmp.department.trim();
                  } else {
                    newDept = 'مخصص';
                    newCustomDept = foundEmp.department;
                  }
                }

                setMovementForm({ 
                  ...movementForm, 
                  employee_name: val, 
                  employee_id: foundEmp ? foundEmp.id : '',
                  department: newDept,
                  customDepartment: newCustomDept
                });
              }}
              list="gatekeeper-employees-list"
              className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 transition-all ${
                movementForm.employee_name 
                  ? movementForm.employee_id 
                    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-100' 
                    : 'border-red-400 focus:border-red-500 focus:ring-red-100'
                  : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
              }`}
            />
            
            {movementForm.employee_name && (
              <div className="mt-2 space-y-1">
                <p className={`text-xs font-semibold flex items-center gap-1 ${movementForm.employee_id ? 'text-emerald-600' : 'text-red-500'}`}>
                  {movementForm.employee_id ? <CheckCircle size={12}/> : <AlertTriangle size={12}/>}
                  {movementForm.employee_id ? 'تم التعرف على الموظف بنجاح' : 'هذا الاسم غير مسجل في ورديتك!'}
                </p>
                {movementForm.employee_id && approvedBreaks.find(b => b.employee_id === movementForm.employee_id && b.status === 'approved') && (
                  <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    تم التصريح بالخروج من قبل: {approvedBreaks.find(b => b.employee_id === movementForm.employee_id && b.status === 'approved')?.supervisor_name}
                  </div>
                )}
                {movementForm.employee_id && !approvedBreaks.find(b => b.employee_id === movementForm.employee_id && b.status === 'approved') && (
                  <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs font-bold border border-red-200 flex items-center gap-2 mt-2">
                    <AlertTriangle className="w-4 h-4" />
                    تنبيه: هذا الموظف ليس لديه تصريح خروج معتمد!
                  </div>
                )}
              </div>
            )}
          </div>
          <datalist id="gatekeeper-employees-list">
            {employees
              .filter(emp => !emp.shift || emp.shift === currentSession?.shift_type || emp.shift === 'all')
              .map(emp => (
              <option key={emp.id} value={emp.full_name}>{emp.department || 'بدون قسم'}</option>
            ))}
          </datalist>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">القسم / الصفة *</label>
            <select
              required
              value={movementForm.department}
              onChange={(e) => setMovementForm({ ...movementForm, department: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
            >
              <option value="الإنتاج">الإنتاج</option>
              <option value="المراهم">المراهم</option>
              <option value="الشرابات">الشرابات</option>
              <option value="الحبوب">الحبوب</option>
              <option value="ضبط الجودة (QC)">ضبط الجودة (QC)</option>
              <option value="توكيد الجودة (QA)">توكيد الجودة (QA)</option>
              <option value="البحث والتطوير (R&D)">البحث والتطوير (R&D)</option>
              <option value="المستودعات">المستودعات</option>
              <option value="الصيانة">الصيانة</option>
              <option value="الموارد البشرية (HR)">الموارد البشرية (HR)</option>
              <option value="تقنية المعلومات (IT)">تقنية المعلومات (IT)</option>
              <option value="الشؤون التنظيمية">الشؤون التنظيمية</option>
              <option value="الإدارة العليا">الإدارة العليا</option>
              <option value="مشرف">مشرف</option>
              <option value="مدير قسم">مدير قسم</option>
              <option value="مدير">مدير</option>
              <option value="مخصص">مخصص (أخرى)</option>
            </select>
          </div>

          {movementForm.department === 'مخصص' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اكتب القسم / الصفة *</label>
              <Input
                type="text"
                required
                value={movementForm.customDepartment}
                onChange={(e) => setMovementForm({ ...movementForm, customDepartment: e.target.value })}
                placeholder="اكتب القسم..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">إلى أين؟ *</label>
            <select
              required
              value={movementForm.destination}
              onChange={(e) => setMovementForm({ ...movementForm, destination: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
            >
              <option value="الموارد البشرية">الموارد البشرية</option>
              <option value="الكافتيريا">الكافتيريا</option>
              <option value="العيادة">العيادة</option>
              <option value="مخصص">مخصص (أخرى)</option>
            </select>
          </div>

          {movementForm.destination === 'مخصص' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">حدد الوجهة *</label>
              <Input
                type="text"
                required
                value={movementForm.customDestination}
                onChange={(e) => setMovementForm({ ...movementForm, customDestination: e.target.value })}
                placeholder="اكتب الوجهة..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات (اختياري)</label>
            <textarea
              value={movementForm.notes}
              onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
              placeholder="أي ملاحظات إضافية..."
              className="w-full min-h-[100px] resize-y bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'جاري التسجيل...' : '✓ تسجيل الخروج'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowMovementModal(false)} className="flex-1">
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}