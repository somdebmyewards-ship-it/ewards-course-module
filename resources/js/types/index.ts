// F4: Shared TypeScript interfaces for the eWards Learning Hub

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'TRAINER' | 'CASHIER' | 'CLIENT';
  approved: boolean;
  points: number;
  merchant_id?: number | null;
  outlet_id?: number | null;
  designation?: string | null;
  merchant_name_entered?: string | null;
  outlet_name_entered?: string | null;
  created_at: string;
}

export interface TrainingModule {
  id: number;
  title: string;
  slug: string;
  description: string;
  icon?: string | null;
  display_order: number;
  video_url?: string | null;
  image_urls?: string[] | null;
  document_urls?: string[] | null;
  points_reward: number;
  estimated_minutes?: number | null;
  is_published: boolean;
  quiz_enabled: boolean;
  certificate_enabled: boolean;
  require_help_viewed: boolean;
  require_checklist: boolean;
  require_quiz: boolean;
  page_route?: string | null;
  sections?: TrainingSection[];
  checklists?: ChecklistItem[];
  quizzes?: QuizQuestion[];
  sections_count?: number;
  checklists_count?: number;
  quizzes_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingSection {
  id: number;
  module_id: number;
  title: string;
  body: string;
  content_type?: string | null;
  media_url?: string | null;
  display_order: number;
  key_takeaway?: string | null;
  is_required?: boolean;
}

export interface ChecklistItem {
  id: number;
  module_id: number;
  label: string;
  display_order: number;
}

export interface QuizQuestion {
  id: number;
  module_id: number;
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
  display_order: number;
}

export interface ModuleProgress {
  module_id: number;
  slug: string;
  title: string;
  icon?: string | null;
  help_viewed: boolean;
  checklist_completed: boolean;
  quiz_completed: boolean;
  quiz_score: number;
  module_completed: boolean;
  last_section_id?: number | null;
}

export interface ProgressResponse {
  modules: ModuleProgress[];
  completed: number;
  total: number;
  percentage: number;
  certified: boolean;
}

export interface Bookmark {
  id: number;
  user_id: number;
  module_id: number;
  section_id?: number | null;
  module?: { id: number; title: string; slug: string; icon?: string };
  section?: { id: number; title: string; display_order: number };
  created_at: string;
}

export interface Certificate {
  id: number;
  issued_at: string;
  certificate_type: 'module' | 'path' | 'expert';
  certificate_code: string;
  module_id?: number | null;
}

export interface QuizResult {
  question_id: number;
  question: string;
  options: string[];
  user_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation?: string | null;
}

export interface QuizSubmitResponse {
  score: number;
  passed: boolean;
  correct: number;
  total: number;
  results: QuizResult[];
  module_completed: boolean;
  quiz_bonus_points: number;
  achievement?: Achievement;
}

export interface Achievement {
  title: string;
  message: string;
  points_earned: number;
  module_points: number;
  quiz_bonus: number;
  certificate_unlocked: boolean;
  level_up: boolean;
  new_level: string;
  total_points: number;
  share_text: string;
}

export interface ModuleFeedback {
  id: number;
  user_id: number;
  module_id: number;
  rating: number;
  comment?: string | null;
  improvement_suggestion?: string | null;
}

export interface SectionView {
  user_id: number;
  section_id: number;
  module_id: number;
  viewed_at: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
