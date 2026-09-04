<script setup lang="ts">
import type { AssignmentDto } from '@/types/domain'

// Placeholder — wired to GET /admin/assignments once the backend exists.
const assignments: AssignmentDto[] = [
  { id: 'as1', categoryId: 'c1', categoryName: 'Temperament testi', facultyId: 'f1', groupId: 'g1', groupName: '21-FIL-14', startAt: '2026-09-01', endAt: '2026-09-12' },
  { id: 'as2', categoryId: 'c2', categoryName: 'Psixogeometrik test', facultyId: 'f1', groupId: 'g2', groupName: '21-FIL-15', startAt: '2026-09-03', endAt: '2026-09-14' },
  { id: 'as3', categoryId: 'c3', categoryName: 'Nevrasteniya so‘rovnomasi', facultyId: 'f2', groupId: 'g3', groupName: '22-TAR-03', startAt: '2026-08-28', endAt: '2026-09-15' },
]
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-1 flex-wrap" style="gap: 12px">
      <div>
        <h1 class="text-display text-h4 font-weight-600 mb-1">Tayinlashlar</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Guruhlarga tayinlangan testlar ro‘yxati.</p>
      </div>
      <v-btn color="primary" class="text-none" prepend-icon="mdi-plus">Yangi tayinlash</v-btn>
    </div>

    <v-card elevation="1" class="mt-4">
      <v-table>
        <thead>
          <tr>
            <th>Metodika</th>
            <th>Guruh</th>
            <th>Boshlanishi</th>
            <th>Tugashi</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in assignments" :key="a.id">
            <td class="font-weight-600">{{ a.categoryName }}</td>
            <td><v-chip size="small" variant="tonal" color="primary">{{ a.groupName }}</v-chip></td>
            <td>{{ a.startAt }}</td>
            <td>{{ a.endAt }}</td>
            <td class="text-right">
              <v-btn icon="mdi-chart-box-outline" variant="text" size="small" color="secondary" />
              <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
