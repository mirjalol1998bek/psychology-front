import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { PassportData } from '@/stores/passport'
import { formatDay } from '@/utils/datetime'
import { fileSlug } from '@/utils/exportXlsx'
import { passportSections } from '@/utils/passportFields'

export interface PassportPdfInput {
  fullName: string
  hemisId: string | null
  faculty: string
  group: string
  personalCode: string | null
  passport: PassportData
}

type PdfMake = typeof import('pdfmake/build/pdfmake')

const TEAL = '#0B7D6A'
const MUTED = '#8C8678'
const RULE = '#E3E8E6'

/**
 * pdfmake (~1 MB, Roboto shrifti bilan — lotin `o‘/g‘` va kirillni qo'llaydi)
 * faqat tugma bosilganda yuklanadi, asosiy bundle'ga tushmaydi.
 */
export async function downloadPassportPdf(input: PassportPdfInput): Promise<void> {
  const [pdfModule, vfsModule, logo] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
    loadLogo(),
  ])
  // UMD/CommonJS paketlar — Vite ularni `default` ostida beradi.
  const pdfMake = ((pdfModule as unknown as { default?: PdfMake }).default ?? pdfModule) as PdfMake
  const vfs = ((vfsModule as unknown as { default?: Record<string, string> }).default ?? vfsModule) as Record<string, string>

  pdfMake
    .createPdf(buildDocument(input, logo), undefined, undefined, vfs)
    .download(`pasport_${fileSlug(input.fullName) || 'talaba'}.pdf`)
}

async function loadLogo(): Promise<string | null> {
  try {
    const blob = await (await fetch('/logo-utjhu.png')).blob()

    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function buildDocument(input: PassportPdfInput, logo: string | null): TDocumentDefinitions {
  const generated = formatDay(new Date().toISOString(), { year: true })

  return {
    pageSize: 'A4',
    pageMargins: [40, 34, 40, 40],
    info: { title: `Ijtimoiy-psixologik anketa — ${input.fullName}` },
    defaultStyle: { font: 'Roboto', fontSize: 10, color: '#211E1A', lineHeight: 1.2 },
    footer: (page: number, count: number) => ({
      columns: [`Yuklab olingan: ${generated}`, { text: `${page} / ${count}`, alignment: 'right' }],
      margin: [40, 12, 40, 0],
      fontSize: 8,
      color: MUTED,
    }),
    content: [header(logo), identity(input), ...passportSections(input.passport).flatMap(section)],
  }
}

function header(logo: string | null): Content {
  return {
    columns: [
      ...(logo ? [{ image: logo, width: 42 }] : []),
      {
        stack: [
          { text: 'IJTIMOIY-PSIXOLOGIK ANKETA', fontSize: 15, bold: true, color: TEAL },
          { text: 'Psixodiagnostika — universitet psixologik xizmati', fontSize: 9, color: MUTED, margin: [0, 2, 0, 0] },
        ],
        margin: [logo ? 10 : 0, logo ? 8 : 0, 0, 0],
      },
    ],
    margin: [0, 0, 0, 10],
  }
}

function identity(input: PassportPdfInput): Content {
  const updated = input.passport.updatedAt ? formatDay(input.passport.updatedAt, { year: true, time: true }) : ''
  const rows: [string, string][] = [
    ['F.I.SH', input.fullName],
    ['Talaba ID', input.hemisId ?? ''],
    ['Fakultet', input.faculty],
    ['Guruh', input.group],
    ['Shaxsiy kod', input.personalCode ?? ''],
    ['Anketa yangilangan', updated],
  ]

  return {
    table: { widths: [120, '*'], body: rows.map(([label, value]) => [labelCell(label), valueCell(value, true)]) },
    layout: 'noBorders',
    fillColor: '#F2F8F6',
    margin: [0, 0, 0, 6],
  }
}

function section(s: { title: string; rows: [string, string][] }): Content[] {
  return [
    { text: s.title.toUpperCase(), fontSize: 9, bold: true, color: TEAL, characterSpacing: 0.4, margin: [0, 10, 0, 4] },
    {
      table: { widths: [170, '*'], body: s.rows.map(([label, value]) => [labelCell(label), valueCell(value)]) },
      layout: {
        hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === 0 || i === node.table.body.length ? 0 : 0.6),
        vLineWidth: () => 0,
        hLineColor: () => RULE,
        paddingTop: () => 3.5,
        paddingBottom: () => 3.5,
        paddingLeft: () => 0,
        paddingRight: () => 8,
      },
    },
  ]
}

function labelCell(text: string): Content {
  return { text, color: MUTED, fontSize: 9, margin: [6, 0, 0, 0] }
}

function valueCell(value: string, bold = false): Content {
  return value ? { text: value, bold } : { text: '—', color: '#B8B1A5' }
}
