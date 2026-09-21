/**
 * Domain types for the Psixodiagnostika platform.
 *
 * These mirror the REAL data model already running in production inside
 * dashboard-uzswlu's psixologiya module (psixologiyaService.js + its Vue
 * screens) — categories → quizzes → questions → options, faculty → group →
 * student, assignments, attempts. The new project rebuilds these screens
 * with a modern UI, it does not reinvent the model.
 *
 * `instrumentType` (a frontend-only classification layered on top of the
 * named categories the backend already has — Temperament, Psixogeometrik,
 * IPM-20, OKM-20, EHS-20, KSM-20, XO-20, QY-16, Dembo–Rubinshteyn) drives
 * which RESULT rendering mode a category uses, since the existing app
 * renders each one completely differently:
 *   - FREQUENCY_BASED  (Temperament)   → colored badge, click for a large
 *     gradient icon + full description
 *   - RANKING_BASED    (Psixogeometrik)→ small gradient shape icon inline,
 *     click for a large icon + description
 *   - SUBSCALE_BASED   (IPM-20), MOTIVATION_BASED (OKM-20),
 *     RESILIENCE_BASED (EHS-20), COMMUNICATION_BASED (KSM-20),
 *     RISK_BASED (XO-20), VALUES_BASED (QY-16),
 *     SELF_ESTEEM_BASED (Dembo–Rubinshteyn) → free-text "xulosa" +
 *                                         per-subshkala breakdown chart
 *                                         (same renderMode, distinguished
 *                                         only so each gets its own
 *                                         Category). COMMUNICATION_BASED,
 *                                         VALUES_BASED va SELF_ESTEEM_BASED
 *                                         umumiy ballga ega emas — see
 *                                         `AttemptResult.score` note below.
 * See src/utils/instruments.ts for the color/icon/render-mode tables.
 */
export type InstrumentType =
  | 'FREQUENCY_BASED'
  | 'RANKING_BASED'
  | 'SUBSCALE_BASED'
  | 'MOTIVATION_BASED'
  | 'RESILIENCE_BASED'
  | 'COMMUNICATION_BASED'
  | 'RISK_BASED'
  | 'VALUES_BASED'
  | 'SELF_ESTEEM_BASED'

export type StudyLanguage = 'uz' | 'ru'

export type UserRole = 'student' | 'psychologist' | 'admin'

export interface HemisProfile {
  hemisId: string
  fullName: string
  faculty: string
  group: string
  studyLanguage: StudyLanguage
  image?: string
}

export interface AuthUser {
  id: string
  role: UserRole
  hemis: HemisProfile
}

// ---------------------------------------------------------------------------
// Faculty / group / student — resolved from HEMIS (TZ §2.2), read-only here.
// ---------------------------------------------------------------------------
export interface FacultyDto {
  id: string
  name: string
  groupCount: number
  externalId?: string
}

export interface GroupDto {
  id: string
  facultyId: string
  name: string
  studentCount: number
  studyLanguage: StudyLanguage
  externalId?: string
}

export interface StudentDto {
  id: string
  hemisId: string
  fullName: string
  image?: string
}

// ---------------------------------------------------------------------------
// Category → Quiz → Question → Option
// ---------------------------------------------------------------------------
export interface CategoryDto {
  id: string
  name: string
  description: string
  instrumentType: InstrumentType
  quizCount: number
}

export type QuestionType = 'YES_NO' | 'SINGLE_CHOICE' | 'MULTI_SELECT' | 'SINGLE_CHOICE_IMAGE' | 'FIGURE' | 'SCALE' | 'WRITING'

export interface OptionDto {
  id: string
  text: string
  imageUrl?: string
  order: number
  score?: number
}

export interface QuestionDto {
  id: string
  quizId: string
  type: QuestionType
  text: string
  order: number
  options: OptionDto[]
}

export interface QuizDto {
  id: string
  categoryId: string
  title: string
  description: string
  timeLimitMinutes: number
  isActive: boolean
  questionCount: number
}

// ---------------------------------------------------------------------------
// Assignment (category → faculty/group, with a start/end window) & attempts
// ---------------------------------------------------------------------------
export interface AssignmentDto {
  id: string
  categoryId: string
  categoryName: string
  instrumentType: InstrumentType
  facultyId: string
  groupId: string
  groupName: string
  quizTitles: string[]
  startAt: string
  endAt?: string
  isActive: boolean
}

export type AttemptStatus = 'not_started' | 'in_progress' | 'submitted' | 'reviewed'

export interface AttemptDto {
  id: string
  assignmentId: string
  quizId: string
  studentId: string
  status: AttemptStatus
  scorePct?: number
  startedAt?: string
  submittedAt?: string
}


// ---------------------------------------------------------------------------
// Faculty-wide statistics (TZ §6 / real /admin/result/fakulty shape)
// ---------------------------------------------------------------------------
export interface FigureBreakdownDto {
  name: string
  count: number
}

export interface FacultyStatsDto {
  departmentId: string
  departmentName: string
  totalStudents: number
  studentsWithTests: number
  studentsWithoutTests: number
  singleTest: { studentsWithSingle: number; totalStudents: number; geometricFigures: FigureBreakdownDto[] }
  multipleTest: { studentsWithMultiple: number; totalStudents: number; temperamentTypes: FigureBreakdownDto[] }
  nevrastheniaTest: { studentsWithNevrasthenia: number; studentsWithoutNevrasthenia: number; scales: FigureBreakdownDto[] }
}

// ---------------------------------------------------------------------------
// Appointments (TZ §9) & anonymous appeals (TZ §8.2) — new, not in the old app
// ---------------------------------------------------------------------------
export type AppointmentSlotStatus = 'free' | 'booked' | 'cancelled'

export interface AppointmentSlotDto {
  id: string
  date: string // ISO date, e.g. 2026-09-09
  startTime: string // HH:mm
  endTime: string
  status: AppointmentSlotStatus
  studentName?: string
}

export type AppealMode = 'anonymous' | 'semi_anonymous'

export interface AppealDto {
  id: string
  mode: AppealMode
  message: string
  createdAt: string
  isAnswered: boolean
}
