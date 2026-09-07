import { computed, ref, watch } from 'vue'
import { useTheme } from 'vuetify'

/**
 * Three-way theme control: an explicit `light` / `dark` choice, or `system`
 * which follows the OS `prefers-color-scheme` and keeps following it as it
 * changes. The choice is persisted; `system` is the default for a fresh
 * visitor so the app matches whatever they already use.
 */
export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'psy.theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')

function stored(): ThemeMode {
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

// Module-level singleton state — every caller shares one source of truth.
const mode = ref<ThemeMode>(stored())
const systemDark = ref(media.matches)
media.addEventListener('change', (e) => {
  systemDark.value = e.matches
})

const isDark = computed(() => (mode.value === 'system' ? systemDark.value : mode.value === 'dark'))

function setMode(next: ThemeMode) {
  mode.value = next
  localStorage.setItem(STORAGE_KEY, next)
}

function cycle() {
  setMode(mode.value === 'light' ? 'dark' : mode.value === 'dark' ? 'system' : 'light')
}

let bound = false

export function useThemeMode() {
  const theme = useTheme()

  // Bind the reactive state to Vuetify exactly once, from the first caller
  // (App.vue) — subsequent callers just read/write the shared state.
  if (!bound) {
    bound = true
    watch(isDark, (dark) => { theme.global.name.value = dark ? 'dark' : 'light' }, { immediate: true })
  }

  return { mode, isDark, setMode, cycle }
}
