<script setup>
import { ETATS_CANDIDATURE, BADGE_ETAT } from '@/api/candidatures'

defineProps({ etat: { type: String, required: true } })
</script>

<template>
  <span class="badge" :class="BADGE_ETAT[etat]">{{ ETATS_CANDIDATURE[etat] ?? etat }}</span>
</template>
