import { defineStore } from 'pinia'
import type { FacultyDto, GroupDto, StudentDto, StudyLanguage } from '@/types/domain'

/**
 * HEMIS-shaped org data (faculty → group → student). Seeded from fixed demo
 * data; the admin can add faculties, groups and students at runtime (for
 * testing a freshly-published test from the student side). Every picker and
 * results screen reads from here so additions show up everywhere.
 *
 * Admin additions are persisted to localStorage so they survive a page
 * reload while testing. TODO(backend): replace with the real Symfony API.
 */

const STORAGE_KEY = 'psy.org'

const SEED_FACULTIES: FacultyDto[] = [
  { id: 'f1', name: 'Xorijiy filologiya fakulteti', groupCount: 3 },
  { id: 'f2', name: 'Tarix fakulteti', groupCount: 2 },
  { id: 'f3', name: 'Jurnalistika fakulteti', groupCount: 2 },
]

const SEED_GROUPS: Record<string, GroupDto[]> = {
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

/** Deterministic roster for a seeded group — same input, same students. */
export function seededStudents(groupId: string, count: number): StudentDto[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = (groupId.charCodeAt(1) ?? 1) * 31 + i
    return {
      id: `${groupId}-s${i + 1}`,
      hemisId: `382${(10000000 + seed).toString().slice(0, 8)}`,
      fullName: `${FIRST_NAMES[seed % FIRST_NAMES.length]} ${LAST_NAMES[(seed * 3) % LAST_NAMES.length]}`,
    }
  })
}

interface OrgState {
  faculties: FacultyDto[]
  groupsByFaculty: Record<string, GroupDto[]>
  addedStudents: Record<string, StudentDto[]>
}

function freshState(): OrgState {
  return {
    faculties: SEED_FACULTIES.map((f) => ({ ...f })),
    groupsByFaculty: JSON.parse(JSON.stringify(SEED_GROUPS)),
    addedStudents: {},
  }
}

function loadState(): OrgState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<OrgState>
      const base = freshState()
      return {
        faculties: parsed.faculties ?? base.faculties,
        groupsByFaculty: parsed.groupsByFaculty ?? base.groupsByFaculty,
        addedStudents: parsed.addedStudents ?? {},
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return freshState()
}

let uid = Date.now() % 100000

export const useOrganizationStore = defineStore('organization', {
  state: (): OrgState => loadState(),
  getters: {
    allGroups: (s): GroupDto[] => Object.values(s.groupsByFaculty).flat(),
    facultyById:
      (s) =>
      (id: string): FacultyDto | undefined =>
        s.faculties.find((f) => f.id === id),
    groupById:
      (s) =>
      (id: string): GroupDto | undefined =>
        Object.values(s.groupsByFaculty).flat().find((g) => g.id === id),
    /** Full roster for a group: seeded students + any the admin added.
     *  Seeded count comes from the immutable SEED_GROUPS so it doesn't grow
     *  as the admin adds students; brand-new groups have no seeded roster. */
    studentsForGroup:
      (s) =>
      (groupId: string): StudentDto[] => {
        const orig = Object.values(SEED_GROUPS).flat().find((g) => g.id === groupId)
        const seeded = orig ? seededStudents(groupId, orig.studentCount) : []
        return [...seeded, ...(s.addedStudents[groupId] ?? [])]
      },
    isAddedStudent: (s) => (studentId: string) =>
      Object.values(s.addedStudents).some((list) => list.some((st) => st.id === studentId)),
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            faculties: this.faculties,
            groupsByFaculty: this.groupsByFaculty,
            addedStudents: this.addedStudents,
          }),
        )
      } catch {
        /* storage full / unavailable — non-fatal for a demo */
      }
    },
    reset() {
      const s = freshState()
      this.faculties = s.faculties
      this.groupsByFaculty = s.groupsByFaculty
      this.addedStudents = s.addedStudents
      localStorage.removeItem(STORAGE_KEY)
    },
    addFaculty(name: string): FacultyDto {
      const faculty: FacultyDto = { id: `f-new-${++uid}`, name: name.trim(), groupCount: 0 }
      this.faculties.push(faculty)
      this.groupsByFaculty[faculty.id] = []
      this.persist()
      return faculty
    },
    addGroup(facultyId: string, name: string, studyLanguage: StudyLanguage): GroupDto {
      const group: GroupDto = { id: `g-new-${++uid}`, facultyId, name: name.trim(), studentCount: 0, studyLanguage }
      ;(this.groupsByFaculty[facultyId] ??= []).push(group)
      const faculty = this.faculties.find((f) => f.id === facultyId)
      if (faculty) faculty.groupCount += 1
      this.persist()
      return group
    },
    addStudent(groupId: string, fullName: string, hemisId?: string): StudentDto {
      const student: StudentDto = {
        id: `s-new-${++uid}`,
        hemisId: hemisId?.trim() || `999${String(100000 + uid).slice(-6)}`,
        fullName: fullName.trim(),
      }
      ;(this.addedStudents[groupId] ??= []).push(student)
      const group = Object.values(this.groupsByFaculty).flat().find((g) => g.id === groupId)
      if (group) group.studentCount += 1
      this.persist()
      return student
    },
  },
})
