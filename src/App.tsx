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
 *  ════════════════════════════════════════════════════════════════
 */

import { useEffect, Suspense, lazy, useState } from 'react';
import { useAuthStore, useUIStore } from './store';
import ToastContainer from './components/ui/Toast';
import Sidebar from './components/dashboard/Sidebar';
import Header from './components/dashboard/Header';
import LoginPage from './pages/auth/LoginPage';
import LandingPage from './pages/public/LandingPage';
import DisclaimerPage from './pages/public/DisclaimerPage';
import SystemGuide from './pages/public/SystemGuide';
import NotificationsPage from './pages/public/NotificationsPage';
import MyNotificationsPage from './pages/public/MyNotificationsPage';
import WelcomeModal from './components/dashboard/WelcomeModal';

const StructureManager = lazy(() => import('./components/dashboard/developer').then(m => ({ default: m.StructureManager })));
const BiometricPage = lazy(() => import('./components/dashboard/developer').then(m => ({ default: m.BiometricSettings })));

const EmployeeDashboard = lazy(() => import('./pages/employee/EmployeeDashboard'));
const ProblemsList      = lazy(() => import('./pages/employee/ProblemsList'));
const ProblemDetail     = lazy(() => import('./pages/employee/ProblemDetail'));
const NewProblemPage    = lazy(() => import('./pages/employee/NewProblemPage'));
const WellnessPage      = lazy(() => import('./pages/employee/WellnessPage'));
const AIChatPage        = lazy(() => import('./pages/employee/AIChatPage'));
const SurveyPage        = lazy(() => import('./pages/employee/SurveyPage'));
const ProfilePage       = lazy(() => import('./pages/employee/ProfilePage'));
const ContactPage       = lazy(() => import('./pages/employee/ContactPage'));
const TrainingPage      = lazy(() => import('./pages/employee/TrainingPage'));
const TrainingManagementPage = lazy(() => import('./pages/hr/TrainingManagementPage'));
const TrainingReportsPage = lazy(() => import('./pages/hr/TrainingReportsPage'));
const SOPsPage          = lazy(() => import('./pages/employee/SOPsPage'));
const HRDashboard       = lazy(() => import('./pages/hr/HRDashboard'));
const AnalyticsPage     = lazy(() => import('./pages/hr/AnalyticsPage'));
const TeamPage          = lazy(() => import('./pages/hr/TeamPage'));
const ReportsPage       = lazy(() => import('./pages/hr/ReportsPage'));
const AttendancePage    = lazy(() => import('./pages/hr/AttendancePage'));
const TalentMarketPage  = lazy(() => import('./pages/hr/TalentMarketPage'));
const KioskPage         = lazy(() => import('./pages/hr/KioskPage'));
const HRMovementAnalyticsPage = lazy(() => import('./pages/hr/HRMovementAnalyticsPage'));
const GatekeeperPage    = lazy(() => import('./pages/gatekeeper/GatekeeperPage'));
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminEmployeesPage = lazy(() => import('./pages/admin/AdminEmployeesPage'));
const AdminPermissionsTree = lazy(() => import('./pages/admin/AdminPermissionsTree'));
const AuditLogPage      = lazy(() => import('./pages/admin/AuditLogPage'));
const SettingsPage      = lazy(() => import('./pages/admin/SettingsPage'));
const AIConfigPage      = lazy(() => import('./pages/admin/AIConfigPage'));
const AdminLandingPageCMS = lazy(() => import('./pages/admin/AdminLandingPageCMS'));
const AdminGatekeeperPermissions = lazy(() => import('./pages/admin/AdminGatekeeperPermissions'));
const AdminSOPsPage     = lazy(() => import('./pages/admin/AdminSOPsPage'));
const AdminSOPsReport   = lazy(() => import('./pages/admin/AdminSOPsReport'));
const SupervisorBreaksPage = lazy(() => import('./pages/supervisor/SupervisorBreaksPage'));
const DeveloperDashboard = lazy(() => import('./components/dashboard/DeveloperDashboard'));
const MyAttendancePage = lazy(() => import('./pages/employee/MyAttendancePage'));
const LeaveRequestPage = lazy(() => import('./pages/employee/LeaveRequestPage'));
const PermissionsPage = lazy(() => import('./pages/employee/PermissionsPage'));
const ManagerAttendancePage = lazy(() => import('./pages/manager/ManagerAttendancePage'));
const AIInsightsDashboard = lazy(() => import('./pages/employee/AIInsightsDashboard'));

