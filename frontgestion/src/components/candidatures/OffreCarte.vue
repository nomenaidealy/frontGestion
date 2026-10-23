<script setup>
import { computed } from 'vue'
import { candidaturesPubliquesApi as api } from '@/api/candidatures'
import { formatDate } from '@/views/offres/format'

const props = defineProps({ offre: { type: Object, required: true } })

function joursRestants(iso) {
  if (!iso) return null
  const [a, m, j] = iso.split('-').map(Number)
  const auj = new Date()
  auj.setHours(0, 0, 0, 0)
  return Math.round((new Date(a, m - 1, j) - auj) / 86_400_000)
}

const echeance = computed(() => {
  const j = joursRestants(props.offre.dateLimiteCandidature)
  if (j === null) return { texte: 'Sans date limite', classe: 'text-muted' }
  if (j <= 0) return { texte: "Dernier jour aujourd'hui", classe: 'text-danger fw-semibold' }
  if (j === 1) return { texte: 'Clôture demain', classe: 'text-danger fw-semibold' }
  return { texte: `Clôture dans ${j} jours`, classe: j <= 3 ? 'text-danger' : 'text-muted' }
})
</script>

<template>
  <div class="card shadow-sm mb-3">
    <div class="card-body d-flex flex-wrap justify-content-between gap-3">
      <div class="flex-grow-1" style="min-width: 0">
        <div class="small text-muted">{{ offre.reference }}</div>
        <h5 class="card-title mb-1">{{ offre.postes || 'Poste à pourvoir' }}</h5>
        <div class="text-muted mb-2">
          {{ offre.unite }}<span v-if="offre.direction && offre.direction !== offre.unite"> · {{ offre.direction }}</span>
        </div>
        <div class="small d-flex flex-wrap gap-3">
          <span v-if="offre.typeContrat">Contrat : {{ offre.typeContrat }}</span>
          <span>{{ offre.nbPostes }} poste{{ offre.nbPostes > 1 ? 's' : '' }}</span>
          <span v-if="offre.dateLimiteCandidature">Jusqu'au {{ formatDate(offre.dateLimiteCandidature) }}</span>
        </div>
      </div>
      <div class="d-flex flex-column align-items-end justify-content-between gap-2">
        <span class="small" :class="echeance.classe">{{ echeance.texte }}</span>
        <a v-if="offre.ficheDisponible" :href="api.urlFiche(offre.id)" target="_blank" rel="noopener" class="small">
          Voir la fiche (PDF)
        </a>
        <RouterLink :to="{ name: 'candidater', params: { id: offre.id } }" class="btn btn-primary btn-sm">
          Candidater
        </RouterLink>
      </div>
    </div>
  </div>
</template>
