import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  BookOpen, CheckCircle, Clock, Search, X, FileText,
  Eye, Play, Pause,
  CheckSquare, Circle,
  Download, Timer, Lightbulb,
  AlertTriangle, Loader2,
  Check, Tag,
} from 'lucide-react';
import Card, { CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useUIStore, useAuthStore } from '../../store';
import type { SOP, SOPReading, SOPViewMode } from '../../types/sops';
import { SOP_DEPARTMENTS, SOP_CATEGORIES } from '../../types/sops';

// ── Translations ──
const translations = {
  ar: {
    pageTitle: 'إجراءات التشغيل القياسية (SOPs)',
    pageDesc: 'اطلع على إجراءات التشغيل القياسية الخاصة بقسمك وتابع قراءتك',
    approvalTitle: 'إعلان اعتماد SOP',
    approvalMessage: 'عزيزي الموظف،',
    approvalText1: 'من خلال الموافقة على إجراء التشغيل القياسي هذا، تؤكد أنك قد راجعت وفهمت المحتوى بالكامل.',
    approvalText2: 'بعد الموافقة، سيتم إشعار الإدارة. قد يطلب منك حضور جلسة تقييم أو تحقق من المعرفة.',
    approvalCheckbox: 'لقد قرأت وفهمت وأوافقت على الإعلان أعلاه بخصوص إجراء التشغيل القياسي هذا',
    approvalButton: 'اعتماد وإتمام القراءة',
    cancelButton: 'إلغاء',
    completed: 'تم إتمام القراءة بنجاح!',
    adminNotified: 'تم إشعار الإدارة باعتمادك',
    allDepartments: 'جميع الأقسام',
    allCategories: 'جميع التصنيفات',
    mySops: 'SOPs الخاصة بي',
    completedSops: 'المكتملة',
    inProgress: 'قيد القراءة',
    notStarted: 'لم تبدأ',
    readCount: 'عدد القراءات',
    timeSpent: 'الوقت المستغرق',
    lastRead: 'آخر قراءة',
    startReading: 'ابدأ القراءة',
    continueReading: 'استمر في القراءة',
    markComplete: 'تحديد كمكتمل',
    viewPdf: 'عرض PDF',
    noSops: 'لا توجد إجراءات SOP متاحة لقسمك',
    searchPlaceholder: 'ابحث عن SOP...',
    department: 'القسم',
    category: 'التصنيف',
    version: 'الإصدار',
    effectiveDate: 'تاريخ التفعيل',
    reviewDate: 'تاريخ المراجعة',
    mandatory: 'إلزامي',
    optional: 'اختياري',
    minutes: 'دقيقة',
    seconds: 'ثانية',
  },
  en: {
    pageTitle: 'Standard Operating Procedures (SOPs)',
    pageDesc: 'Review SOPs for your department and track your reading progress',
    approvalTitle: 'SOP Approval Declaration',
    approvalMessage: 'Dear Employee,',
    approvalText1: 'By approving this SOP, you confirm that you have reviewed and fully understood the content.',
    approvalText2: 'After approval, management will be notified. You may be asked to attend an assessment or knowledge verification session.',
    approvalCheckbox: 'I have read, understood, and agree to the above declaration regarding this SOP',
    approvalButton: 'Approve & Complete Reading',
    cancelButton: 'Cancel',
    completed: 'Reading completed successfully!',
    adminNotified: 'Management has been notified of your approval',
    allDepartments: 'All Departments',
    allCategories: 'All Categories',
    mySops: 'My SOPs',
    completedSops: 'Completed',
    inProgress: 'In Progress',
    notStarted: 'Not Started',
    readCount: 'Read Count',
    timeSpent: 'Time Spent',
    lastRead: 'Last Read',
    startReading: 'Start Reading',
    continueReading: 'Continue Reading',
    markComplete: 'Mark as Complete',
    viewPdf: 'View PDF',
    noSops: 'No SOPs available for your department',
    searchPlaceholder: 'Search SOPs...',
    department: 'Department',
    category: 'Category',
    version: 'Version',
    effectiveDate: 'Effective Date',
    reviewDate: 'Review Date',
    mandatory: 'Mandatory',
    optional: 'Optional',
    minutes: 'min',
    seconds: 'sec',
  }
};

