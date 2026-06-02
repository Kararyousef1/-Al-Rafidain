import { useState, useEffect } from 'react';
import { 
  Shield, Globe, Key, CreditCard, ScanFace, Lock, 
  Scale, FlaskConical, Droplet, Pill, Wrench, 
  CheckSquare, Package, ClipboardCheck, ArrowRight, 
  ArrowLeft, User, LogOut, FileSignature, CheckCircle2,
  AlertTriangle, Clock, Maximize, Minimize, AlertOctagon, Delete, ShieldCheck, FileCheck,
  ScanLine, Wifi, XCircle
} from 'lucide-react';

// نصوص اللغات للواجهة
const translations = {
  ar: {
    welcome: 'مرحباً بكم في البوابة الذكية للتصنيع الدوائي GMP',
    selectLang: 'الرجاء اختيار اللغة:',
    loginTitle: 'تسجيل الدخول الآمن',
    empId: 'الرقم الوظيفي',
    password: 'كلمة المرور',
    loginBtn: 'دخول',
    rfidTab: 'بطاقة RFID',
    passTab: 'كلمة المرور',
    bioTab: 'البصمة البيومترية',
    rfidInstruction: 'الرجاء تمرير بطاقة العمل على القارئ...',
    bioInstruction: 'سيتم تفعيل بصمة الإصبع والوجه قريباً...',
    footer: 'نظام محمي ومشفر بالكامل - مطابق لمعايير GMP',
    departmentsTitle: 'بوابة الأقسام التشغيلية',
    selectDept: 'الرجاء اختيار القسم:',
    processTitle: 'العمليات التشغيلية',
    selectProcess: 'اختر العملية الحالية:',
    back: 'رجوع',
    logout: 'تسجيل خروج',
    shift: 'الوردية',
    // GMP Form
    gmpFormTitle: 'سجل التشغيل الميداني (Batch Record)',
    ppeReady: 'معدات الوقاية (PPE) مطابقة',
    lineClearance: 'إخلاء الطرف (Line Clearance) مكتمل',
    equipClean: 'المعدة تحمل بطاقة "نظيف" (Clean Label)',
    equipCalibrated: 'المعدة معايرة (Calibrated) وصالحة',
    equipId: 'رمز المعدة (Equipment ID)',
    productCode: 'رمز المادة/المنتج (Item Code)',
    batchNumber: 'رقم التشغيلة (Batch No)',
    quantity: 'الكمية / الوزن',
    notes: 'ملاحظات (إن وجدت)',
    // Dual Signatures
    operatorSignature: 'توقيع المشغل (Operator PIN)',
    qaSignature: 'توقيع الجودة / المشرف (QA PIN)',
    signSubmit: 'توقيع واعتماد',
    yes: 'نعم',
    no: 'لا',
    clear: 'مسح',
    makerCheckerTitle: 'الاعتماد المزدوج (Maker-Checker 21 CFR Part 11)',
    reportDeviation: 'تبليغ عن انحراف (Deviation)',
    // Maintenance
    maintRequestForm: 'نموذج طلب صيانة طارئ',
    maintDescLabel: 'وصف العطل والمشكلة بدقة',
    maintSendRequest: 'إرسال طلب الصيانة العاجل',
    maintCalling: 'جاري الاتصال بقسم الصيانة... بانتظار الموافقة',
    maintOnTheWay: 'تمت الموافقة، المهندس في طريقه إليك',
    maintTechName: 'المهندس المكلّف:',
    maintConfirmArrival: 'تأكيد وصول المهندس للموقع',
    maintInProgress: 'جاري العمل على الإصلاح',
    maintDowntime: 'وقت توقف الإنتاج (Downtime):',
    maintTechPin: 'توقيع المهندس (PIN)',
    maintFinish: 'إنهاء العمل واعتماد الصيانة',
    maintCompleted: 'تم الإصلاح وعودة الخط للعمل',
    maintTotalDowntime: 'إجمالي وقت التوقف:',
    // Advanced IoT & Quality
    scanBarcode: 'مسح الباركود',
    readScale: 'قراءة من الميزان (IoT)',
    deviationType: 'نوع الانحراف',
    deviationDesc: 'وصف تفصيلي للحدث',
    severity: 'مستوى الخطورة',
    critical: 'حرج (Critical)',
    major: 'رئيسي (Major)',
    minor: 'طفيف (Minor)',
    submitDeviation: 'إرسال تقرير الطوارئ',
    cancel: 'إلغاء',
    // Departments
    weighing: 'قسم الوزن',
    ointments: 'المراهم والكريمات',
    syrups: 'الأشربة',
    tablets: 'الأقراص',
    maintenance: 'الصيانة',
    qc: 'مراقبة الجودة (QC)',
    qa: 'ضمان الجودة (QA)',
    warehouse: 'المستودعات',
    maintRequest: 'تقديم طلب صيانة',
  },
  en: {
    welcome: 'Welcome to Smart GMP Manufacturing Portal',
    selectLang: 'Please select your language:',
    loginTitle: 'Secure Authentication',
    empId: 'Employee ID',
    password: 'Password',
    loginBtn: 'Login',
    rfidTab: 'RFID Card',
    passTab: 'Password',
    bioTab: 'Biometrics',
    rfidInstruction: 'Please swipe your employee card on the reader...',
    bioInstruction: 'Fingerprint & Face Recognition coming soon...',
    footer: 'Fully Encrypted & Secured System - GMP Compliant',
    departmentsTitle: 'Operational Departments',
    selectDept: 'Please select a department:',
    processTitle: 'Operational Processes',
    selectProcess: 'Select current process:',
    back: 'Back',
    logout: 'Logout',
    shift: 'Shift',
    // GMP Form
    gmpFormTitle: 'Electronic Batch Record (eBR)',
    ppeReady: 'PPE Verified',
    lineClearance: 'Line Clearance Completed',
    equipClean: 'Equipment has "Clean" Label',
    equipCalibrated: 'Equipment Calibrated & Valid',
    equipId: 'Equipment ID',
    productCode: 'Item / Product Code',
    batchNumber: 'Batch Number',
    quantity: 'Quantity / Weight',
    notes: 'Notes (Optional)',
    // Dual Signatures
    operatorSignature: 'Operator Signature (PIN)',
    qaSignature: 'QA / Supervisor Signature (PIN)',
    signSubmit: 'Sign & Submit',
    yes: 'Yes',
    no: 'No',
    clear: 'Clear',
    makerCheckerTitle: 'Dual Verification (Maker-Checker 21 CFR Part 11)',
    reportDeviation: 'Report Deviation',
    // Maintenance
    maintRequestForm: 'Emergency Maintenance Request Form',
    maintDescLabel: 'Accurate description of the failure',
    maintSendRequest: 'Send Emergency Request',
    maintCalling: 'Contacting maintenance... waiting for approval',
    maintOnTheWay: 'Approved. Engineer is on the way',
    maintTechName: 'Assigned Engineer:',
    maintConfirmArrival: 'Confirm Engineer Arrival',
    maintInProgress: 'Repair in progress',
    maintDowntime: 'Production Downtime:',
    maintTechPin: 'Engineer Signature (PIN)',
    maintFinish: 'Finish and Approve',
    maintCompleted: 'Repaired & Line Restored',
    maintTotalDowntime: 'Total Downtime:',
    // Advanced IoT & Quality
    scanBarcode: 'Scan Barcode',
    readScale: 'Read from Scale (IoT)',
    deviationType: 'Deviation Type',
    deviationDesc: 'Detailed Description',
    severity: 'Severity Level',
    critical: 'Critical',
    major: 'Major',
    minor: 'Minor',
    submitDeviation: 'Submit Emergency Report',
    cancel: 'Cancel',
    // Departments
    weighing: 'Weighing Dept',
    ointments: 'Ointments & Creams',
    syrups: 'Syrups Dept',
    tablets: 'Tablets Dept',
    maintenance: 'Maintenance',
    qc: 'Quality Control (QC)',
    qa: 'Quality Assurance (QA)',
    warehouse: 'Warehouse',
    maintRequest: 'Submit Maintenance Request',
  }
};

