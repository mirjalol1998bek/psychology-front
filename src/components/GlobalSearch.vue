<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useNavItems, type NavItem } from '@/composables/useNavItems'

/**
 * Topbar qidiruvi — platforma bo'limlari bo'yicha tez o'tish.
 * Yozgan sari mos bo'limlar ro'yxati chiqadi; ↑/↓ va Enter bilan yuriladi.
 *
 * Ro'yxat <Teleport>-lanadi, chunki v-app-bar `overflow: hidden` — ichkariga
 * qo'yilgan absolyut panel kesilib qolardi.
 */

const { t } = useI18n()
const router = useRouter()
const { allNav } = useNavItems()

const query = ref('')
const open = ref(false)
const activeIndex = ref(0)
const rootRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

const results = computed<NavItem[]>(() => {
  const q = query.value.trim().toLowerCase()

  if (q === '') {
    return allNav.value
  }

  return allNav.value.filter((item) => `${item.title} ${item.keywords ?? ''}`.toLowerCase().includes(q))
})

watch(results, () => {
  activeIndex.value = 0
})

function positionPanel() {
  const rect = rootRef.value?.getBoundingClientRect()

  if (!rect) {
    return
  }

  panelStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.bottom + 6)}px`,
    left: `${Math.round(rect.right - 320)}px`,
    width: '320px',
  }
}

async function openPanel() {
  open.value = true
  await nextTick()
  positionPanel()
}

function closePanel() {
  open.value = false
  query.value = ''
}

function move(delta: number) {
  if (results.value.length === 0) {
    return
  }

  activeIndex.value = (activeIndex.value + delta + results.value.length) % results.value.length
}

function go(to: string) {
  closePanel()

  if (router.currentRoute.value.fullPath !== to) {
    router.push(to)
  }
}

function choose() {
  const target = results.value[activeIndex.value]

  if (target) {
    go(target.to)
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  const node = event.target as Node

  if (open.value && rootRef.value && !rootRef.value.contains(node) && !isInsidePanel(node)) {
    closePanel()
  }
}

function isInsidePanel(node: Node): boolean {
  return node instanceof Element && node.closest('.global-search__panel') !== null
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  window.addEventListener('resize', positionPanel)
  window.addEventListener('scroll', positionPanel, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  window.removeEventListener('resize', positionPanel)
  window.removeEventListener('scroll', positionPanel, true)
})
</script>

<template>
  <div ref="rootRef" class="global-search" :class="{ 'is-open': open }">
    <v-text-field
      v-model="query"
      density="compact"
      variant="solo-filled"
      rounded="lg"
      flat
      hide-details
      autocomplete="off"
      :placeholder="t('common.search')"
      prepend-inner-icon="mdi-magnify"
      bg-color="surface-variant"
      class="global-search__field"
      @focus="openPanel"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="choose"
      @keydown.esc="closePanel"
    />

    <Teleport to="body">
      <div v-if="open" class="global-search__panel surface-card" :style="panelStyle">
        <v-list density="comfortable" nav bg-color="transparent" class="py-1">
          <template v-if="results.length">
            <v-list-item
              v-for="(item, i) in results"
              :key="item.to"
              :active="i === activeIndex"
              :prepend-icon="item.icon"
              :title="item.title"
              rounded="lg"
              class="global-search__item"
              @click="go(item.to)"
              @mousemove="activeIndex = i"
            />
          </template>
          <v-list-item v-else class="text-body-2 text-medium-emphasis" :title="t('common.notFound')" />
        </v-list>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.global-search {
  width: 220px;
  transition: width 0.22s var(--ease);
}

.global-search.is-open {
  width: 320px;
}

.global-search__field :deep(.v-field) {
  font-size: 0.875rem;
}
</style>

<style>
.global-search__panel {
  z-index: 2500;
  max-height: 60vh;
  overflow-y: auto;
  border-radius: var(--radius);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.24);
}

.global-search__panel .global-search__item.v-list-item--active {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}
</style>