// ════════════════════════════════════════════════════════════════
//  Loaders
// ════════════════════════════════════════════════════════════════

const SPIN_CSS = `@keyframes spin{to{transform:rotate(360deg)}}@keyframes prog{from{width:15%}to{width:85%}}`;

function PageLoader() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'16px' }}>
      <div style={{ width:'36px', height:'36px', border:'3px solid #e2e8f0', borderTopColor:'#4f46e5', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <p style={{ color:'#94a3b8', fontSize:'0.875rem' }}>جاري التحميل...</p>
      <style>{SPIN_CSS}</style>
    </div>
  );
}

function AuthLoader({ timedOut }: { timedOut?: boolean }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#f8fafc', flexDirection:'column', gap:'20px' }}>
      <style>{SPIN_CSS}</style>
      <div style={{ width:'56px', height:'56px', border:'3px solid #e2e8f0', borderTopColor:'#4f46e5', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      
      {/* شريط التقدم */}
      <div style={{ width:'200px', height:'4px', background:'#e2e8f0', borderRadius:'2px', overflow:'hidden' }}>
        <div style={{ height:'100%', background:'#4f46e5', borderRadius:'2px', animation:'prog 2s ease-in-out infinite alternate' }} />
      </div>

      <p style={{ color:'#64748b', fontSize:'0.9rem' }}>
        {timedOut ? '⚠️ استغرق الاتصال وقتاً طويلاً — يرجى التحقق من الاتصال بالإنترنت' : 'جاري التحقق من الجلسة...'}
      </p>
      
      {timedOut && (
        <button
          onClick={() => window.location.reload()}
          style={{ padding:'8px 20px', background:'#4f46e5', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'0.875rem' }}
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

function DefaultPage({ role }: { role?: string }) {
  if (role === 'developer') return <DeveloperDashboard />;
  if (role === 'hr') return <HRDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'gatekeeper') return <GatekeeperPage />;
  return <EmployeeDashboard />;
}

// ════════════════════════════════════════════════════════════════
//  Page Renderer
// ════════════════════════════════════════════════════════════════

function PageRenderer() {
  const { activeView, sidebarOpen } = useUIStore();
  const { user } = useAuthStore();

  const renderPage = () => {
    if (activeView.startsWith('problem-detail-')) {
      const id = activeView.replace('problem-detail-', '');
      return <ProblemDetail problemId={id} />;
    }
    switch (activeView) {
      case 'my-notifications': return <MyNotificationsPage />;
      case 'notifications': return <NotificationsPage />;
      case 'employee-dashboard': return <EmployeeDashboard />;
      case 'employee-problems': return <ProblemsList isHR={false} />;
      case 'new-problem': return <NewProblemPage />;
      case 'employee-wellness': return <WellnessPage />;
      case 'employee-ai-chat': return <AIChatPage />;
      case 'employee-survey': return <SurveyPage />;
      case 'employee-training': return <TrainingPage />;
      case 'employee-sops': return <SOPsPage />;
      case 'employee-profile': return <ProfilePage />;
      case 'employee-contact': return <ContactPage />;
      case 'employee-attendance': return <MyAttendancePage />;
      case 'employee-leave-requests': return <LeaveRequestPage />;
      case 'employee-permissions': return <PermissionsPage />;
      case 'employee-leaves': return <LeaveRequestPage />;
      case 'kiosk-mode': return <KioskPage />;
      case 'manager-dashboard': return <HRDashboard />;
      case 'manager-attendance': return <ManagerAttendancePage />;
      case 'manager-leave-requests': return <LeaveRequestPage />;
      case 'manager-permissions': return <PermissionsPage />;
      case 'hr-dashboard': return <HRDashboard />;
      case 'hr-leave-requests': return <LeaveRequestPage />;
      case 'hr-permissions': return <PermissionsPage />;
      case 'admin-permissions-management': return <PermissionsPage />;
      case 'supervisor-leave-requests': return <LeaveRequestPage />;
      case 'supervisor-permissions': return <PermissionsPage />;
      case 'admin-attendance': return <AttendancePage />;
      case 'admin-ai-insights': case 'hr-ai-insights': return <AIInsightsDashboard />;
      case 'hr-problems': return <ProblemsList isHR={true} />;
      case 'hr-analytics': case 'hr-sentiment': case 'hr-predictions': return <AnalyticsPage />;
      case 'hr-team': return <TeamPage />;
      case 'hr-talent-market': return <TalentMarketPage />;
      case 'hr-attendance': return <AttendancePage />;
      case 'hr-communication': return <ContactPage />;
      case 'hr-reports': return <ReportsPage />;
      case 'hr-movement-analysis': return <HRMovementAnalyticsPage />;
      case 'hr-manage-training': return <TrainingManagementPage />;
      case 'hr-training-reports': return <TrainingReportsPage />;
      case 'gatekeeper': case 'hr-movements': case 'movements': case 'employee-movements': case 'gatekeeper-page': case 'gatekeeper-portal': return <GatekeeperPage />;
      case 'admin-dashboard': return <AdminDashboard />;
      case 'admin-cms': return <AdminLandingPageCMS />;
      case 'admin-employees': return <AdminEmployeesPage />;
      case 'admin-permissions': return <AdminPermissionsTree />;
      case 'admin-gatekeeper-permissions': return <AdminGatekeeperPermissions />;
      case 'admin-reports': return <ReportsPage />;
      case 'admin-settings': return <SettingsPage />;
      case 'admin-audit-log': return <AuditLogPage />;
      case 'admin-sops': return <AdminSOPsPage />;
      case 'admin-sops-reports': return <AdminSOPsReport />;
      case 'admin-ai-config': return <AIConfigPage />;
      case 'developer-dashboard': return <DeveloperDashboard />;
      case 'developer-attendance': return <BiometricPage />;
      case 'developer-structure': return <StructureManager />;
      case 'supervisor-breaks': return <SupervisorBreaksPage />;
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
  const { activeView, setActiveView, sidebarOpen, setSidebarOpen } = useUIStore();
  const [showLogin, setShowLogin] = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  // ✅ localStorage بدلاً من sessionStorage — يُحفَظ عبر الجلسات
  const [disclaimerPassed, setDisclaimerPassed] = useState(
    () => localStorage.getItem('disclaimer_passed') === 'true'
  );
  const [guidePassed, setGuidePassed] = useState(
    () => localStorage.getItem('guide_passed') === 'true'
  );

  const isPreviewMode = window.location.search.includes('preview=true');

  // ✅ Timeout للـ initialize (10 ثواني)
  useEffect(() => {
    if (isPreviewMode) return;
    initialize();

    const timeout = setTimeout(() => {
      if (loading) setAuthTimedOut(true);
    }, 10_000);

    return () => clearTimeout(timeout);
  }, [isPreviewMode, initialize]);

  // ✅ ضبط الـ Sidebar: مفتوح على الديسكتوب، مغلق على الموبايل
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'kiosk-mode') setActiveView('kiosk-mode');
  }, [setActiveView]);

  useEffect(() => {
    if (!user) return;
    const views: Record<string, string> = {
      developer: 'developer-dashboard', hr: 'hr-dashboard', admin: 'admin-dashboard',
      employee: 'employee-dashboard', gatekeeper: 'gatekeeper-portal',
      supervisor: 'employee-dashboard', manager: 'manager-dashboard',
    };
    setActiveView(views[user.role] ?? 'employee-dashboard');
  }, [user?.role, setActiveView]);

  if (isPreviewMode) return <><LandingPage onLoginClick={() => {}} /><ToastContainer /></>;
  if (loading) return <AuthLoader timedOut={authTimedOut} />;

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

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl" style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif" }}>
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