const departmentsList = [
  { id: 'weighing', icon: Scale, key: 'weighing', color: 'from-blue-500 to-cyan-600' },
  { id: 'ointments', icon: FlaskConical, key: 'ointments', color: 'from-pink-500 to-rose-600' },
  { id: 'syrups', icon: Droplet, key: 'syrups', color: 'from-amber-500 to-orange-600' },
  { id: 'tablets', icon: Pill, key: 'tablets', color: 'from-indigo-500 to-violet-600' },
  { id: 'maintenance', icon: Wrench, key: 'maintenance', color: 'from-slate-600 to-slate-800' },
  { id: 'qc', icon: CheckSquare, key: 'qc', color: 'from-emerald-500 to-teal-600' },
  { id: 'qa', icon: ClipboardCheck, key: 'qa', color: 'from-sky-500 to-blue-600' },
  { id: 'warehouse', icon: Package, key: 'warehouse', color: 'from-stone-500 to-stone-700' },
];

const processList: Record<string, { id: string, labelAr: string, labelEn: string }[]> = {
  tablets: [
    { id: 'weighing', labelAr: 'الوزن', labelEn: 'Weighing' },
    { id: 'mixing', labelAr: 'الخلط', labelEn: 'Mixing' },
    { id: 'compression', labelAr: 'الكبس', labelEn: 'Compression' },
    { id: 'coating', labelAr: 'التلبيس', labelEn: 'Coating' },
    { id: 'packaging', labelAr: 'التعبئة والتغليف', labelEn: 'Packaging' },
  ],
  syrups: [
    { id: 'preparation', labelAr: 'التحضير', labelEn: 'Preparation' },
    { id: 'filling', labelAr: 'التعبئة', labelEn: 'Filling' },
    { id: 'packaging', labelAr: 'التغليف', labelEn: 'Packaging' },
  ],
  maintenance: [
    { id: 'request', labelAr: 'طلب صيانة طارئ', labelEn: 'Emergency Request' },
    { id: 'preventive', labelAr: 'صيانة وقائية', labelEn: 'Preventive Maint.' },
  ]
};

