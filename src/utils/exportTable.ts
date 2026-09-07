/**
 * Client-side table export — no backend, no dependency. Produces a UTF-8
 * CSV with a BOM and `;` delimiter, which Excel (incl. Cyrillic/Latin
 * Uzbek text) opens directly with correct columns and encoding.
 * TODO(backend): swap for the real /export/xlsx endpoint when it exists.
 */

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(';'))
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Slugify a faculty/group name into a safe filename fragment. */
export function fileSlug(text: string): string {
  return text
    .replace(/['’`]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}
