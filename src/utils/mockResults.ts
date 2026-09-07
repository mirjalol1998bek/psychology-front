import type { StudentDto } from '@/types/domain'
import { TEMPERAMENT_OPTIONS, SHAPE_OPTIONS } from '@/utils/instruments'
import { submittedResultsFor } from '@/services/attemptService'

const NEVRASTENIYA_CONCLUSIONS = [
  'Past daraja — nevrastenik alomatlar sezilarli emas.',
  'O‘rta daraja — vaqti-vaqti bilan asabiylashish, charchoq kuzatiladi.',
  'Yuqori daraja — doimiy tashvish va uyqu buzilishi belgilari mavjud, psixolog bilan suhbat tavsiya etiladi.',
]

export interface GroupResultRow {
  student: StudentDto
  temperament: string | null
  geometricFigure: string | null
  conclusion: string | null
}

/**
 * A group's results table. Real submitted attempts (from attemptService,
 * keyed by HEMIS id) always win — so a student the admin created and then
 * "viewed as" to take a test shows their genuine result here. Seeded
 * students with no real attempt fall back to a deterministic mock;
 * admin-added students (`s-new-*`) with no attempt show as "not taken".
 * TODO(backend): replace the fallback with GET /admin/result/group.
 */
export function mockGroupResults(students: StudentDto[]): GroupResultRow[] {
  return students.map((student, i) => {
    const real = submittedResultsFor(student.hemisId)
    const isNew = student.id.startsWith('s-new-')

    const seed = student.id.length + i
    const mock = isNew
      ? { temperament: null, geometricFigure: null, conclusion: null }
      : {
          temperament: seed % 5 === 0 ? null : TEMPERAMENT_OPTIONS[seed % TEMPERAMENT_OPTIONS.length],
          geometricFigure: seed % 4 === 0 ? null : SHAPE_OPTIONS[seed % SHAPE_OPTIONS.length],
          conclusion: seed % 3 === 0 ? null : NEVRASTENIYA_CONCLUSIONS[seed % NEVRASTENIYA_CONCLUSIONS.length],
        }

    return {
      student,
      temperament: real.temperament ?? mock.temperament,
      geometricFigure: real.geometricFigure ?? mock.geometricFigure,
      conclusion: real.conclusion ?? mock.conclusion,
    }
  })
}
