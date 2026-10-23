<script setup>
import { computed } from 'vue'
import { etat } from '@/utils/format'

// Pastille d'état : <Statut type="besoin" valeur="EN_ATTENTE" />
const props = defineProps({ type: { type: String, required: true }, valeur: { type: String, default: null } })
const e = computed(() => etat(props.type, props.valeur))
</script>

<template>
  <span class="status" :class="e.ton">{{ e.libelle }}</span>
</template>
