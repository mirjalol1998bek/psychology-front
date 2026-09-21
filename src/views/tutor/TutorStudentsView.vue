<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/apiClient'

/**
 * Tyutor: faqat o'ziga biriktirilgan guruhlar talabalari ro'yxati.
 *   GET /api/tutor/students
 * Test natijalariga kirmaydi — faqat ro'yxat + 10-metodika (kuzatuv kartasi).
 */

interface TutorStudent {
  id: number
  fullName: string | null
  hemisId: string | null
  image: string | null
  studyGroup: { id: number; name: string } | null
  hasObservationCard: boolean
}

const router = useRouter()
const rows = ref<TutorStudent[]>([])
const loading = ref(true)
const toast = ref('')
const toastOpen = ref(false)

async function load() {
  loading.value = true
  try {
    rows.value = (await api.get<TutorStudent[]>('/tutor/students')).data
  } catch {
    toast.value = 'Ro‘yxatni yuklab bo‘lmadi'
    toastOpen.value = true
  } finally {
    loading.value = false
  }
}

function fillCard(student: TutorStudent) {
  router.push({ name: 'observation-card-fill', params: { id: student.id } })
}

function groupOf(students: TutorStudent[]): Map<string, TutorStudent[]> {
  const map = new Map<string, TutorStudent[]>()
  for (const s of students) {
    const key = s.studyGroup?.name ?? '—'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return map
}

onMounted(load)
</script>

<template>
  <div>
    <div class="page-head mb-4">
      <h1 class="text-h4">Mening guruhim</h1>
      <p class="text-body-2 text-medium-emphasis mb-0" style="max-width: 62ch">
        Sizga biriktirilgan guruhlar talabalari. Har bir talaba uchun kuzatuv kartasini
        (10-metodika) bir marta to'ldirishingiz mumkin.
      </p>
    </div>

    <div v-if="loading" class="pa-8 text-center">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-else-if="!rows.length" class="pa-10 text-center text-medium-emphasis">
      <v-icon icon="mdi-account-group-outline" size="40" class="mb-2 d-block mx-auto" />
      Sizga hali guruh biriktirilmagan.
    </div>

    <template v-else>
      <v-card v-for="[groupName, students] in groupOf(rows)" :key="groupName" class="surface-card mb-4" rounded="lg">
        <v-card-title class="text-subtitle-1">{{ groupName }}</v-card-title>
        <v-divider />
        <v-list class="py-0" bg-color="transparent">
          <template v-for="(s, i) in students" :key="s.id">
            <v-divider v-if="i > 0" />
            <v-list-item class="py-3">
              <div class="d-flex align-center flex-wrap" style="gap: 14px">
                <v-avatar size="40" color="primary" variant="tonal">
                  <span class="text-body-2 font-weight-bold">{{ (s.fullName ?? '?')[0]?.toUpperCase() }}</span>
                </v-avatar>

                <div class="flex-grow-1" style="min-width: 180px">
                  <div class="text-body-1 font-weight-medium">{{ s.fullName ?? '—' }}</div>
                  <div class="text-caption text-medium-emphasis">
                    <template v-if="s.hemisId">HEMIS ID: {{ s.hemisId }}</template>
                  </div>
                </div>

                <v-chip v-if="s.hasObservationCard" color="success" variant="tonal" prepend-icon="mdi-check">
                  Kuzatuv kartasi to'ldirilgan
                </v-chip>
                <v-btn
                  v-else
                  color="primary"
                  variant="flat"
                  size="small"
                  prepend-icon="mdi-clipboard-text-outline"
                  @click="fillCard(s)"
                >
                  Kuzatuv kartasini to'ldirish
                </v-btn>
              </div>
            </v-list-item>
          </template>
        </v-list>
      </v-card>
    </template>

    <v-snackbar v-model="toastOpen" location="top end" color="error" timeout="2400">{{ toast }}</v-snackbar>
  </div>
</template>
