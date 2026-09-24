import { ref } from 'vue'
import { downloadPassportsZip, type ZipItem } from '@/utils/passportPdf'

/**
 * Pasportlar arxivi: avval ro'yxat olinadi (fakultetda sekin bo'lishi mumkin),
 * keyin har bir talaba uchun PDF yaratiladi — jarayon va bekor qilish holati shu yerda.
 */
export function usePassportZip() {
  const active = ref(false)
  const done = ref(0)
  const total = ref(0)
  const message = ref('')
  let controller: AbortController | null = null

  async function run(load: () => Promise<ZipItem[]>, zipName: string): Promise<void> {
    if (active.value) return
    controller = new AbortController()
    active.value = true
    done.value = 0
    total.value = 0
    message.value = ''

    try {
      const items = await load()
      total.value = items.length
      if (!items.length) {
        message.value = 'To‘ldirilgan anketa topilmadi'
        return
      }
      const finished = await downloadPassportsZip(items, zipName, (d) => (done.value = d), controller.signal)
      if (!finished) message.value = 'Bekor qilindi'
    } catch {
      message.value = 'Arxivni yaratib bo‘lmadi'
    } finally {
      active.value = false
      controller = null
    }
  }

  function cancel() {
    controller?.abort()
  }

  return { active, done, total, message, run, cancel }
}
