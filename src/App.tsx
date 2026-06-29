/**
 * ════════════════════════════════════════════════════════════════
 *  App - الجذر الرئيسي (نسخة مُحسَّنة — Loading Flow Fix)
 * ════════════════════════════════════════════════════════════════
 *
 *  🔧 الإصلاحات المُطبّقة:
 *  ✅ sessionStorage → localStorage (الإقرار يُحفَظ عبر الجلسات)
 *  ✅ ترتيب التحقق: localStorage أولاً قبل initialize() لتقليل الانتظار
 *  ✅ AuthLoader: محسَّن بشاشة أكثر احترافية (progress bar)
 *  ✅ إضافة timeout للـ initialize (10 ثواني) + رسالة خطأ للمستخدم
 *  ✅ إزالة wrapper المتعارض مع fixed positioning للـ Sidebar
 *  ✅ Sidebar: مغلق افتراضياً على الموبايل، مفتوح على الديسكتوب
 *  ✅ backdrop معتم على الموبايل يغلق Sidebar عند النقر
 *  ✅ إضافة الصفحات المفقودة (MyPayroll, MyLoans, MyExpenses)
 *  ════════════════════════════════════════════════════════════════
 */

import { useEffect, Suspense, lazy, useState } from 'react';
import { useAuthStore, useUIStore } from './store';
import ToastContainer from './components/ui/Toast';
import SplashScreen from './components/ui/SplashScreen';
import Sidebar from './components/dashboard/Sidebar';
import Header from './components/dashboard/Header';
import LoginPage from './pages/auth/LoginPage';
import LandingPage from './pages/public/LandingPage';
import DisclaimerPage from './pages/public/DisclaimerPage';
import SystemGuide from './pages/public/SystemGuide';
import NotificationsPage from './pages/public/NotificationsPage';
import MyNotificationsPage from './pages/public/MyNotificationsPage';
import WelcomeModal from './components/dashboard/WelcomeModal';

// ─── Lazy Imports: Developer ─────────────────────────────────────
const StructureManager   = lazy(() => import('./components/dashboard/developer').then(m => ({ default: m.StructureManager })));
const BiometricPage      = lazy(() => import('./components/dashboard/developer').then(m => ({ default: m.BiometricSettings })));
const DeveloperDashboard = lazy(() => import('./components/dashboard/DeveloperDashboard'));

// ─── Lazy Imports: Employee ──────────────────────────────────────
const EmployeeDashboard  = lazy(() => import('./pages/employee/EmployeeDashboard'));
const ProblemsList       = lazy(() => import('./pages/employee/ProblemsList'));
const ProblemDetail      = lazy(() => import('./pages/employee/ProblemDetail'));
const NewProblemPage     = lazy(() => import('./pages/employee/NewProblemPage'));
const WellnessPage       = lazy(() => import('./pages/employee/WellnessPage'));
const AIChatPage         = lazy(() => import('./pages/employee/AIChatPage'));
const SurveyPage         = lazy(() => import('./pages/employee/SurveyPage'));
const ProfilePage        = lazy(() => import('./pages/employee/ProfilePage'));
const ContactPage        = lazy(() => import('./pages/employee/ContactPage'));
const TrainingPage       = lazy(() => import('./pages/employee/TrainingPage'));
const SOPsPage           = lazy(() => import('./pages/employee/SOPsPage'));
const MyAttendancePage   = lazy(() => import('./pages/employee/MyAttendancePage'));
const LeaveRequestPage   = lazy(() => import('./pages/employee/LeaveRequestPage'));
const PermissionsPage    = lazy(() => import('./pages/employee/PermissionsPage'));
const AIInsightsDashboard = lazy(() => import('./pages/employee/AIInsightsDashboard'));
const MyPayrollPage      = lazy(() => import('./pages/employee/MyPayrollPage'));
const MyLoansPage        = lazy(() => import('./pages/employee/MyLoansPage'));
const MyExpensesPage     = lazy(() => import('./pages/employee/MyExpensesPage'));