export default function GMPAuthGateway() {
  const [step, setStep] = useState(1); // 1: Lang, 2: Login, 3: Depts, 4: Processes, 5: Form
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [authMethod, setAuthMethod] = useState<'password' | 'rfid' | 'bio'>('password');
  
  // User Session State
  const [employee, setEmployee] = useState<{name: string, id: string, shift: string} | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);

  // Advanced Factory UI State
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Form State
  const [formState, setFormState] = useState({ ppeReady: true, lineClearance: true, equipClean: true, equipCalibrated: true, equipId: '', productCode: '', batch: '', qty: '', notes: '', operatorPin: '', qaPin: '' });
  const [activePinField, setActivePinField] = useState<'operator' | 'qa'>('operator');

  // Maintenance State
  const [maintStatus, setMaintStatus] = useState<'idle' | 'calling' | 'on_the_way' | 'in_progress' | 'completed'>('idle');
  const [maintTech, setMaintTech] = useState<string | null>(null);
  const [maintTimers, setMaintTimers] = useState({ requestedAt: 0, arrivedAt: 0, completedAt: 0 });
  const [maintForm, setMaintForm] = useState({ desc: '', techPin: '' });

  // Deviation Modal State
  const [showDeviation, setShowDeviation] = useState(false);
  const [deviationForm, setDeviationForm] = useState({ type: '', desc: '', severity: 'minor' });

  const t = translations[lang];
  const isRTL = lang === 'ar';

  // Live Clock Effect
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-Logout (Session Timeout) - 21 CFR Part 11 Requirement
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      // Only auto-logout if user is actually logged in (step > 2)
      if (step > 2) {
        timeout = setTimeout(() => {
          alert(isRTL ? 'انتهت الجلسة بسبب عدم النشاط (متطلبات GMP)' : 'Session expired due to inactivity (GMP Requirement)');
          handleLogout();
        }, 3 * 60 * 1000); // 3 minutes for testing (usually 10-15 mins in prod)
      }
    };
    
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('keypress', resetTimer);
    resetTimer(); // init
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('keypress', resetTimer);
    };
  }, [step, isRTL]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(e => console.log(e));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleLanguageSelect = (selectedLang: 'ar' | 'en') => {
    setLang(selectedLang);
    setStep(2);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock Login - In production, this validates against the DB and logs an Audit Trail.
    setEmployee({
      name: lang === 'ar' ? 'أحمد محمد' : 'Ahmed Mohammed',
      id: '10452',
      shift: 'A'
    });
    setStep(3);
  };

  const handleLogout = () => {
    setEmployee(null);
    setSelectedDept(null);
    setSelectedProcess(null);
    setStep(1);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.operatorPin.length < 4 || formState.qaPin.length < 4) {
      alert(isRTL ? 'الرجاء إكمال كلا التوقيعين (المشغل والجودة)' : 'Please complete both signatures (Operator & QA)');
      return;
    }
    alert(`GMP Record Submitted Successfully! \nBatch: ${formState.batch}`);
    // Reset and go back to process selection
    setFormState({ ppeReady: true, lineClearance: true, equipClean: true, equipCalibrated: true, equipId: '', productCode: '', batch: '', qty: '', notes: '', operatorPin: '', qaPin: '' });
    setActivePinField('operator');
    setStep(4);
  };

  const handleNumpad = (num: string) => {
    if (activePinField === 'operator' && formState.operatorPin.length < 6) setFormState({ ...formState, operatorPin: formState.operatorPin + num });
    if (activePinField === 'qa' && formState.qaPin.length < 6) setFormState({ ...formState, qaPin: formState.qaPin + num });
  };
  const handleNumpadBackspace = () => {
    if (activePinField === 'operator') setFormState({ ...formState, operatorPin: formState.operatorPin.slice(0, -1) });
    if (activePinField === 'qa') setFormState({ ...formState, qaPin: formState.qaPin.slice(0, -1) });
  };

  // Maintenance Handlers
  const formatDuration = (ms: number) => {
    const totalSecs = Math.floor(Math.max(0, ms) / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMaintRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintForm.desc) return;
    setMaintStatus('calling');
    setMaintTimers({ requestedAt: Date.now(), arrivedAt: 0, completedAt: 0 });
    setTimeout(() => {
      setMaintTech(isRTL ? 'المهندس / أحمد السالم' : 'Eng. Ahmed Al-Salem');
      setMaintStatus('on_the_way');
    }, 4000); // محاكاة الرد بعد 4 ثواني
  };
  const handleMaintArrival = () => {
    setMaintTimers(prev => ({ ...prev, arrivedAt: Date.now() }));
    setMaintStatus('in_progress');
  };
  const handleMaintFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setMaintTimers(prev => ({ ...prev, completedAt: Date.now() }));
    setMaintStatus('completed');
  };
  const handleMaintNumpad = (num: string) => {
    if (maintForm.techPin.length < 6) setMaintForm({ ...maintForm, techPin: maintForm.techPin + num });
  };
  const handleMaintNumpadBackspace = () => {
    setMaintForm({ ...maintForm, techPin: maintForm.techPin.slice(0, -1) });
  };

  // IoT & Barcode Handlers
  const handleScanBarcode = (field: 'equipId' | 'productCode' | 'batch') => {
    alert(isRTL ? 'جاري تفعيل كاميرا الباركود...' : 'Activating Barcode Camera...');
    setTimeout(() => {
      setFormState(prev => ({ ...prev, [field]: 'BC-' + Math.floor(Math.random() * 100000) }));
    }, 800);
  };

  const handleReadScale = () => {
    alert(isRTL ? 'جاري الاتصال بالميزان (SCADA/IoT)...' : 'Connecting to Scale (SCADA/IoT)...');
    setTimeout(() => {
      setFormState(prev => ({ ...prev, qty: (Math.random() * 100).toFixed(2) }));
    }, 1000);
  };

  const submitDeviation = (e: React.FormEvent) => {
    e.preventDefault();
    alert(isRTL ? 'تم تسجيل الانحراف وإبلاغ فريق الجودة فوراً!' : 'Deviation logged and QA notified immediately!');
    setShowDeviation(false);
    setDeviationForm({ type: '', desc: '', severity: 'minor' });
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div 
      className={`min-h-screen bg-slate-900 transition-colors duration-300 ${step > 2 ? 'p-4 md:p-8' : 'flex items-center justify-center p-4'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`w-full ${step > 2 ? 'max-w-7xl h-full min-h-[85vh]' : 'max-w-3xl'} bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col transition-all duration-500`}>
        
        {/* Header / Logo Area */}
        <div className="bg-indigo-600 p-6 md:p-8 text-center relative flex-shrink-0">
          {step > 2 && employee && (
            <div className="absolute top-4 right-4 left-4 flex justify-between items-center text-white text-sm md:text-base font-semibold">
              <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm"><User className="w-5 h-5"/> {employee.name} ({employee.id})</div>
              <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm text-indigo-100 font-mono tracking-wider">
                  <Clock className="w-5 h-5 text-indigo-300" /> {time.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US')}
                </div>
                <button onClick={toggleFullscreen} className="hidden md:flex bg-black/20 p-2 rounded-xl hover:bg-white/20 transition-colors">
                  {isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
                </button>
                <span className="hidden md:inline-block bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm">{t.shift}: {employee.shift}</span>
                <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl transition-colors shadow-lg"><LogOut className="w-5 h-5"/> <span className="hidden md:inline-block">{t.logout}</span></button>
              </div>
            </div>
          )}
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wide">
            {t.welcome}
          </h1>
        </div>

        {/* SCREEN 1: Language Selection */}
        {step === 1 && (
          <div className="p-10 text-center animate-fade-in flex-1 flex flex-col justify-center">
            <h2 className="text-2xl text-slate-300 mb-8">{t.selectLang}</h2>
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <button 
                onClick={() => handleLanguageSelect('ar')}
                className="px-12 py-8 bg-slate-700 hover:bg-indigo-500 text-white text-3xl font-bold rounded-xl shadow-md transition-all active:scale-95 border border-slate-600 flex items-center justify-center gap-3"
              >
                <Globe className="w-8 h-8" /> العربية
              </button>
              <button 
                onClick={() => handleLanguageSelect('en')}
                className="px-12 py-8 bg-slate-700 hover:bg-indigo-500 text-white text-3xl font-bold rounded-xl shadow-md transition-all active:scale-95 border border-slate-600 flex items-center justify-center gap-3"
              >
                <Globe className="w-8 h-8" /> English
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: High Security Authentication */}
        {step === 2 && (
          <div className="p-8 animate-fade-in flex-1">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-white">{t.loginTitle}</h2>
              <button onClick={() => setStep(1)} className="text-slate-400 hover:text-white flex items-center gap-2">
                <Globe className="w-5 h-5" /> {lang === 'ar' ? 'English' : 'العربية'}
              </button>
            </div>

            {/* Auth Method Tabs */}
            <div className="flex bg-slate-900 rounded-lg p-1 mb-8">
              <button 
                onClick={() => setAuthMethod('password')}
                className={`flex-1 py-4 text-xl font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${authMethod === 'password' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Key className="w-5 h-5" /> {t.passTab}
              </button>
              <button 
                onClick={() => setAuthMethod('rfid')}
                className={`flex-1 py-4 text-xl font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${authMethod === 'rfid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <CreditCard className="w-5 h-5" /> {t.rfidTab}
              </button>
              <button 
                onClick={() => setAuthMethod('bio')}
                className={`flex-1 py-4 text-xl font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${authMethod === 'bio' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <ScanFace className="w-5 h-5" /> {t.bioTab}
              </button>
            </div>

            {/* Form Area */}
            <div className="min-h-[250px] flex flex-col justify-center">
              {authMethod === 'password' && (
                <form onSubmit={handleLogin} className="space-y-6 animate-fade-in">
                  <div>
                    <label className="block text-slate-300 text-lg mb-2 font-semibold">{t.empId}</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-6 py-4 text-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="e.g. 10452"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-lg mb-2 font-semibold">{t.password}</label>
                    <input 
                      type="password" 
                      required
                      className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg px-6 py-4 text-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-2xl font-bold py-5 rounded-lg shadow-lg transition-all active:scale-95 mt-4"
                  >
                    {t.loginBtn}
                  </button>
                </form>
              )}

              {authMethod === 'rfid' && (
                <div className="text-center p-8 bg-slate-900 rounded-lg border border-slate-700 animate-fade-in">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 text-indigo-400 animate-pulse" />
                  <p className="text-2xl text-slate-300 font-semibold">{t.rfidInstruction}</p>
                </div>
              )}

              {authMethod === 'bio' && (
                <div className="text-center p-8 bg-slate-900 rounded-lg border border-slate-700 opacity-60 cursor-not-allowed animate-fade-in">
                  <ScanFace className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                  <p className="text-2xl text-slate-300 font-semibold">{t.bioInstruction}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCREEN 3: Department Gateway */}
        {step === 3 && (
          <div className="p-6 md:p-10 animate-fade-in flex-1 flex flex-col">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{t.departmentsTitle}</h2>
            <p className="text-xl text-slate-400 mb-8">{t.selectDept}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {departmentsList.map((dept) => {
                const Icon = dept.icon;
                return (
                  <button 
                    key={dept.id}
                    onClick={() => { setSelectedDept(dept.id); setStep(4); }}
                    className="group bg-slate-900 border-2 border-slate-700 hover:border-indigo-500 rounded-3xl p-8 flex flex-col items-center justify-center gap-6 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-95 cursor-pointer"
                  >
                    <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${dept.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-12 h-12 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white text-center">
                      {t[dept.key as keyof typeof t] as string}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* SCREEN 4: Process Selection */}
        {step === 4 && (
          <div className="p-6 md:p-10 animate-fade-in flex-1 flex flex-col">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={() => setStep(3)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-2xl text-white transition-colors">
                <BackIcon className="w-8 h-8" />
              </button>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">{t.processTitle}</h2>
                <p className="text-xl text-slate-400 mt-2">{t.selectProcess}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Fallback to generic process if specific dept isn't defined in dummy data */}
              {(processList[selectedDept!] || processList['tablets']).map((proc) => (
                <button 
                  key={proc.id}
                  onClick={() => { setSelectedProcess(isRTL ? proc.labelAr : proc.labelEn); setStep(5); }}
                  className="bg-slate-900 border-2 border-slate-700 hover:border-emerald-500 rounded-3xl p-8 flex items-center justify-between transition-all hover:bg-slate-800 active:scale-95 group"
                >
                  <span className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {isRTL ? proc.labelAr : proc.labelEn}
                  </span>
                  <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 flex items-center justify-center">
                    <ArrowLeft className={`w-6 h-6 text-slate-400 group-hover:text-emerald-400 ${isRTL ? 'rotate-0' : 'rotate-180'}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 5: GMP Operations Portal (Form) */}
        {step === 5 && (
          <div className="p-6 md:p-10 animate-fade-in flex-1 flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-700">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep(4)} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-2xl text-white transition-colors">
                  <BackIcon className="w-8 h-8" />
                </button>
                <div>
                  <h2 className="text-3xl font-bold text-white">{t.gmpFormTitle}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg text-lg font-semibold border border-indigo-500/30">
                      {t[selectedDept as keyof typeof t] as string}
                    </span>
                    <span className="text-slate-500 text-xl">&gt;</span>
                    <span className="text-emerald-400 text-xl font-bold">{selectedProcess}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => setShowDeviation(true)} className="hidden lg:flex items-center gap-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-3 rounded-xl border border-red-500/20 transition-colors active:scale-95 shadow-lg shadow-red-500/10">
                  <AlertOctagon className="w-6 h-6" />
                  <span className="font-bold text-lg">{t.reportDeviation}</span>
                </button>
              </div>
            </div>

            {selectedDept === 'maintenance' ? (
              <div className="max-w-3xl mx-auto w-full space-y-6">
                {maintStatus === 'idle' && (
                  <form onSubmit={handleMaintRequest} className="bg-slate-900 p-8 rounded-3xl border border-slate-700 shadow-xl">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><Wrench className="text-amber-500"/> {t.maintRequestForm}</h3>
                    <label className="block text-slate-300 text-lg font-semibold mb-3">{t.maintDescLabel}</label>
                    <textarea 
                      required rows={4} value={maintForm.desc} onChange={e => setMaintForm({...maintForm, desc: e.target.value})}
                      className="w-full bg-slate-800 text-white border border-slate-600 rounded-xl px-5 py-4 text-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500 transition-all resize-none mb-6"
                      placeholder={isRTL ? "مثال: تسريب مياه في صمام الضغط للماكينة رقم 4" : "e.g. Water leak in pressure valve for machine 4"}
                    />
                    <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xl font-bold py-5 rounded-xl shadow-xl shadow-amber-600/20 transition-all active:scale-95 flex items-center justify-center gap-3">
                      <AlertTriangle className="w-6 h-6"/> {t.maintSendRequest}
                    </button>
                  </form>
                )}

                {maintStatus === 'calling' && (
                  <div className="bg-slate-900 p-12 rounded-3xl border border-amber-500/50 shadow-2xl shadow-amber-500/20 text-center animate-pulse mt-10">
                    <Wifi className="w-20 h-20 text-amber-500 mx-auto mb-6 animate-ping"/>
                    <h3 className="text-3xl font-bold text-white">{t.maintCalling}</h3>
                  </div>
                )}

                {maintStatus === 'on_the_way' && (
                  <div className="bg-slate-900 p-10 rounded-3xl border border-blue-500/50 shadow-2xl shadow-blue-500/20 text-center animate-fade-in mt-6">
                    <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <User className="w-12 h-12 text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">{t.maintOnTheWay}</h3>
                    <p className="text-xl text-blue-300 mb-8">{t.maintTechName} <span className="font-bold text-white">{maintTech}</span></p>
                    
                    <div className="bg-slate-800 p-6 rounded-2xl mb-10 inline-block min-w-[200px] border border-slate-700">
                      <p className="text-sm text-slate-400 mb-2">{isRTL ? 'وقت الانتظار' : 'Waiting Time'}</p>
                      <p className="text-5xl font-mono font-bold text-amber-400">{formatDuration(time.getTime() - maintTimers.requestedAt)}</p>
                    </div>

                    <button onClick={handleMaintArrival} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-2xl font-bold py-6 rounded-2xl shadow-xl shadow-blue-600/30 transition-all active:scale-95 flex items-center justify-center gap-3">
                      <CheckCircle2 className="w-8 h-8"/> {t.maintConfirmArrival}
                    </button>
                  </div>
                )}

                {maintStatus === 'in_progress' && (
                  <form onSubmit={handleMaintFinish} className="bg-slate-900 p-8 rounded-3xl border border-emerald-500/50 shadow-2xl shadow-emerald-500/20 animate-fade-in mt-4">
                    <div className="text-center mb-8 pb-8 border-b border-slate-700">
                      <Wrench className="w-16 h-16 text-emerald-500 mx-auto mb-4 animate-bounce"/>
                      <h3 className="text-3xl font-bold text-white mb-2">{t.maintInProgress}</h3>
                      <p className="text-xl text-emerald-300 mb-6">{t.maintTechName} <span className="font-bold text-white">{maintTech}</span></p>
                      
                      <div className="bg-slate-800 p-6 rounded-2xl inline-block min-w-[250px] border border-slate-700">
                        <p className="text-sm text-slate-400 mb-2">{t.maintDowntime}</p>
                        <p className="text-5xl font-mono font-bold text-red-400 animate-pulse">{formatDuration(time.getTime() - maintTimers.requestedAt)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-stretch gap-8">
                      <div className="flex-1 w-full space-y-4">
                        <label className="flex items-center gap-2 text-slate-300 text-lg font-bold mb-3">
                          <FileSignature className="w-6 h-6 text-emerald-400" /> {t.maintTechPin}
                        </label>
                        <input 
                          type="password" required readOnly value={maintForm.techPin} 
                          className="w-full bg-black/40 text-emerald-400 border-2 border-emerald-500/30 rounded-xl px-4 py-4 text-4xl tracking-[0.5em] text-center focus:outline-none pointer-events-none"
                          placeholder="••••"
                        />
                        <button 
                          type="submit"
                          className={`w-full mt-8 text-white text-xl font-bold py-6 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${maintForm.techPin.length >= 4 ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                          disabled={maintForm.techPin.length < 4}
                        >
                          <CheckCircle2 className="w-6 h-6" /> {t.maintFinish}
                        </button>
                      </div>
                      <div className="flex-1 w-full max-w-sm mx-auto flex flex-col justify-center">
                        <div className="grid grid-cols-3 gap-3" dir="ltr">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <button key={n} type="button" onClick={() => handleMaintNumpad(n.toString())} className="bg-slate-700 hover:bg-emerald-600 text-white text-3xl font-bold py-5 rounded-xl active:scale-95 transition-all shadow-md">{n}</button>
                          ))}
                          <button type="button" onClick={() => setMaintForm({...maintForm, techPin: ''})} className="bg-red-500/20 text-red-400 hover:bg-red-50 hover:text-white text-xl font-bold py-5 rounded-xl active:scale-95 transition-all shadow-md">{t.clear}</button>
                          <button type="button" onClick={() => handleMaintNumpad('0')} className="bg-slate-700 hover:bg-emerald-600 text-white text-3xl font-bold py-5 rounded-xl active:scale-95 transition-all shadow-md">0</button>
                          <button type="button" onClick={handleMaintNumpadBackspace} className="bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center py-5 rounded-xl active:scale-95 transition-all shadow-md"><Delete className="w-8 h-8"/></button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                {maintStatus === 'completed' && (
                  <div className="bg-slate-900 p-12 rounded-3xl border border-emerald-500 shadow-2xl shadow-emerald-500/20 text-center animate-fade-in mt-10">
                    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                    <h3 className="text-4xl font-bold text-white mb-4">{t.maintCompleted}</h3>
                    
                    <div className="bg-slate-800 p-6 rounded-2xl inline-block min-w-[300px] mt-4 border border-slate-700">
                      <p className="text-lg text-slate-400 mb-2">{t.maintTotalDowntime}</p>
                      <p className="text-6xl font-mono font-bold text-emerald-400">{formatDuration(maintTimers.completedAt - maintTimers.requestedAt)}</p>
                    </div>

                    <button onClick={() => { setMaintStatus('idle'); setStep(4); setMaintForm({ desc: '', techPin: '' }); }} className="mt-10 w-full max-w-sm mx-auto px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white text-xl rounded-2xl font-bold transition-all active:scale-95">
                      {isRTL ? 'العودة لقائمة العمليات' : 'Return to Processes'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto w-full space-y-8">
              {/* Section 1: Pre-requisites & Line Clearance */}
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-700">
                  <p className="text-lg md:text-xl text-slate-300 font-semibold mb-4 leading-tight min-h-[50px]">{t.ppeReady}</p>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setFormState({...formState, ppeReady: true})} className={`flex-1 py-3 md:py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all ${formState.ppeReady ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {formState.ppeReady && <CheckCircle2 className="w-5 h-5" />} {t.yes}
                    </button>
                    <button type="button" onClick={() => setFormState({...formState, ppeReady: false})} className={`flex-1 py-3 md:py-4 rounded-xl text-lg font-bold transition-all ${!formState.ppeReady ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {t.no}
                    </button>
                  </div>
                </div>
                <div className="bg-slate-900 p-4 md:p-6 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
                  <p className="text-lg md:text-xl text-indigo-300 font-semibold mb-4 leading-tight min-h-[50px]">{t.lineClearance}</p>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setFormState({...formState, lineClearance: true})} className={`flex-1 py-3 md:py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all ${formState.lineClearance ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {formState.lineClearance && <CheckCircle2 className="w-5 h-5" />} {t.yes}
                    </button>
                    <button type="button" onClick={() => setFormState({...formState, lineClearance: false})} className={`flex-1 py-3 md:py-4 rounded-xl text-lg font-bold transition-all ${!formState.lineClearance ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {t.no}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Equipment Status */}
              <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-700">
                  <p className="text-lg md:text-xl text-slate-300 font-semibold mb-4 leading-tight min-h-[50px]">{t.equipClean}</p>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setFormState({...formState, equipClean: true})} className={`flex-1 py-3 md:py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all ${formState.equipClean ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {formState.equipClean && <CheckCircle2 className="w-5 h-5" />} {t.yes}
                    </button>
                    <button type="button" onClick={() => setFormState({...formState, equipClean: false})} className={`flex-1 py-3 md:py-4 rounded-xl text-lg font-bold transition-all ${!formState.equipClean ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {t.no}
                    </button>
                  </div>
                </div>
                <div className="bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-700">
                  <p className="text-lg md:text-xl text-slate-300 font-semibold mb-4 leading-tight min-h-[50px]">{t.equipCalibrated}</p>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setFormState({...formState, equipCalibrated: true})} className={`flex-1 py-3 md:py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all ${formState.equipCalibrated ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {formState.equipCalibrated && <CheckCircle2 className="w-5 h-5" />} {t.yes}
                    </button>
                    <button type="button" onClick={() => setFormState({...formState, equipCalibrated: false})} className={`flex-1 py-3 md:py-4 rounded-xl text-lg font-bold transition-all ${!formState.equipCalibrated ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {t.no}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Process Data */}
              <div className="grid md:grid-cols-2 gap-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-700/50">
                <div>
                  <label className="block text-slate-300 text-lg font-semibold mb-2">{t.equipId}</label>
                  <div className="flex gap-2">
                    <input 
                      autoComplete="off"
                      type="text" required value={formState.equipId} onChange={e => setFormState({...formState, equipId: e.target.value})}
                      className="flex-1 bg-slate-900 text-white border border-slate-700 rounded-xl px-5 py-4 text-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="EQ-MX-01"
                    />
                    <button type="button" onClick={() => handleScanBarcode('equipId')} className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white px-5 rounded-xl transition-colors border border-slate-700 flex items-center justify-center" title={t.scanBarcode}>
                      <ScanLine className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 text-lg font-semibold mb-2">{t.productCode}</label>
                  <div className="flex gap-2">
                    <input 
                      autoComplete="off"
                      type="text" required value={formState.productCode} onChange={e => setFormState({...formState, productCode: e.target.value})}
                      className="flex-1 bg-slate-900 text-white border border-slate-700 rounded-xl px-5 py-4 text-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="PRD-1029"
                    />
                    <button type="button" onClick={() => handleScanBarcode('productCode')} className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white px-5 rounded-xl transition-colors border border-slate-700 flex items-center justify-center" title={t.scanBarcode}>
                      <ScanLine className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 text-lg font-semibold mb-2">{t.batchNumber}</label>
                  <div className="flex gap-2">
                    <input 
                      autoComplete="off"
                      type="text" required value={formState.batch} onChange={e => setFormState({...formState, batch: e.target.value})}
                      className="flex-1 bg-slate-900 text-white border border-slate-700 rounded-xl px-5 py-4 text-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="B-2024-XXXX"
                    />
                    <button type="button" onClick={() => handleScanBarcode('batch')} className="bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white px-5 rounded-xl transition-colors border border-slate-700 flex items-center justify-center" title={t.scanBarcode}>
                      <ScanLine className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-300 text-lg font-semibold mb-2">{t.quantity}</label>
                  <div className="flex gap-2">
                    <input 
                      autoComplete="off"
                      type="number" required value={formState.qty} onChange={e => setFormState({...formState, qty: e.target.value})}
                      className="flex-1 bg-slate-900 text-white border border-slate-700 rounded-xl px-5 py-4 text-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder="0.00"
                    />
                    <button type="button" onClick={handleReadScale} className="bg-indigo-900/50 hover:bg-indigo-600 text-indigo-300 hover:text-white px-5 rounded-xl transition-colors border border-indigo-500/50 flex items-center justify-center gap-2 font-bold" title={t.readScale}>
                      <Wifi className="w-5 h-5" /> IoT
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-slate-300 text-lg font-semibold mb-2">{t.notes}</label>
                  <textarea 
                    rows={2} value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})}
                    className="w-full bg-slate-900 text-white border border-slate-700 rounded-xl px-5 py-3 text-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Section 4: Dual Electronic Signatures (Maker-Checker) */}
              <div className="bg-indigo-900/30 p-8 rounded-3xl border-2 border-indigo-500/50 mt-8">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-indigo-500/30">
                  <ShieldCheck className="w-8 h-8 text-indigo-400" />
                  <h3 className="text-2xl font-bold text-indigo-100">{t.makerCheckerTitle}</h3>
                </div>
                
                <div className="flex flex-col md:flex-row items-start md:items-stretch gap-10">
                  {/* Signatures Inputs */}
                  <div className="flex-1 w-full space-y-6">
                    <div 
                      onClick={() => setActivePinField('operator')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${activePinField === 'operator' ? 'bg-indigo-500/20 border-indigo-400' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                    >
                      <label className="flex items-center gap-2 text-slate-300 text-lg font-bold mb-3 cursor-pointer">
                        <FileSignature className={`w-5 h-5 ${activePinField === 'operator' ? 'text-indigo-400' : 'text-slate-500'}`} /> 
                        {t.operatorSignature}
                      </label>
                      <input 
                        type="password" required readOnly value={formState.operatorPin} 
                        className="w-full bg-black/40 text-white rounded-xl px-4 py-3 text-3xl tracking-[0.5em] text-center focus:outline-none pointer-events-none"
                        placeholder="••••"
                      />
                    </div>

                    <div 
                      onClick={() => setActivePinField('qa')}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${activePinField === 'qa' ? 'bg-emerald-500/20 border-emerald-400' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                    >
                      <label className="flex items-center gap-2 text-slate-300 text-lg font-bold mb-3 cursor-pointer">
                        <FileCheck className={`w-5 h-5 ${activePinField === 'qa' ? 'text-emerald-400' : 'text-slate-500'}`} /> 
                        {t.qaSignature}
                      </label>
                      <input 
                        type="password" required readOnly value={formState.qaPin} 
                        className="w-full bg-black/40 text-white rounded-xl px-4 py-3 text-3xl tracking-[0.5em] text-center focus:outline-none pointer-events-none"
                        placeholder="••••"
                      />
                    </div>
                  </div>

                  {/* Virtual Numpad & Submit */}
                  <div className="flex-1 w-full max-w-sm mx-auto flex flex-col justify-between">
                    <div className="grid grid-cols-3 gap-3" dir="ltr">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <button key={n} type="button" onClick={() => handleNumpad(n.toString())} className="bg-slate-700 hover:bg-indigo-500 text-white text-3xl font-bold py-5 rounded-xl active:scale-95 transition-all shadow-md">{n}</button>
                      ))}
                      <button type="button" onClick={() => {
                        if(activePinField==='operator') setFormState({...formState, operatorPin: ''});
                        if(activePinField==='qa') setFormState({...formState, qaPin: ''});
                      }} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-xl font-bold py-5 rounded-xl active:scale-95 transition-all shadow-md">{t.clear}</button>
                      <button type="button" onClick={() => handleNumpad('0')} className="bg-slate-700 hover:bg-indigo-500 text-white text-3xl font-bold py-5 rounded-xl active:scale-95 transition-all shadow-md">0</button>
                      <button type="button" onClick={handleNumpadBackspace} className="bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center py-5 rounded-xl active:scale-95 transition-all shadow-md"><Delete className="w-8 h-8"/></button>
                    </div>
                    
                    <button 
                      type="submit"
                      className={`w-full mt-6 text-white text-2xl font-bold py-6 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${(formState.operatorPin.length >= 4 && formState.qaPin.length >= 4) ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' : 'bg-slate-700 text-slate-400 cursor-not-allowed'}`}
                      disabled={formState.operatorPin.length < 4 || formState.qaPin.length < 4}
                    >
                      <CheckCircle2 className="w-8 h-8" /> {t.signSubmit}
                    </button>
                  </div>
                </div>
              </div>
              </form>
            )}
          </div>
        )}

        {/* Deviation Modal (Overlay) */}
        {showDeviation && (
          <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-slate-800 border-2 border-red-500 rounded-3xl p-8 max-w-2xl w-full shadow-2xl shadow-red-500/20">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3 text-red-500">
                  <AlertOctagon className="w-10 h-10" />
                  <h3 className="text-3xl font-bold">{t.reportDeviation}</h3>
                </div>
                <button onClick={() => setShowDeviation(false)} className="text-slate-400 hover:text-white transition-colors">
                  <XCircle className="w-8 h-8" />
                </button>
              </div>
              
              <form onSubmit={submitDeviation} className="space-y-6">
                <div>
                  <label className="block text-slate-300 text-lg font-semibold mb-2">{t.deviationType}</label>
                  <input type="text" required value={deviationForm.type} onChange={e => setDeviationForm({...deviationForm, type: e.target.value})} className="w-full bg-slate-900 text-white border border-slate-700 rounded-xl px-5 py-4 text-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 transition-all" placeholder="مثال: تسرب مياه، اختلاف وزن، عطل ماكينة..."/>
                </div>
                
                <div>
                  <label className="block text-slate-300 text-lg font-semibold mb-2">{t.severity}</label>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setDeviationForm({...deviationForm, severity: 'critical'})} className={`flex-1 py-4 rounded-xl text-xl font-bold transition-all ${deviationForm.severity === 'critical' ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' : 'bg-slate-900 text-slate-400 border border-slate-700'}`}>{t.critical}</button>
                    <button type="button" onClick={() => setDeviationForm({...deviationForm, severity: 'major'})} className={`flex-1 py-4 rounded-xl text-xl font-bold transition-all ${deviationForm.severity === 'major' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'bg-slate-900 text-slate-400 border border-slate-700'}`}>{t.major}</button>
                    <button type="button" onClick={() => setDeviationForm({...deviationForm, severity: 'minor'})} className={`flex-1 py-4 rounded-xl text-xl font-bold transition-all ${deviationForm.severity === 'minor' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-900 text-slate-400 border border-slate-700'}`}>{t.minor}</button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-lg font-semibold mb-2">{t.deviationDesc}</label>
                  <textarea required rows={4} value={deviationForm.desc} onChange={e => setDeviationForm({...deviationForm, desc: e.target.value})} className="w-full bg-slate-900 text-white border border-slate-700 rounded-xl px-5 py-4 text-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 transition-all resize-none" placeholder="اكتب التفاصيل هنا بدقة..."></textarea>
                </div>

                <div className="flex gap-4 pt-4 border-t border-slate-700">
                  <button type="button" onClick={() => setShowDeviation(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xl font-bold py-5 rounded-xl transition-all">
                    {t.cancel}
                  </button>
                  <button type="submit" className="flex-[2] bg-red-600 hover:bg-red-500 text-white text-xl font-bold py-5 rounded-xl shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-3">
                    <AlertOctagon className="w-6 h-6" /> {t.submitDeviation}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer Security Badge */}
        <div className="bg-slate-900 p-4 text-center border-t border-slate-700 flex-shrink-0">
          <p className="text-slate-500 text-sm font-semibold flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> {t.footer}
          </p>
        </div>

      </div>
    </div>
  );
}