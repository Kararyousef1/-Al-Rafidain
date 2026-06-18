// ── أنواع نظام الاختبارات الذكية ──

export type DifficultyLevel = 'مبتدئ' | 'متوسط' | 'متقدم' | 'خبير';
export type QuizType = 'ai_generated' | 'manual';
export type QuizStatus = 'draft' | 'active' | 'archived';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
  difficulty: DifficultyLevel;
  points: number;
  timeLimit?: number; // seconds
}

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description: string;
  type: QuizType;
  status: QuizStatus;
  questions: QuizQuestion[];
  difficulty: DifficultyLevel;
  passingScore: number; // percentage
  timeLimit?: number; // total minutes
  attemptsAllowed: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  employee_id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  answers: { questionId: string; selectedAnswer: number; timeSpent: number }[];
  startedAt: string;
  completedAt: string;
  timeSpent: number; // seconds
  suspiciousFlags: SuspiciousFlag[];
  passed: boolean;
}

export interface SuspiciousFlag {
  type: 'too_fast' | 'too_slow' | 'pattern_matching' | 'multiple_attempts';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: string;
}

export interface AIQuizRequest {
  courseContent: string; // full course content
  courseTitle: string;
  difficulty: DifficultyLevel;
  numberOfQuestions: number;
  language: 'ar' | 'en';
}

export interface AIQuizResponse {
  questions: Omit<QuizQuestion, 'id'>[];
  summary: string;
  estimatedTimeMinutes: number;
}