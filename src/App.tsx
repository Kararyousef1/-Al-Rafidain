import { useEffect, Suspense, lazy, useState } from 'react';
import { useAuthStore, useUIStore } from './store';
import ToastContainer from './components/ui/Toast';
import Sidebar from './components/dashboard/Sidebar';
import Header from './components/dashboard/Header';
import LoginPage from './pages/auth/LoginPage';
import LandingPage from './pages/public/LandingPage';

// ─── Lazy Loading لتسريع أول تحميل ───
// Employee
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
const SOPsPage          = lazy(() => import('./pages/employee/SOPsPage'));

// HR
const HRDashboard    = lazy(() => import('./pages/hr/HRDashboard'));
const AnalyticsPage  = lazy(() => import('./pages/hr/AnalyticsPage'));
const TeamPage       = lazy(() => import('./pages/hr/TeamPage'));
const ReportsPage    = lazy(() => import('./pages/hr/ReportsPage'));
const AttendancePage = lazy(() => import('./pages/hr/AttendancePage'));
const TalentMarketPage = lazy(() => import('./pages/hr/TalentMarketPage'));
const KioskPage      = lazy(() => import('./pages/hr/KioskPage'));
const HRMovementAnalyticsPage = lazy(() => import('./pages/hr/HRMovementAnalyticsPage'));

// Gatekeeper (لوحة الحركة)
const GatekeeperPage = lazy(() => import('./pages/gatekeeper/GatekeeperPage'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminEmployeesPage = lazy(() => import('./pages/admin/AdminEmployeesPage'));
const AdminPermissionsTree = lazy(() => import('./pages/admin/AdminPermissionsTree'));
const AuditLogPage   = lazy(() => import('./pages/admin/AuditLogPage'));
const SettingsPage   = lazy(() => import('./pages/admin/SettingsPage'));
const AIConfigPage   = lazy(() => import('./pages/admin/AIConfigPage'));
const AdminLandingPageCMS = lazy(() => import('./pages/admin/AdminLandingPageCMS'));
const AdminGatekeeperPermissions = lazy(() => import('./pages/admin/AdminGatekeeperPermissions'));
const AdminSOPsPage = lazy(() => import('./pages/admin/AdminSOPsPage'));
const AdminSOPsReport = lazy(() => import('./pages/admin/AdminSOPsReport'));

// Supervisor
const SupervisorBreaksPage = lazy(() => import('./pages/supervisor/SupervisorBreaksPage'));

// Developer
const DeveloperDashboard = lazy(() => import('./components/dashboard/DeveloperDashboard'));

// ─── شاشة التحميل ───
function PageLoader() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: '16px',
    }}>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid #e2e8f0',
        borderTopColor: '#4f46e5',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontFamily: "'Tajawal', sans-serif" }}>
        جاري التحميل...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── الصفحة الافتراضية حسب الدور ───
function DefaultPage({ role }: { role?: string }) {
  if (role === 'developer') return <DeveloperDashboard />;
  if (role === 'hr')    return <HRDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'gatekeeper') return <GatekeeperPage />;
  return <EmployeeDashboard />;
}

// ─── عارض الصفحات ───
function PageRenderer() {
  const { activeView, sidebarOpen } = useUIStore();
  const { user } = useAuthStore();

  const renderPage = () => {
    // تفاصيل المشكلة بمعرّف ديناميكي
    if (activeView.startsWith('problem-detail-')) {
      const id = activeView.replace('problem-detail-', '');
      return <ProblemDetail problemId={id} />;
    }

    switch (activeView) {
      // ── Employee ──
      case 'employee-dashboard': return <EmployeeDashboard />;
      case 'employee-problems':  return <ProblemsList isHR={false} />;
      case 'new-problem':        return <NewProblemPage />;
      case 'employee-wellness':  return <WellnessPage />;
      case 'employee-ai-chat':   return <AIChatPage />;
      case 'employee-survey':    return <SurveyPage />;
      case 'employee-training':  return <TrainingPage />;
      case 'employee-sops':      return <SOPsPage />;
      case 'employee-profile':   return <ProfilePage />;
      case 'employee-contact':   return <ContactPage />;

      // ── HR ──
      case 'hr-dashboard':     return <HRDashboard />;
      case 'hr-problems':      return <ProblemsList isHR={true} />;
      case 'hr-analytics':
      case 'hr-sentiment':
      case 'hr-predictions':   return <AnalyticsPage />;
      case 'hr-team':          return <TeamPage />;
      case 'hr-talent-market': return <TalentMarketPage />;
      case 'hr-attendance':    return <AttendancePage />;
      case 'hr-communication': return <ContactPage />;
      case 'hr-reports':       return <ReportsPage />;
      case 'hr-movement-analysis': return <HRMovementAnalyticsPage />;
      case 'gatekeeper':
      case 'hr-movements':
      case 'movements':
      case 'employee-movements':
      case 'gatekeeper-page':  
      case 'gatekeeper-portal': return <GatekeeperPage />;

      // ── Admin ──
      case 'admin-dashboard':  return <AdminDashboard />;
      case 'admin-cms':        return <AdminLandingPageCMS />;
      case 'admin-employees':  return <AdminEmployeesPage />;
      case 'admin-permissions': return <AdminPermissionsTree />;
      case 'admin-gatekeeper-permissions': return <AdminGatekeeperPermissions />;
      case 'admin-reports':    return <ReportsPage />;
      case 'admin-settings':   return <SettingsPage />;
      case 'admin-audit-log':  return <AuditLogPage />;
      case 'admin-sops':         return <AdminSOPsPage />;
      case 'admin-sops-reports': return <AdminSOPsReport />;
      case 'admin-ai-config':  return <AIConfigPage />;

      // ── Developer ──
      case 'developer-dashboard': return <DeveloperDashboard />;

      // ── Supervisor ──
      case 'supervisor-breaks': return <SupervisorBreaksPage />;

      default: return <DefaultPage role={user?.role} />;
    }
  };

  return (
    <div className={`transition-all duration-300 min-h-screen md:pt-16 pt-0 ${sidebarOpen ? 'md:mr-64' : 'md:mr-16'} mr-0`}>
      <main className="p-4 sm:p-6 min-h-[calc(100vh-64px)]">
        <Suspense fallback={<PageLoader />}>
          {renderPage()}
        </Suspense>
      </main>
    </div>
  );
}