// ─── Lazy Imports: HR ────────────────────────────────────────────
const HRDashboard              = lazy(() => import('./pages/hr/HRDashboard'));
const AnalyticsPage            = lazy(() => import('./pages/hr/AnalyticsPage'));
const TeamPage                 = lazy(() => import('./pages/hr/TeamPage'));
const ReportsPage              = lazy(() => import('./pages/hr/ReportsPage'));
const AttendancePage           = lazy(() => import('./pages/hr/AttendancePage'));
const TalentMarketPage         = lazy(() => import('./pages/hr/TalentMarketPage'));
const KioskPage                = lazy(() => import('./pages/hr/KioskPage'));
const HRMovementAnalyticsPage  = lazy(() => import('./pages/hr/HRMovementAnalyticsPage'));
const TrainingManagementPage   = lazy(() => import('./pages/hr/TrainingManagementPage'));
const TrainingReportsPage      = lazy(() => import('./pages/hr/TrainingReportsPage'));

// ─── Lazy Imports: Admin ─────────────────────────────────────────
const AdminDashboard              = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminEmployeesPage          = lazy(() => import('./pages/admin/AdminEmployeesPage'));
const AdminPermissionsTree        = lazy(() => import('./pages/admin/AdminPermissionsTree'));
const AuditLogPage                = lazy(() => import('./pages/admin/AuditLogPage'));
const SettingsPage                = lazy(() => import('./pages/admin/SettingsPage'));
const AIConfigPage                = lazy(() => import('./pages/admin/AIConfigPage'));
const AdminLandingPageCMS         = lazy(() => import('./pages/admin/AdminLandingPageCMS'));
const AdminGatekeeperPermissions  = lazy(() => import('./pages/admin/AdminGatekeeperPermissions'));
const AdminSOPsPage               = lazy(() => import('./pages/admin/AdminSOPsPage'));
const AdminSOPsReport             = lazy(() => import('./pages/admin/AdminSOPsReport'));

// ─── Lazy Imports: Other Roles ───────────────────────────────────
const GatekeeperPage        = lazy(() => import('./pages/gatekeeper/GatekeeperPage'));
const SupervisorBreaksPage  = lazy(() => import('./pages/supervisor/SupervisorBreaksPage'));
const ManagerAttendancePage = lazy(() => import('./pages/manager/ManagerAttendancePage'));

// ════════════════════════════════════════════════════════════════
//  Constants
// ════════════════════════════════════════════════════════════════

const ROLE_DEFAULT_VIEW: Record<string, string> = {
  developer: 'developer-dashboard',
  hr:        'hr-dashboard',
  admin:     'admin-dashboard',
  employee:  'employee-dashboard',
  gatekeeper:'gatekeeper-portal',
  supervisor:'employee-dashboard',
  manager:   'manager-dashboard',
};

// صفحات تظهر في أدوار متعددة — تحديدها مسبقاً يُقلل تكرار switch
const SHARED_PAGE: Record<string, JSX.Element> = {
  'leave-requests':  <LeaveRequestPage />,
  'permissions':     <PermissionsPage />,
  'payroll':         <MyPayrollPage />,
  'loans':           <MyLoansPage />,
  'expenses':        <MyExpensesPage />,
};

// ════════════════════════════════════════════════════════════════
//  Loaders
// ════════════════════════════════════════════════════════════════

function PageLoader() {
  return <SplashScreen mini />;
}

function AuthLoader({ timedOut }: { timedOut?: boolean }) {
  return (
    <SplashScreen
      timedOut={timedOut}
      message={!timedOut ? 'جاري التحقق من الجلسة...' : undefined}
    />
  );
}

function DefaultPage({ role }: { role?: string }) {
  if (role === 'developer')  return <DeveloperDashboard />;
  if (role === 'hr')         return <HRDashboard />;
  if (role === 'admin')      return <AdminDashboard />;
  if (role === 'gatekeeper') return <GatekeeperPage />;
  return <EmployeeDashboard />;
}

