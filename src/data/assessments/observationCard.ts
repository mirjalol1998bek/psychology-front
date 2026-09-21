/**
 * 10-metodika: Kurator va psixologning kuzatuv kartasi (ekspert bahosi).
 *
 * Talaba self-report emas — Attempt/Quiz tizimidan mustaqil, backend'da ham
 * shunday (`ObservationCardData.php`). Matn shu ikki faylda ataylab
 * takrorlangan (rasmiy hujjat manbasi — front legend/natija ko'rsatish uchun,
 * backend haqiqiy hisoblash uchun). Faqat o'zbek tilida — rasmiy manba shunday.
 */

export interface ObservationIndicator {
  key: string
  label: string
}

export const OBSERVATION_INDICATORS: ObservationIndicator[] = [
  { key: 'attendance', label: 'Darslarga davomat (sababsiz qoldirishlar)' },
  { key: 'participation', label: 'Mashg‘ulotlardagi faollik va ishtirok' },
  { key: 'performance_decline', label: 'O‘zlashtirish dinamikasi (pasayish belgilari)' },
  { key: 'assignment_timeliness', label: 'Topshiriqlarni o‘z vaqtida bajarish' },
  { key: 'group_status', label: 'Guruhdagi mavqei (chetlanish, yolg‘izlik)' },
  { key: 'peer_conflicts', label: 'Guruhdoshlar bilan nizoli holatlar' },
  { key: 'faculty_relations', label: 'Professor-o‘qituvchilar bilan munosabat' },
  { key: 'emotional_state', label: 'Emotsional fon (tushkunlik, asabiylik, yig‘loqilik)' },
  { key: 'behavior_change', label: 'Xulq-atvordagi keskin o‘zgarishlar' },
  { key: 'appearance', label: 'Tashqi ko‘rinish va o‘ziga e’tibor' },
  { key: 'discipline_violations', label: 'Intizomiy qoidabuzarliklar' },
  { key: 'dormitory_behavior', label: 'Turar joydagi (yotoqxonadagi) xulq-atvor' },
  { key: 'financial_hardship', label: 'Moddiy qiyinchilik belgilari' },
  { key: 'family_contact', label: 'Oila bilan aloqa (uzilish, ziddiyat belgilari)' },
  { key: 'staff_contact_readiness', label: 'Kurator va psixolog bilan aloqaga tayyorlik' },
]

export const OBSERVATION_SCALE_LEGEND: { value: number; label: string }[] = [
  { value: 0, label: 'Muammo yo‘q' },
  { value: 1, label: 'Kam uchraydigan, arzimas belgilar' },
  { value: 2, label: 'Muntazam takrorlanadigan muammo' },
  { value: 3, label: 'Jiddiy, doimiy muammo' },
]

export interface ObservationBand {
  key: string
  min: number
  max: number
  title: string
  action: string
}

export const OBSERVATION_BANDS: ObservationBand[] = [
  { key: 'none', min: 0, max: 10, title: 'Xavotirli belgilar yo‘q', action: 'Odatiy kuzatuv.' },
  {
    key: 'attention',
    min: 11,
    max: 22,
    title: 'Alohida muammoli sohalar bor',
    action: 'E’tibor guruhi. Kurator bilan birgalikda individual suhbat rejalashtiriladi.',
  },
  {
    key: 'risk',
    min: 23,
    max: 34,
    title: 'Ko‘p sohada muammo',
    action: 'Xavf guruhi. Individual ish rejasi, oylik monitoring, ota-onalar bilan aloqa (talabaning roziligi bilan).',
  },
  {
    key: 'systemic',
    min: 35,
    max: 45,
    title: 'Tizimli noblagopoluchiye',
    action: 'Kompleks chora: psixolog, kurator, dekanat va yoshlar bilan ishlash bo‘limining birgalikdagi ishi.',
  },
]

/** 9-ko'rsatkich 3 ball bilan baholansa — darhol individual suhbat talab qilinadi. */
export const OBSERVATION_ALERT_KEY = 'behavior_change'
export const OBSERVATION_ALERT_SCORE = 3

export function findObservationBand(totalScore: number): ObservationBand {
  return (
    OBSERVATION_BANDS.find((b) => totalScore >= b.min && totalScore <= b.max) ??
    OBSERVATION_BANDS[OBSERVATION_BANDS.length - 1]
  )
}
