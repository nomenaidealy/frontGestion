<script setup>
import Statut from '@/components/ui/Statut.vue'
import { ETATS_CANDIDATURE, BADGE_ETAT } from '@/api/candidatures'

defineProps({ etat: { type: String, required: true } })
</script>

<template>
  <Statut type="candidature" :valeur="etat" />
</template>