// ════════════════════════════════════════════════════════════════
//  Page Renderer
// ════════════════════════════════════════════════════════════════

function PageRenderer() {
  const { activeView, sidebarOpen } = useUIStore();
  const { user } = useAuthStore();

  const renderPage = (): JSX.Element => {
    // صفحة تفاصيل المشكلة — معرف ديناميكي
    if (activeView.startsWith('problem-detail-')) {
      const id = activeView.replace('problem-detail-', '');
      return <ProblemDetail problemId={id} />;
    }

    // صفحات مشتركة بين أدوار (employee / manager / hr / supervisor)
    for (const suffix of Object.keys(SHARED_PAGE)) {
      if (activeView.endsWith(`-${suffix}`)) return SHARED_PAGE[suffix];
    }

    switch (activeView) {
      // ─── إشعارات ────────────────────────────────────────────
      case 'my-notifications':    return <MyNotificationsPage />;
      case 'notifications':       return <NotificationsPage />;

      // ─── Employee ────────────────────────────────────────────
      case 'employee-dashboard':  return <EmployeeDashboard />;
      case 'employee-problems':   return <ProblemsList isHR={false} />;
      case 'new-problem':         return <NewProblemPage />;
      case 'employee-wellness':   return <WellnessPage />;
      case 'employee-ai-chat':    return <AIChatPage />;
      case 'employee-survey':     return <SurveyPage />;
      case 'employee-training':   return <TrainingPage />;
      case 'employee-sops':       return <SOPsPage />;
      case 'employee-profile':    return <ProfilePage />;
      case 'employee-contact':    return <ContactPage />;
      case 'employee-attendance': return <MyAttendancePage />;

      // ─── Kiosk ───────────────────────────────────────────────
      case 'kiosk-mode':          return <KioskPage />;

      // ─── Manager ─────────────────────────────────────────────
      case 'manager-dashboard':   return <HRDashboard />;
      case 'manager-attendance':  return <ManagerAttendancePage />;

      // ─── HR ──────────────────────────────────────────────────
      case 'hr-dashboard':        return <HRDashboard />;
      case 'hr-problems':         return <ProblemsList isHR={true} />;
      case 'hr-analytics':
      case 'hr-sentiment':
      case 'hr-predictions':      return <AnalyticsPage />;
      case 'hr-team':             return <TeamPage />;
      case 'hr-talent-market':    return <TalentMarketPage />;
      case 'hr-attendance':       return <AttendancePage />;
      case 'hr-communication':    return <ContactPage />;
      case 'hr-reports':          return <ReportsPage />;
      case 'hr-movement-analysis':return <HRMovementAnalyticsPage />;
      case 'hr-manage-training':  return <TrainingManagementPage />;
      case 'hr-training-reports': return <TrainingReportsPage />;
      case 'admin-ai-insights':
      case 'hr-ai-insights':      return <AIInsightsDashboard />;

      // ─── Gatekeeper / Movements ──────────────────────────────
      case 'gatekeeper':
      case 'hr-movements':
      case 'movements':
      case 'employee-movements':
      case 'gatekeeper-page':
      case 'gatekeeper-portal':   return <GatekeeperPage />;

      // ─── Admin ───────────────────────────────────────────────
      case 'admin-dashboard':              return <AdminDashboard />;
      case 'admin-cms':                    return <AdminLandingPageCMS />;
      case 'admin-employees':              return <AdminEmployeesPage />;
      case 'admin-permissions':            return <AdminPermissionsTree />;
      case 'admin-permissions-management': return <PermissionsPage />;
      case 'admin-gatekeeper-permissions': return <AdminGatekeeperPermissions />;
      case 'admin-reports':                return <ReportsPage />;
      case 'admin-settings':               return <SettingsPage />;
      case 'admin-audit-log':              return <AuditLogPage />;
      case 'admin-sops':                   return <AdminSOPsPage />;
      case 'admin-sops-reports':           return <AdminSOPsReport />;
      case 'admin-ai-config':              return <AIConfigPage />;
      case 'admin-attendance':             return <AttendancePage />;

      // ─── Developer ───────────────────────────────────────────
      case 'developer-dashboard':  return <DeveloperDashboard />;
      case 'developer-attendance': return <BiometricPage />;
      case 'developer-structure':  return <StructureManager />;

      // ─── Supervisor ──────────────────────────────────────────
      case 'supervisor-breaks':    return <SupervisorBreaksPage />;

      default: return <DefaultPage role={user?.role} />;
    }
  };

  return (
    <div className={`transition-all duration-300 min-h-screen pt-16 ${sidebarOpen ? 'lg:mr-64' : 'lg:mr-16'}`}>
      <main className="p-4 sm:p-6 min-h-[calc(100vh-64px)]">
        <Suspense fallback={<PageLoader />}>{renderPage()}</Suspense>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  App
// ════════════════════════════════════════════════════════════════

export default function App() {
  const { isAuthenticated, user, loading, initialize } = useAuthStore();
  const { setActiveView, sidebarOpen, setSidebarOpen } = useUIStore();
  const [showLogin, setShowLogin]       = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  // ✅ localStorage — يُحفَظ عبر الجلسات
  const [disclaimerPassed, setDisclaimerPassed] = useState(
    () => localStorage.getItem('disclaimer_passed') === 'true'
  );
  const [guidePassed, setGuidePassed] = useState(
    () => localStorage.getItem('guide_passed') === 'true'
  );

  const isPreviewMode = window.location.search.includes('preview=true');

  // ✅ Initialize + Timeout (10 ثواني)
  useEffect(() => {
    if (isPreviewMode) return;
    initialize();
    const timeout = setTimeout(() => {
      if (loading) setAuthTimedOut(true);
    }, 10_000);
    return () => clearTimeout(timeout);
  }, [isPreviewMode, initialize]);

  // ✅ Sidebar: مفتوح على الديسكتوب، مغلق على الموبايل
  useEffect(() => {
    setSidebarOpen(window.innerWidth >= 1024);
  }, [setSidebarOpen]);

  // ✅ إغلاق تلقائي عند تصغير النافذة
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  // ✅ View من URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'kiosk-mode') setActiveView('kiosk-mode');
  }, [setActiveView]);

  // ✅ الـ View الافتراضي حسب الدور
  useEffect(() => {
    if (!user) return;
    setActiveView(ROLE_DEFAULT_VIEW[user.role] ?? 'employee-dashboard');
  }, [user?.role, setActiveView]);

  // ─── Render Guards ───────────────────────────────────────────
  if (isPreviewMode) {
    return <><LandingPage onLoginClick={() => {}} /><ToastContainer /></>;
  }

  if (loading) {
    return <AuthLoader timedOut={authTimedOut} />;
  }

  if (!disclaimerPassed) {
    return (
      <DisclaimerPage
        onAccess={() => {
          setDisclaimerPassed(true);
          localStorage.setItem('disclaimer_passed', 'true');
        }}
      />
    );
  }

  if (!guidePassed) {
    return (
      <SystemGuide
        onSkip={() => {
          setGuidePassed(true);
          localStorage.setItem('guide_passed', 'true');
        }}
      />
    );
  }

  if (!isAuthenticated) {
    if (showLogin) return <><LoginPage onNavigate={() => {}} /><ToastContainer /></>;
    return <><LandingPage onLoginClick={() => setShowLogin(true)} /><ToastContainer /></>;
  }

  // ─── Main App ────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-slate-50"
      dir="rtl"
      style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif" }}
    >
      <Header />
      <Sidebar />

      {/* Backdrop معتم على الموبايل/التابلت */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <PageRenderer />
      <WelcomeModal />
      <ToastContainer />
    </div>
  );
}