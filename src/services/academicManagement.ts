import { supabase } from './supabase';

export interface AcademicSession {
  id: string;
  name: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

export interface AcademicProgram {
  id: string;
  session_id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface AcademicSubject {
  id: string;
  program_id: string;
  teacher_id?: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface AcademicResource {
  id: string;
  subject_id: string;
  program_id?: string;
  title: string;
  file_url: string;
  file_type: 'pdf' | 'doc' | 'slide' | 'video' | 'link';
  created_at?: string;
}

export interface SchemeEntry {
  id: string;
  session: string;
  program: string;
  subject: string;
  part?: number;
  week_no?: number;
  month?: string;
  topic: string;
  status: 'Proposed' | 'Upcoming' | 'Completed';
  description?: string;
  reschedule_reason?: string;
  new_date?: string;
  is_rescheduled?: boolean;
  teacher_id?: number | string;
  class_section?: string;
  scheduled_date?: string;
}

export interface AcademicQuiz {
  id: string;
  scheme_of_study_id: string;
  title: string;
  questions: {
    q: string;
    o: string[];
    c: number;
  }[];
  points: number;
  created_at?: string;
}

export interface QuizResult {
  id: string;
  quiz_id: string;
  student_roll_no: string;
  score: number;
  total_questions: number;
  answers: Record<number, number>;
  created_at?: string;
}
