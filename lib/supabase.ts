import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserProfile = {
  id: string
  email: string
  name: string
  role: 'student' | 'institute'
  character_id: number
  xp_points: number
  level: number
  streak_days: number
  last_active_date: string | null
  badges: string[]
  institute_id: string | null
  daily_goal_questions: number
  daily_completed_today: number
  goal_last_reset_date: string | null
  exam_type: 'JEE' | 'NEET' | null
}

export type Question = {
  id: string
  subject: string
  topic: string
  subtopic: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  difficulty: string
  explanation: string
  tags: string[]
}

export type Test = {
  id: string
  created_by: string | null
  title: string
  subject: string
  total_questions: number
  duration_minutes: number
  is_smart_test: boolean
  assigned_to_institute: string | null
  created_at: string
}

export type Attempt = {
  id: string
  user_id: string
  test_id: string
  started_at: string
  submitted_at: string | null
  total_score: number | null
  status: 'ongoing' | 'submitted'
}

export type QuestionResponse = {
  id: string
  attempt_id: string
  question_id: string
  selected_option: string | null
  is_correct: boolean | null
  time_taken_seconds: number
  was_skipped: boolean
  response_pattern: string | null
  ai_feedback: string | null
  mind_map_json: object | null
  understood: boolean
}

export type TopicPerformance = {
  id: string
  user_id: string
  subject: string
  topic: string
  total_attempted: number
  total_correct: number
  avg_time_seconds: number
  last_updated: string
}
