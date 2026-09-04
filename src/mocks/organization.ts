/**
 * Shared mock HEMIS-shaped org data (faculty → group → student) so every
 * screen that needs a faculty/group picker or a student list shows the same
 * consistent demo data. TODO(backend): replace with GET calls against the
 * new Symfony API once it exists (TZ §2.2) — components already consume
 * this through the same FacultyDto/GroupDto/StudentDto shapes the real API
 * will return.
 */
import type { FacultyDto, GroupDto, StudentDto } from '@/types/domain'
import { TEMPERAMENT_OPTIONS, SHAPE_OPTIONS } from '@/utils/instruments'

export const FACULTIES: FacultyDto[] = [
  { id: 'f1', name: 'Xorijiy filologiya fakulteti', groupCount: 3 },
  { id: 'f2', name: 'Tarix fakulteti', groupCount: 2 },
  { id: 'f3', name: 'Jurnalistika fakulteti', groupCount: 2 },
]

export const GROUPS_BY_FACULTY: Record<string, GroupDto[]> = {
  f1: [
    { id: 'g1', facultyId: 'f1', name: '21-FIL-14', studentCount: 24, studyLanguage: 'uz' },
    { id: 'g2', facultyId: 'f1', name: '21-FIL-15', studentCount: 22, studyLanguage: 'uz' },
    { id: 'g3', facultyId: 'f1', name: '22-FIL-03', studentCount: 19, studyLanguage: 'ru' },
  ],
  f2: [
    { id: 'g4', facultyId: 'f2', name: '22-TAR-03', studentCount: 21, studyLanguage: 'uz' },
    { id: 'g5', facultyId: 'f2', name: '23-TAR-01', studentCount: 18, studyLanguage: 'ru' },
  ],
  f3: [
    { id: 'g6', facultyId: 'f3', name: '21-JUR-02', studentCount: 20, studyLanguage: 'uz' },
    { id: 'g7', facultyId: 'f3', name: '22-JUR-01', studentCount: 17, studyLanguage: 'uz' },
  ],
}

const FIRST_NAMES = ['Madina', 'Aziz', 'Nodira', 'Jasur', 'Sevinch', 'Dilshod', 'Zilola', 'Otabek', 'Malika', 'Sardor', 'Gulnoza', 'Bekzod']
const LAST_NAMES = ['Yusupova', 'Karimov', 'Tosheva', 'Rashidov', 'Nazarova', 'Ergashev', 'Xoliqova', 'Yusupov', 'Rahimova', 'Aliyev']

function seededStudents(groupId: string, count: number): StudentDto[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = (groupId.charCodeAt(1) ?? 1) * 31 + i
    return {
      id: `${groupId}-s${i + 1}`,
      hemisId: `382${(10000000 + seed).toString().slice(0, 8)}`,
      fullName: `${FIRST_NAMES[seed % FIRST_NAMES.length]} ${LAST_NAMES[(seed * 3) % LAST_NAMES.length]}`,
    }
  })
}

export function studentsForGroup(groupId: string): StudentDto[] {
  const group = Object.values(GROUPS_BY_FACULTY).flat().find((g) => g.id === groupId)
  return seededStudents(groupId, group?.studentCount ?? 15)
}

const NEVRASTENIYA_CONCLUSIONS = [
  'Past daraja — nevrastenik alomatlar sezilarli emas.',
  'O‘rta daraja — vaqti-vaqti bilan asabiylashish, charchoq kuzatiladi.',
  'Yuqori daraja — doimiy tashvish va uyqu buzilishi belgilari mavjud, psixolog bilan suhbat tavsiya etiladi.',
]

/** Deterministic pseudo-random result per student, so the same student always shows the same demo result. */
export function mockGroupResults(groupId: string) {
  const students = studentsForGroup(groupId)
  return students.map((student, i) => {
    const seed = student.id.length + i
    return {
      student,
      temperament: seed % 5 === 0 ? null : TEMPERAMENT_OPTIONS[seed % TEMPERAMENT_OPTIONS.length],
      geometricFigure: seed % 4 === 0 ? null : SHAPE_OPTIONS[seed % SHAPE_OPTIONS.length],
      conclusion: seed % 3 === 0 ? null : NEVRASTENIYA_CONCLUSIONS[seed % NEVRASTENIYA_CONCLUSIONS.length],
    }
  })
}
