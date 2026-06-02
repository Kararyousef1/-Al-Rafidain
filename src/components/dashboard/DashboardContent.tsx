import { useUIStore } from '../../store';

// Employee Pages
import EmployeeDashboard from '../../pages/employee/EmployeeDashboard';
import ProblemsList from '../../pages/employee/ProblemsList';
import WellnessPage from '../../pages/employee/WellnessPage';
import SurveyPage from '../../pages/employee/SurveyPage';
import TrainingPage from '../../pages/employee/TrainingPage';
import AIChatPage from '../../pages/employee/AIChatPage';
import ContactPage from '../../pages/employee/ContactPage';
import ProfilePage from '../../pages/employee/ProfilePage';
import NewProblemPage from '../../pages/employee/NewProblemPage';
import ProblemDetail from '../../pages/employee/ProblemDetail';

// HR Pages
import HRDashboard from '../../pages/hr/HRDashboard';
import HRCommunicationPage from '../../pages/hr/HRCommunicationPage';
import ReportsPage from '../../pages/hr/ReportsPage';
import AnalyticsPage from '../../pages/hr/AnalyticsPage';
import TeamPage from '../../pages/hr/TeamPage';
import TalentMarketPage from '../../pages/hr/TalentMarketPage';

// Gatekeeper & Standalone Pages (Corrected Paths)
import GatekeeperPage from '../../pages/gatekeeper/GatekeeperPage';
import MovementAnalysisPage from '../../pages/gatekeeper/MovementAnalysisPage';
import KioskPage from '../../pages/KioskPage';

// Admin & Dev Pages
import DeveloperDashboard from './DeveloperDashboard';

const viewMap: Record<string, React.ReactNode> = {
  // Employee
  'employee-dashboard': <EmployeeDashboard />,
  'employee-problems': <ProblemsList />,
  'new-problem': <NewProblemPage />,
  'employee-wellness': <WellnessPage />,
  'employee-survey': <SurveyPage />,
  'employee-training': <TrainingPage />,
  'employee-ai-chat': <AIChatPage />,
  'employee-contact': <ContactPage />,
  'employee-profile': <ProfilePage />,

  // HR
  'hr-dashboard': <HRDashboard />,
  'hr-problems': <ProblemsList isHR />,
  'hr-movement-analysis': <MovementAnalysisPage />,
  'hr-communication': <HRCommunicationPage />,
  'hr-reports': <ReportsPage />,
  'hr-analytics': <AnalyticsPage />,
  'hr-team': <TeamPage />,
  'hr-talent-market': <TalentMarketPage />,

  // Standalone Portals
  'gatekeeper-portal': <GatekeeperPage />,
  'kiosk-mode': <KioskPage />,

  // Developer
  'developer-dashboard': <DeveloperDashboard />,
};

export default function DashboardContent() {
  const { activeView } = useUIStore();

  // Logic to extract problem ID
  const problemId = activeView.startsWith('problem-detail-') ? activeView.split('problem-detail-')[1] : null;
  if (problemId) {
    return <ProblemDetail problemId={problemId} />;
  }

  // Return the component from the map, or a default if not found
  return viewMap[activeView] || <EmployeeDashboard />;
}