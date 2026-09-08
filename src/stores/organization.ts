import { defineStore } from 'pinia'
import type { FacultyDto, GroupDto, StudentDto, StudyLanguage } from '@/types/domain'
import { api } from '@/services/apiClient'
import { members } from '@/services/quizService'

/**
 * HEMIS-shaped org data (faculty → group → student), backed by the API.
 * Admin-only writes: POST /api/faculties, /api/study_groups, /api/students.
 * Students per group are loaded lazily (GET /api/users?studyGroup=…).
 */

interface OrgState {
  faculties: FacultyDto[]
  groupsByFaculty: Record<string, GroupDto[]>
  studentsByGroup: Record<string, StudentDto[]>
  loaded: boolean
  loading: boolean
}

function mapFaculty(f: { id: number; name: string; groupCount?: number }): FacultyDto {
  return { id: String(f.id), name: f.name, groupCount: f.groupCount ?? 0 }
}
function mapGroup(g: {
  id: number
  name: string
  studyLanguage: StudyLanguage
  studentCount?: number
  faculty?: { id?: number } | string
}): GroupDto {
  const facultyId =
    typeof g.faculty === 'string' ? g.faculty.split('/').pop() ?? '' : String(g.faculty?.id ?? '')
  return {
    id: String(g.id),
    facultyId,
    name: g.name,
    studentCount: g.studentCount ?? 0,
    studyLanguage: g.studyLanguage,
  }
}
function mapStudent(u: { id: number; hemisId?: string | null; fullName?: string | null; image?: string | null }): StudentDto {
  return {
    id: String(u.id),
    hemisId: u.hemisId ?? String(u.id),
    fullName: u.fullName ?? '—',
    image: u.image ?? undefined,
  }
}

export const useOrganizationStore = defineStore('organization', {
  state: (): OrgState => ({
    faculties: [],
    groupsByFaculty: {},
    studentsByGroup: {},
    loaded: false,
    loading: false,
  }),
  getters: {
    allGroups: (s): GroupDto[] => Object.values(s.groupsByFaculty).flat(),
    facultyById: (s) => (id: string): FacultyDto | undefined => s.faculties.find((f) => f.id === id),
    groupById: (s) => (id: string): GroupDto | undefined =>
      Object.values(s.groupsByFaculty).flat().find((g) => g.id === id),
    groupsFor: (s) => (facultyId: string): GroupDto[] => s.groupsByFaculty[facultyId] ?? [],
    studentsForGroup: (s) => (groupId: string): StudentDto[] => s.studentsByGroup[groupId] ?? [],
  },
  actions: {
    async load(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      try {
        const [faculties, groups] = await Promise.all([
          api.get('/faculties').then((r) => members<Parameters<typeof mapFaculty>[0]>(r.data)),
          api.get('/study_groups').then((r) => members<Parameters<typeof mapGroup>[0]>(r.data)),
        ])
        this.faculties = faculties.map(mapFaculty)
        const byFaculty: Record<string, GroupDto[]> = {}
        for (const g of groups.map(mapGroup)) (byFaculty[g.facultyId] ??= []).push(g)
        this.groupsByFaculty = byFaculty
        this.loaded = true
      } finally {
        this.loading = false
      }
    },
    async loadStudents(groupId: string, force = false) {
      if (this.studentsByGroup[groupId] && !force) return
      const users = members<Parameters<typeof mapStudent>[0]>(
        (await api.get('/users', { params: { studyGroup: groupId } })).data,
      )
      this.studentsByGroup = { ...this.studentsByGroup, [groupId]: users.map(mapStudent) }
    },
    async addFaculty(name: string): Promise<FacultyDto> {
      const created = mapFaculty((await api.post('/faculties', { name: name.trim() })).data)
      this.faculties.push(created)
      this.groupsByFaculty = { ...this.groupsByFaculty, [created.id]: [] }
      return created
    },
    async addGroup(facultyId: string, name: string, studyLanguage: StudyLanguage): Promise<GroupDto> {
      const created = mapGroup(
        (await api.post('/study_groups', {
          faculty: `/api/faculties/${facultyId}`,
          name: name.trim(),
          studyLanguage,
        })).data,
      )
      this.groupsByFaculty = {
        ...this.groupsByFaculty,
        [facultyId]: [...(this.groupsByFaculty[facultyId] ?? []), created],
      }
      const faculty = this.faculties.find((f) => f.id === facultyId)
      if (faculty) faculty.groupCount += 1
      return created
    },
    async addStudent(groupId: string, fullName: string, hemisId?: string): Promise<StudentDto> {
      const created = mapStudent(
        (await api.post('/students', {
          fullName: fullName.trim(),
          hemisId: hemisId?.trim() || null,
          studyGroup: `/api/study_groups/${groupId}`,
        })).data,
      )
      this.studentsByGroup = {
        ...this.studentsByGroup,
        [groupId]: [...(this.studentsByGroup[groupId] ?? []), created],
      }
      const group = Object.values(this.groupsByFaculty).flat().find((g) => g.id === groupId)
      if (group) group.studentCount += 1
      return created
    },
  },
})
