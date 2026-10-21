<script setup>
import { STATUT_OCCUPATION } from '@/constants/postes'

defineProps({
  statut: { type: String, required: true },
})
</script>

<template>
  <span class="badge" :class="statut === STATUT_OCCUPATION.OCCUPE ? 'occupe' : 'libre'">
    {{ statut }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.libre {
  background: #dbeafe;
  color: #1d4ed8;
}

.occupe {
  background: #fef3c7;
  color: #92400e;
}
</style>
