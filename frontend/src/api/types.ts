export type UserRole = 'student' | 'teacher' | 'admin'
export type EventType = 'exam' | 'assignment' | 'event'

export interface UserResponse {
  id: string
  name: string
  email: string
  role: UserRole
}

export interface DisciplineResponse {
  id: string
  name: string
  code: string
}

export interface TeacherResponse {
  id: string
  user_id: string
  registration: string
}

export interface StudentResponse {
  id: string
  user_id: string
  registration: string
}

export interface SchoolClassResponse {
  id: string
  name: string
  year: string
  passing_average: number
  discipline_id: string
  teacher_id: string | null
}

export interface StudentEnrollmentResponse extends StudentResponse {
  enrollment_id: string
}

export interface SchoolClassDetailResponse {
  id: string
  name: string
  year: string
  passing_average: number
  discipline: DisciplineResponse
  teacher: TeacherResponse | null
  students: StudentEnrollmentResponse[]
}

export interface EnrollmentResponse {
  id: string
  student_id: string
  class_id: string
}

export interface NoticeResponse {
  id: string
  title: string
  content: string
  class_id: string | null
  author_id: string
  created_at: string
}

export interface NotificationResponse {
  id: string
  message: string
  reference_type: string
  reference_id: string
  read: boolean
  created_at: string
}

export interface CalendarEventResponse {
  id: string
  title: string
  description: string | null
  event_type: EventType
  event_date: string
  class_id: string | null
  created_by: string
  created_at: string
}

export interface GradeResponse {
  id: string
  enrollment_id: string
  value: number
  term: string
  description: string | null
  created_at: string
}

export interface AttendanceResponse {
  id: string
  enrollment_id: string
  class_date: string
  present: boolean
  created_at: string
}

export interface AssignmentResponse {
  id: string
  class_id: string
  title: string
  description: string | null
  due_date: string
  accepts_submissions: boolean
  created_by: string
  created_at: string
}

export interface SubmissionResponse {
  id: string
  assignment_id: string
  student_id: string
  content: string
  submitted_at: string
}

export interface SearchResponse {
  students: StudentResponse[]
  teachers: TeacherResponse[]
  classes: SchoolClassResponse[]
  disciplines: DisciplineResponse[]
}

export interface StudentDashboard {
  enrolled_classes: SchoolClassResponse[]
  unread_notifications: number
  upcoming_events: CalendarEventResponse[]
}

export interface TeacherDashboard {
  teaching_classes: SchoolClassResponse[]
  unread_notifications: number
  upcoming_events: CalendarEventResponse[]
}

export interface AdminDashboard {
  total_students: number
  total_teachers: number
  total_classes: number
  total_disciplines: number
  unread_notifications: number
}

export type DashboardResponse = StudentDashboard | TeacherDashboard | AdminDashboard