export type UserRole = 'employee' | 'hr' | 'admin' | 'gatekeeper' | 'developer';
export type Rank = 'executive' | 'manager' | 'supervisor' | 'employee';
export type ManufacturingDept = 'syrups' | 'tablets' | 'ointments' | 'powders' | 'management' | 'hr' | 'it';
export type GatekeeperType = 'employee_movement' | 'visitor_movement' | 'both';

export interface User {
  id: string;
  // الاسم: full_name هو الحقل المعتمد في قاعدة البيانات (Supabase)،
  // و name يبقى اختيارياً للتوافق مع الكود القديم.
  full_name: string;
  name?: string;
  username?: string; // اسم المستخدم (للدخول المحلي)
  email: string;
  role: UserRole;
  rank?: Rank;
  manufacturingDept?: ManufacturingDept;
  department?: string;
  position?: string; // Job title e.g., Production Operator
  // الصورة: profile_image هو الحقل المعتمد، و avatar اختياري للتوافق القديم.
  profile_image?: string | null;
  avatar?: string | null;
  phone?: string | null;
  location?: string;
  joinDate?: string;
  employeeId?: string;
  status?: 'active' | 'inactive' | 'on_leave';
  manager?: string; // ID of the manager
  custom_permissions?: Record<string, boolean>;
  can_manage_breaks?: boolean;
  wellnessScore?: number;
  cv_data?: any;
  created_at?: string;
  gatekeeper_type?: GatekeeperType; // لتحديد نوع حركة الحارس (موظفين، زوار، أو كلاهما)
  permissions?: string[]; // مصفوفة الصلاحيات الديناميكية للشريط الجانبي
}


export type ProblemStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';
export type ProblemSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ProblemCategory = 'technical' | 'hr' | 'management' | 'workplace' | 'salary' | 'other';

export interface Problem {
  id: string;
  title: string;
  description: string;
  category: ProblemCategory;
  severity: ProblemSeverity;
  status: ProblemStatus;
  isAnonymous: boolean;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  aiAnalysis?: AIAnalysis;
  comments?: Comment[];
  timeline?: TimelineEvent[];
}

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  event: string;
  description: string;
  timestamp: string;
  actor: string;
  type: 'created' | 'updated' | 'commented' | 'resolved' | 'assigned';
}

export interface AIAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  urgencyLevel: number;
  suggestedActions: string[];
  summary: string;
  tags: string[];
  predictedResolutionTime: string;
}

export interface WellnessData {
  date: string;
  score: number;
  mood: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
  stress: number;
  energy: number;
  notes?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'rating' | 'text' | 'multiple_choice' | 'yes_no';
  options?: string[];
  required: boolean;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  deadline: string;
  isCompleted: boolean;
}

export interface DepartmentStats {
  name: string;
  employeeCount: number;
  problemCount: number;
  resolvedCount: number;
  wellnessAvg: number;
  satisfactionScore: number;
}

export interface Analytics {
  totalEmployees: number;
  activeProblems: number;
  resolvedThisMonth: number;
  avgResolutionTime: number;
  wellnessScore: number;
  satisfactionRate: number;
  departmentStats: DepartmentStats[];
  monthlyTrend: { month: string; problems: number; resolved: number }[];
  categoryBreakdown: { category: string; count: number; percentage: number }[];
  severityBreakdown: { severity: string; count: number }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  actorRole: UserRole;
  target: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  passcode?: string; // Private key for login
  role: UserRole;
  rank: Rank;
  manufacturingDept: ManufacturingDept;
  department: string;
  position: string;
  phone: string;
  location: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'on_leave';
  salary?: number;
  manager?: string; // ID of the manager
  custom_permissions?: Record<string, boolean>;
  wellnessScore: number;
  problemsCount: number;
  profileImage?: string;
  certificateImage?: string;
}
