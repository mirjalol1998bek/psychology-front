/**
 * Zero-dependency STORE-method (siqilmagan) zip — `.xlsx` ichki qismlari va
 * pasportlar arxivi uchun. PDF/PNG allaqachon siqilgan, deflate foyda bermaydi.
 */

export interface ZipEntry {
  /** Arxiv ichidagi yo'l, `/` bilan papkalar (masalan `Guruh/pasport.pdf`). */
  name: string
  data: Uint8Array
}

const CRC_TABLE = buildCrcTable()

function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256)

  for (let n = 0; n < 256; n++) {
    let c = n

    for (let k = 0; k < 8; k++) {
      c = (c & 1) === 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }

    table[n] = c >>> 0
  }

  return table
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff

  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }

  return (crc ^ 0xffffffff) >>> 0
}

// Bit 11 — fayl nomlari UTF-8; aks holda Windows kirill/`o‘` nomlarini buzadi.
const UTF8_NAMES = 0x0800
// 1980-01-01 (DOS sana) — vaqt muhim emas.
const DOS_DATE = 0x21

export function zipStore(entries: ZipEntry[]): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder()
  const parts: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const crc = crc32(entry.data)
    const size = entry.data.length

    const local = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034b50, true)
    lv.setUint16(4, 20, true)
    lv.setUint16(6, UTF8_NAMES, true)
    lv.setUint16(8, 0, true)
    lv.setUint16(10, 0, true)
    lv.setUint16(12, DOS_DATE, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, size, true)
    lv.setUint32(22, size, true)
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true)
    local.set(nameBytes, 30)

    parts.push(local, entry.data)

    const cd = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(cd.buffer)
    cv.setUint32(0, 0x02014b50, true)
    cv.setUint16(4, 20, true)
    cv.setUint16(6, 20, true)
    cv.setUint16(8, UTF8_NAMES, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, 0, true)
    cv.setUint16(14, DOS_DATE, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, size, true)
    cv.setUint32(24, size, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint16(30, 0, true)
    cv.setUint16(32, 0, true)
    cv.setUint16(34, 0, true)
    cv.setUint16(36, 0, true)
    cv.setUint32(38, 0, true)
    cv.setUint32(42, offset, true)
    cd.set(nameBytes, 46)
    central.push(cd)

    offset += local.length + size
  }

  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0)

  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)

  const out = new Uint8Array(new ArrayBuffer(offset + centralSize + 22))
  let pointer = 0

  for (const chunk of [...parts, ...central, eocd]) {
    out.set(chunk, pointer)
    pointer += chunk.length
  }

  return out
}

/** Brauzerda faylni yuklab olish. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  // Katta arxivda brauzer faylni o'qib ulgurishi uchun darhol bekor qilinmaydi.
  setTimeout(() => URL.revokeObjectURL(url), 40_000)
}