// ── Timer Component ──
function ReadingTimer({ seconds }: { seconds: number }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm font-bold text-slate-600">
      <Timer size={14} />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

// ── Main Component ──
export default function SOPsPage() {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const lang = 'ar';

  const t = translations[lang];

  const [viewMode, setViewMode] = useState<SOPViewMode>('catalog');
  const [selectedSop, setSelectedSop] = useState<SOP | null>(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // SOPs data from Supabase
  const [sopsData, setSopsData] = useState<SOP[]>([]);
  const [sopLoading, setSopLoading] = useState(true);
  const [sopError, setSopError] = useState<string | null>(null);

  // Reading tracking state
  const [readings, setReadings] = useState<Record<string, SOPReading>>({});
  const [currentReading, setCurrentReading] = useState<SOPReading | null>(null);
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [approvalChecked, setApprovalChecked] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get user's department
  const userDept = user?.manufacturingDept || user?.department || '';

  // Fetch SOPs from Supabase
  useEffect(() => {
    const fetchSOPs = async () => {
      try {
        setSopLoading(true);
        setSopError(null);
        const { data, error } = await supabase
          .from('sops')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setSopsData(data || []);
      } catch (err: any) {
        console.error('Error fetching SOPs:', err);
        setSopError(err.message || 'فشل تحميل الـ SOPs');
        // Fall back to empty array
        setSopsData([]);
      } finally {
        setSopLoading(false);
      }
    };

    fetchSOPs();
  }, []);

  // Filter SOPs based on department and search
  const availableSops = useMemo(() => {
    return sopsData.filter(sop => {
      // Filter by department (show department-specific and general)
      if (sop.department !== userDept && sop.department !== 'general') return false;
      
      // Search filter
      if (search) {
        const term = search.toLowerCase();
        const matchesSearch = 
          sop.title.toLowerCase().includes(term) ||
          sop.code.toLowerCase().includes(term) ||
          sop.description.toLowerCase().includes(term) ||
          (sop.tags || []).some(t => t.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filterCat !== 'all' && sop.category !== filterCat) return false;

      // Status filter
      if (filterStatus !== 'all') {
        const reading = readings[sop.id];
        if (filterStatus === 'completed' && (!reading || !reading.approved)) return false;
        if (filterStatus === 'in_progress' && (!reading || reading.completed)) return false;
        if (filterStatus === 'not_started' && reading) return false;
      }

      return sop.status === 'active';
    });
  }, [sopsData, userDept, search, filterCat, filterStatus, readings]);

  // Timer management
  useEffect(() => {
    if (isReading && currentReading) {
      timerRef.current = setInterval(() => {
        setReadingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isReading, currentReading]);

  const handleStartReading = useCallback((sop: SOP) => {
    setSelectedSop(sop);
    setViewMode('reading');
    setShowApproval(false);
    setApprovalChecked(false);
    setShowSuccess(false);

    const existingReading = readings[sop.id];
    if (existingReading) {
      setCurrentReading(existingReading);
      setReadingSeconds(existingReading.timeSpent);
    } else {
      const newReading: SOPReading = {
        id: `reading-${Date.now()}`,
        sopId: sop.id,
        employeeId: user?.id || 'unknown',
        startedAt: new Date().toISOString(),
        lastReadAt: new Date().toISOString(),
        readCount: 0,
        timeSpent: 0,
        completed: false,
        approved: false,
        approvalStatus: 'pending',
      };
      setCurrentReading(newReading);
      setReadingSeconds(0);
    }
    setIsReading(true);
  }, [readings, user]);

  const handlePauseReading = useCallback(() => {
    setIsReading(false);
    if (currentReading) {
      const updated = {
        ...currentReading,
        timeSpent: readingSeconds,
        readCount: currentReading.readCount + 1,
        lastReadAt: new Date().toISOString(),
      };
      setCurrentReading(updated);
      setReadings(prev => ({ ...prev, [updated.sopId]: updated }));
    }
  }, [currentReading, readingSeconds]);

  const handleResumeReading = useCallback(() => {
    setIsReading(true);
  }, []);

  const handleOpenApproval = useCallback(() => {
    setIsReading(false);
    if (currentReading) {
      const updated = {
        ...currentReading,
        timeSpent: readingSeconds,
        readCount: currentReading.readCount + 1,
        lastReadAt: new Date().toISOString(),
      };
      setCurrentReading(updated);
      setReadings(prev => ({ ...prev, [updated.sopId]: updated }));
    }
    setShowApproval(true);
  }, [currentReading, readingSeconds]);

  const handleApprove = useCallback(() => {
    if (!currentReading || !selectedSop) return;

    const updated: SOPReading = {
      ...currentReading,
      completed: true,
      approved: true,
      approvedAt: new Date().toISOString(),
      approvalStatus: 'approved',
      timeSpent: readingSeconds,
    };
    setCurrentReading(updated);
    setReadings(prev => ({ ...prev, [updated.sopId]: updated }));
    setShowApproval(false);
    setShowSuccess(true);
    setIsReading(false);
    
    if (addToast) {
      addToast(`✅ تم اعتماد "${selectedSop.title}" بنجاح!`, 'success');
    }

    setTimeout(() => {
      setShowSuccess(false);
      setViewMode('catalog');
      setSelectedSop(null);
      setCurrentReading(null);
    }, 3000);
  }, [currentReading, selectedSop, readingSeconds, addToast]);

  const handleCloseReading = useCallback(() => {
    setIsReading(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (currentReading) {
      const updated = {
        ...currentReading,
        timeSpent: readingSeconds,
        lastReadAt: new Date().toISOString(),
      };
      setReadings(prev => ({ ...prev, [updated.sopId]: updated }));
    }
    setViewMode('catalog');
    setSelectedSop(null);
    setCurrentReading(null);
    setReadingSeconds(0);
    setShowApproval(false);
    setApprovalChecked(false);
    setShowSuccess(false);
  }, [currentReading, readingSeconds]);

  const getReadingForSop = (sopId: string): SOPReading | undefined => readings[sopId];

  const getStatusBadge = (reading?: SOPReading) => {
    if (!reading) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
          <Circle size={10} />لم تبدأ
        </span>
      );
    }
    if (reading.approved) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
          <CheckCircle size={10} />مكتمل
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
        <Clock size={10} />قيد القراءة
      </span>
    );
  };

  // ── Statistics ──
  const stats = useMemo(() => {
    const total = availableSops.length;
    const completed = availableSops.filter(s => readings[s.id]?.approved).length;
    const inProgress = availableSops.filter(s => readings[s.id] && !readings[s.id]?.approved).length;
    const notStarted = total - completed - inProgress;
    return { total, completed, inProgress, notStarted };
  }, [availableSops, readings]);

  // ── Render Reading Mode ──
  if (viewMode === 'reading' && selectedSop) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col">
        {/* Top Bar */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCloseReading}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
            <div className="h-5 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-indigo-400" />
              <span className="text-white font-bold text-sm truncate max-w-[200px] sm:max-w-[400px]">
                {selectedSop.title}
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                {selectedSop.code}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Timer */}
            <div className="bg-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isReading ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <ReadingTimer seconds={readingSeconds} />
            </div>
            {/* Controls */}
            {!showApproval && !showSuccess && (
              <div className="flex items-center gap-1">
                {isReading ? (
                  <button
                    onClick={handlePauseReading}
                    className="p-2 rounded-lg bg-slate-800 text-amber-400 hover:bg-slate-700 transition-all"
                    title="إيقاف مؤقت"
                  >
                    <Pause size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleResumeReading}
                    className="p-2 rounded-lg bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-all"
                    title="استئناف القراءة"
                  >
                    <Play size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* PDF Viewer (simulated) */}
          <div className="flex-1 overflow-auto bg-[#1a1a2e] flex items-start justify-center p-4 md:p-8">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* PDF Header */}
              <div className="bg-gradient-to-l from-indigo-50 to-white p-6 border-b border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedSop.title}</h2>
                    {selectedSop.titleEn && (
                      <p className="text-sm text-slate-500 mt-1" dir="ltr">{selectedSop.titleEn}</p>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
                      {selectedSop.code}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">الإصدار: {selectedSop.version}</p>
                  </div>
                </div>
              </div>

              {/* PDF Content (simulated) */}
              <div className="p-8 space-y-6" dir="rtl">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800 text-sm">غرض الإجراء</p>
                    <p className="text-amber-700 text-sm mt-1">{selectedSop.description}</p>
                    {selectedSop.descriptionEn && (
                      <p className="text-amber-600 text-xs mt-1" dir="ltr">{selectedSop.descriptionEn}</p>
                    )}
                  </div>
                </div>

                {/* Document metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">تاريخ التفعيل</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{selectedSop.effectiveDate}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">تاريخ المراجعة</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{selectedSop.reviewDate}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">المدة التقديرية</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">{selectedSop.duration} دقيقة</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">القسم</p>
                    <p className="text-sm font-bold text-slate-700 mt-1">
                      {SOP_DEPARTMENTS.find(d => d.key === selectedSop.department)?.nameAr || selectedSop.department}
                    </p>
                  </div>
                </div>

                {/* Placeholder for actual PDF content */}
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <FileText size={48} className="text-slate-300" />
                  <div className="text-center">
                    <p className="font-bold text-slate-500">نافذة عرض PDF</p>
                    <p className="text-xs text-slate-400 mt-1">هنا سيتم عرض ملف PDF الفعلي للـ SOP</p>
                  </div>
                  <button className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex items-center gap-2">
                    <Download size={14} /> تحميل PDF
                  </button>
                </div>

                {/* Key points section */}
                <div className="bg-gradient-to-r from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100">
                  <h3 className="font-bold text-indigo-800 flex items-center gap-2 mb-3">
                    <Lightbulb size={16} className="text-amber-500" />
                    النقاط الرئيسية
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-slate-700">
                      <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      اتباع الإجراءات بدقة وفق التسلسل المحدد
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-700">
                      <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      توثيق أي انحرافات فور حدوثها
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-700">
                      <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      التأكد من ارتداء معدات السلامة المناسبة
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-700">
                      <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                      تنظيف المنطقة قبل وبعد الإجراء
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Reading Progress */}
          {currentReading && !showSuccess && (
            <div className="w-72 shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto p-4 hidden lg:block">
              <h3 className="text-white font-bold text-sm mb-4">تقدم القراءة</h3>
              <div className="space-y-4">
                {/* Progress info */}
                <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">الحالة</span>
                    {currentReading.approved ? (
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle size={12} /> مكتمل
                      </span>
                    ) : (
                      <span className="text-amber-400 text-xs font-bold flex items-center gap-1">
                        <Clock size={12} /> قيد القراءة
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">وقت القراءة</span>
                    <ReadingTimer seconds={readingSeconds} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs">عدد القراءات</span>
                    <span className="text-white text-sm font-bold">{currentReading.readCount}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  {!currentReading.approved && (
                    <>
                      {isReading ? (
                        <button
                          onClick={handlePauseReading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all"
                        >
                          <Pause size={16} /> إيقاف مؤقت
                        </button>
                      ) : (
                        <button
                          onClick={handleResumeReading}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-all"
                        >
                          <Play size={16} /> استئناف القراءة
                        </button>
                      )}
                      <button
                        onClick={handleOpenApproval}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm transition-all"
                      >
                        <CheckSquare size={16} /> اعتماد وإتمام
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom controls (mobile) */}
        {currentReading && !showSuccess && (
          <div className="shrink-0 bg-slate-900 border-t border-slate-800 p-3 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isReading ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
              <ReadingTimer seconds={readingSeconds} />
            </div>
            <div className="flex items-center gap-2">
              {!currentReading.approved && (
                <>
                  {isReading ? (
                    <button onClick={handlePauseReading} className="px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold"><Pause size={14} /></button>
                  ) : (
                    <button onClick={handleResumeReading} className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold"><Play size={14} /></button>
                  )}
                  <button onClick={handleOpenApproval} className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold">اعتماد</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Approval Modal */}
        {showApproval && (
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-[fadeIn_0.3s_ease]">
              <div className="bg-gradient-to-l from-indigo-500 to-indigo-700 p-6 text-white">
                <h3 className="text-lg font-bold">{t.approvalTitle}</h3>
                <p className="text-indigo-100 text-sm mt-1">{selectedSop.code} - {selectedSop.title}</p>
              </div>
              <div className="p-6 space-y-4">
                <p className="font-bold text-slate-700">{t.approvalMessage}</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 space-y-2">
                  <p>{t.approvalText1}</p>
                  <p>{t.approvalText2}</p>
                </div>
                {/* Reading stats summary */}
                <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-700">{Math.floor(readingSeconds / 60)}</p>
                    <p className="text-[10px] text-slate-400 font-bold">دقائق</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-700">{currentReading?.readCount || 0}</p>
                    <p className="text-[10px] text-slate-400 font-bold">قراءات</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-700">{selectedSop.duration}</p>
                    <p className="text-[10px] text-slate-400 font-bold">مقدرة</p>
                  </div>
                </div>
                {/* Checkbox */}
                <label className="flex items-start gap-3 p-4 border-2 border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-50 transition-all">
                  <input
                    type="checkbox"
                    checked={approvalChecked}
                    onChange={e => setApprovalChecked(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded-lg border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">{t.approvalCheckbox}</span>
                </label>
                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowApproval(false); handleResumeReading(); }}
                    className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                  >
                    {t.cancelButton}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={!approvalChecked}
                    className={`
                      flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all
                      ${approvalChecked
                        ? 'bg-gradient-to-l from-indigo-600 to-indigo-500 text-white shadow-lg hover:-translate-y-0.5'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                    `}
                  >
                    {t.approvalButton}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccess && (
          <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-[fadeIn_0.3s_ease] text-center p-8">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{t.completed}</h3>
              <p className="text-slate-500 text-sm mb-6">{t.adminNotified}</p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 mb-6">
                <p className="font-bold">تم تسجيل قراءتك:</p>
                <p className="mt-1">الوقت: {Math.floor(readingSeconds / 60)} دقيقة {readingSeconds % 60} ثانية</p>
                <p>عدد القراءات: {currentReading?.readCount || 1}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render Catalog View ──
  return (
    <div className="space-y-6 pb-20 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-indigo-600" /> {t.pageTitle}
          </h2>
          <p className="text-slate-500 mt-1">{t.pageDesc}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-5 text-white">
          <p className="text-3xl font-black">{stats.total}</p>
          <p className="text-indigo-100 text-xs font-bold mt-1">إجمالي SOPs</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-5 text-white">
          <p className="text-3xl font-black">{stats.completed}</p>
          <p className="text-emerald-100 text-xs font-bold mt-1">مكتملة</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-5 text-white">
          <p className="text-3xl font-black">{stats.inProgress}</p>
          <p className="text-amber-100 text-xs font-bold mt-1">قيد القراءة</p>
        </div>
        <div className="bg-gradient-to-br from-slate-500 to-slate-700 rounded-2xl p-5 text-white">
          <p className="text-3xl font-black">{stats.notStarted}</p>
          <p className="text-slate-100 text-xs font-bold mt-1">لم تبدأ</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pr-9 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>
          {/* Department filter */}
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
          >
            <option value="all">{t.allDepartments}</option>
            {SOP_DEPARTMENTS.map(d => (
              <option key={d.key} value={d.key}>{d.nameAr}</option>
            ))}
          </select>
          {/* Category filter */}
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
          >
            <option value="all">{t.allCategories}</option>
            {SOP_CATEGORIES.map(c => (
              <option key={c.id} value={c.nameAr}>{c.nameAr}</option>
            ))}
          </select>
          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
          >
            <option value="all">الكل</option>
            <option value="not_started">لم تبدأ</option>
            <option value="in_progress">قيد القراءة</option>
            <option value="completed">مكتملة</option>
          </select>
        </div>
      </div>

      {/* SOPs Grid */}
      {sopLoading ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center">
          <Loader2 size={48} className="text-slate-300 mx-auto mb-4 animate-spin" />
          <p className="text-slate-400 text-sm">جارٍ تحميل إجراءات SOP...</p>
        </div>
      ) : sopError ? (
        <div className="bg-white border-2 border-dashed border-amber-200 rounded-3xl p-12 text-center">
          <AlertTriangle size={48} className="text-amber-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">تعذّر تحميل إجراءات SOP</h3>
          <p className="text-slate-400 text-sm">{sopError}</p>
        </div>
      ) : availableSops.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <FileText size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600 mb-2">{t.noSops}</h3>
          <p className="text-slate-400 text-sm">لا توجد إجراءات SOP متاحة لقسمك حالياً</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableSops.map(sop => {
            const reading = getReadingForSop(sop.id);
            return (
              <div
                key={sop.id}
                className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden hover:border-indigo-200 hover:shadow-lg transition-all duration-300 group"
              >
                {/* Card Header */}
                <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-l from-indigo-50/50 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                      {sop.code}
                    </span>
                    <div className="flex items-center gap-2">
                      {sop.isMandatory && (
                        <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                          {t.mandatory}
                        </span>
                      )}
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        v{sop.version}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm leading-tight">{sop.title}</h3>
                  {sop.titleEn && (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate" dir="ltr">{sop.titleEn}</p>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{sop.description}</p>

                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Tag size={10} />
                      {SOP_DEPARTMENTS.find(d => d.key === sop.department)?.nameAr || sop.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {sop.duration} {t.minutes}
                    </span>
                  </div>

                  {/* Status & reading info */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    {getStatusBadge(reading)}
                    {reading && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Eye size={10} />
                        {reading.readCount} {t.readCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                  {reading?.approved ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs">
                      <CheckCircle size={14} /> تم الاعتماد ✅
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartReading(sop)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-l from-indigo-600 to-indigo-500 text-white rounded-xl text-xs font-bold hover:from-indigo-700 hover:to-indigo-600 transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                    >
                      <BookOpen size={14} />
                      {reading ? t.continueReading : t.startReading}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}