// ─── شاشة التحقق من الجلسة ───
function AuthLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#f8fafc', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '48px', height: '48px',
        border: '3px solid #e2e8f0',
        borderTopColor: '#4f46e5',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ color: '#64748b', fontFamily: "'Tajawal', sans-serif" }}>
        جاري التحقق من الجلسة...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── التطبيق الرئيسي ───
export default function App() {
  const { isAuthenticated, user, loading, initialize } = useAuthStore();
  const { activeView, setActiveView, sidebarOpen } = useUIStore();
  const [showLogin, setShowLogin] = useState(false);
  
  const isPreviewMode = window.location.search.includes('preview=true');

  // تهيئة المصادقة عند بدء التشغيل
  useEffect(() => {
    if (!isPreviewMode) {
      initialize();
    }
  }, [isPreviewMode, initialize]);

  // قراءة الرابط المباشر للسماح بالدخول للبوابات المستقلة فوراً
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'kiosk-mode') {
      setActiveView(viewParam);
    }
  }, [setActiveView]);

  // تعيين الصفحة الافتراضية حسب دور المستخدم
  useEffect(() => {
    if (!user) return;
    const defaultViews: Record<string, string> = {
      developer: 'developer-dashboard',
      hr:       'hr-dashboard',
      admin:    'admin-dashboard',
      employee: 'employee-dashboard',
      gatekeeper: 'gatekeeper-portal',
    };
    setActiveView(defaultViews[user.role] ?? 'employee-dashboard');
  }, [user?.role, setActiveView]);

  // ─── مزامنة الواجهة مع زر العودة في المتصفح ───
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setActiveView(event.state.view);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setActiveView]);

  useEffect(() => {
    if (!window.history.state?.view) {
      window.history.replaceState({ view: activeView }, '', `?view=${activeView}`);
    } else if (window.history.state.view !== activeView) {
      window.history.pushState({ view: activeView }, '', `?view=${activeView}`);
    }
  }, [activeView]);

  // وضع المعاينة (يتم عرضه داخل iframe من صفحة الإدارة)
  if (isPreviewMode) {
    return (
      <>
        <LandingPage onLoginClick={() => {}} />
        <ToastContainer />
      </>
    );
  }

  // شاشة التحميل أثناء التحقق
  if (loading) return <AuthLoader />;

  // صفحة تسجيل الدخول أو الصفحة الرئيسية العامة
  if (!isAuthenticated) {
    if (showLogin) {
      return (
        <>
          <LoginPage onNavigate={() => {}} />
          <ToastContainer />
        </>
      );
    }
    return (
      <>
        <LandingPage onLoginClick={() => setShowLogin(true)} />
        <ToastContainer />
      </>
    );
  }

  // الشاشات المستقلة (الكشك وبوابة التصنيع) تُعرض بملء الشاشة بدون شريط جانبي
  if (activeView === 'kiosk-mode') {
    return (
      <Suspense fallback={<PageLoader />}>
        <KioskPage />
        <ToastContainer />
      </Suspense>
    );
  }

  // لوحة التحكم الرئيسية
  return (
    <div
      className="min-h-screen bg-slate-50"
      dir="rtl"
      style={{ fontFamily: "'Tajawal', 'Cairo', sans-serif" }}
    >
      <style>{`
        /* جعل الشريط العلوي يتحرك مع الصفحة ويأخذ العرض بالكامل على الهواتف */
        @media (max-width: 768px) {
          header, .header { 
            position: relative !important; 
            z-index: 10; 
            width: 100% !important; 
            right: 0 !important; 
            margin-right: 0 !important; 
          }
        }
      `}</style>
      <div className={sidebarOpen ? 'block relative z-[100]' : 'hidden md:block'}>
        <Sidebar />
      </div>
      <Header />
      <PageRenderer />
      <ToastContainer />
    </div>
  );
}
