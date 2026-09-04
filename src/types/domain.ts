/**
 * Domain types for the Psixodiagnostika platform.
 *
 * `instrumentType` drives which scoring strategy (backend) and which
 * question/result components (frontend) a quiz uses. Adding a new
 * psychological instrument means adding a new value here plus a matching
 * strategy/component pair — existing instruments are never touched.
 * See TZ §7 "Skorlash arxitekturasi".
 */
export type InstrumentType = 'FREQUENCY_BASED' | 'RANKING_BASED' | 'SCORE_RANGE_BASED'

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

export interface OptionDto {
  id: string
  text: string
  imageUrl?: string
  order: number
  /** FREQUENCY_BASED instruments: which result category this option counts toward. */
  resultCategory?: string
  /** SCORE_RANGE_BASED instruments: points this option contributes. */
  score?: number
}

export interface QuestionDto {
  id: string
  quizId: string
  text: string
  imageUrl?: string
  order: number
  options: OptionDto[]
}

export interface QuizDto {
  id: string
  categoryId: string
  title: string
  description: string
  instrumentType: InstrumentType
  instructionLanguage: StudyLanguage
  timeLimitMinutes?: number
  isActive: boolean
}

export interface AssignmentDto {
  id: string
  categoryId: string
  categoryName: string
  facultyId: string
  groupId: string
  groupName: string
  startAt: string
  endAt?: string
}

export type AttemptStatus = 'not_started' | 'in_progress' | 'submitted' | 'reviewed'

export interface AttemptDto {
  id: string
  assignmentId: string
  quizId: string
  studentId: string
  status: AttemptStatus
  startedAt?: string
  submittedAt?: string
}

export interface ResultSummaryDto {
  attemptId: string
  instrumentType: InstrumentType
  /** e.g. "Sangvinik" (frequency), "Doira" (ranking), "O'rta daraja" (score range) */
  label: string
  description: string
  score?: number
}

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
