<script setup>
import { pluriel } from './candidat'

defineProps({
  offres: { type: Array, required: true },
  selection: { type: Number, default: null }, // id de l'offre choisie
})
const emit = defineEmits(['choisir'])

const classeEtat = (etat) => (etat === 'PUBLIEE' ? 'bg-success' : etat === 'BROUILLON' ? 'bg-secondary' : 'bg-dark')
</script>

<template>
  <div class="list-group shadow-sm">
    <button v-for="o in offres" :key="o.id" type="button"
            class="list-group-item list-group-item-action" :class="{ active: o.id === selection }"
            @click="emit('choisir', o.id)">
      <div class="d-flex justify-content-between align-items-center">
        <strong class="small">{{ o.reference }}</strong>
        <span class="badge" :class="classeEtat(o.etat)">{{ o.etat }}</span>
      </div>
      <div>{{ o.postes || 'Poste à pourvoir' }}</div>
      <div class="small" :class="o.id === selection ? '' : 'text-muted'">
        {{ pluriel(o.nbCandidatures, 'candidature') }}
        <span v-if="o.nbNouvelles" class="badge bg-primary ms-1">{{ pluriel(o.nbNouvelles, 'nouvelle') }}</span>
      </div>
    </button>
  </div>
</template>
