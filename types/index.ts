export type UserRole = 'student' | 'corporate_admin';
export type ViewMode = 'student' | 'corporate_admin' | 'teacher';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company?: string;
  avatar_url?: string;
  organization_id?: string | null;
  is_premium: boolean;
  is_subscribed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  paystack_reference: string | null;
  paystack_customer_code: string | null;
  paystack_authorization_code: string | null;
  status: 'pending' | 'active' | 'canceled' | 'expired';
  amount: number | null;
  currency: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  price: number | null;
  level: string;
  duration_hours?: number;
  instructor?: string;
  thumbnail_color?: string;
  is_published: boolean;
  is_pro?: boolean;
  tier?: string;
  created_by: string | null;
  created_at: string;
  modules?: Module[];
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  enrolled_at: string;
  completed_at: string | null;
  course?: Course;
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  is_free_preview: boolean;
  image_url?: string | null;
  created_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content_markdown: string | null;
  code_snippet: string | null;
  order_index: number | null;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: number;
  course_id: number;
  completed: boolean;
  completed_at: string | null;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  category: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  questions: AssessmentQuestion[];
  time_limit_minutes: number;
  is_published: boolean;
  created_by: string;
  created_at: string;
}

export interface AssessmentResult {
  id: string;
  user_id: string;
  assessment_id: string;
  score: number;
  total_questions: number;
  answers: { question_id: string; selected: number; correct: boolean }[];
  passed: boolean;
  time_spent_seconds: number;
  taken_at: string;
  assessment?: Assessment;
}

export interface TutorMessage {
  role: 'user' | 'tutor';
  content: string;
  timestamp: string;
}

export interface TutorSession {
  id: string;
  user_id: string;
  title: string;
  topic: string;
  messages: TutorMessage[];
  created_at: string;
  updated_at: string;
}

export interface LanguageProgress {
  id: string;
  user_id: string;
  language: string;
  proficiency_level: number;
  words_learned: number;
  lessons_completed: number;
  streak_days: number;
  last_studied_at: string | null;
  xp_points: number;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface TeamLicense {
  id: string;
  admin_user_id: string;
  seats: number;
  amount_paid: number;
  paystack_reference: string | null;
  invite_code: string;
  status: 'active' | 'expired' | 'canceled';
  created_at: string;
}
