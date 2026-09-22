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
  loadedFacultyGroups: Record<string, boolean>
  loaded: boolean
  loading: boolean
}

/** A faculty can have hundreds of HEMIS groups — pull them all in one page. */
const BIG_PAGE = 2000

function mapFaculty(f: { id: number; name: string; groupCount?: number; externalId?: string | null }): FacultyDto {
  return { id: String(f.id), name: f.name, groupCount: f.groupCount ?? 0, externalId: f.externalId ?? undefined }
}
function mapGroup(g: {
  id: number
  name: string
  studyLanguage: StudyLanguage
  studentCount?: number
  externalId?: string | null
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
    externalId: g.externalId ?? undefined,
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
    loadedFacultyGroups: {},
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
    /** Faculties only — groups are pulled per faculty on demand (there can be
     *  thousands once HEMIS is synced). */
    async load(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      try {
        const faculties = members<Parameters<typeof mapFaculty>[0]>(
          (await api.get('/faculties', { params: { itemsPerPage: BIG_PAGE } })).data,
        )
        this.faculties = faculties.map(mapFaculty)
        this.loaded = true
      } finally {
        this.loading = false
      }
    },
    /** One faculty's groups. */
    async loadGroups(facultyId: string, force = false) {
      if (!facultyId || (this.loadedFacultyGroups[facultyId] && !force)) return
      const groups = members<Parameters<typeof mapGroup>[0]>(
        (await api.get('/study_groups', { params: { faculty: facultyId, itemsPerPage: BIG_PAGE } })).data,
      )
      this.groupsByFaculty = { ...this.groupsByFaculty, [facultyId]: groups.map(mapGroup) }
      this.loadedFacultyGroups = { ...this.loadedFacultyGroups, [facultyId]: true }
    },
    async loadStudents(groupId: string, force = false) {
      if (this.studentsByGroup[groupId] && !force) return
      const users = members<Parameters<typeof mapStudent>[0]>(
        (await api.get('/users', { params: { studyGroup: groupId, itemsPerPage: 500 } })).data,
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

    // --- HEMIS sync (admin) -------------------------------------------------

    /** Pull every faculty from HEMIS, then refresh. */
    async syncHemisFaculties(): Promise<SyncCounts> {
      const counts = (await api.post('/admin/hemis/faculties', null)).data as SyncCounts
      await this.load(true)
      return counts
    },
    /** HEMIS's groups for a faculty (not saved — for the import picker). */
    async hemisGroups(facultyId: string): Promise<HemisGroupOption[]> {
      return (await api.get(`/admin/hemis/faculties/${facultyId}/groups`)).data as HemisGroupOption[]
    },
    /** Queue a background sync of a faculty's current groups + students (202). */
    async queueHemisFacultyStudents(facultyId: string): Promise<void> {
      await api.post(`/admin/hemis/faculties/${facultyId}/students`, null)
    },
    /** Import one HEMIS group + its current students. */
    async importHemisGroup(facultyId: string, groupExternalId: string): Promise<SyncCounts> {
      const counts = (
        await api.post(`/admin/hemis/faculties/${facultyId}/groups/${groupExternalId}`, null)
      ).data as SyncCounts
      await this.loadGroups(facultyId, true)
      const faculty = this.faculties.find((f) => f.id === facultyId)
      if (faculty) faculty.groupCount = (this.groupsByFaculty[facultyId] ?? []).length
      return counts
    },
    /** Re-pull a group's students from HEMIS (one group, synchronous). */
    async syncHemisStudents(groupId: string): Promise<SyncCounts> {
      const counts = (await api.post(`/admin/hemis/groups/${groupId}/students`, null)).data as SyncCounts
      await this.loadStudents(groupId, true)
      const group = Object.values(this.groupsByFaculty).flat().find((g) => g.id === groupId)
      if (group) group.studentCount = (this.studentsByGroup[groupId] ?? []).length
      return counts
    },
    /** Queue a background re-sync of every imported group's students (202, non-blocking). */
    async queueHemisStudentsSync(): Promise<void> {
      await api.post('/admin/hemis/students', null)
    },
    /** Re-pull tutors from HEMIS's employee-list (synchronous — auto-activates pending ones). */
    async syncHemisTutors(): Promise<SyncCounts> {
      return (await api.post('/admin/hemis/tutors', null)).data as SyncCounts
    },
  },
})

export interface SyncCounts {
  created: number
  updated: number
}
export interface HemisGroupOption {
  externalId: string
  name: string
  facultyExternalId: string
  facultyName: string
  studyLanguage: StudyLanguage
  active: boolean
}
