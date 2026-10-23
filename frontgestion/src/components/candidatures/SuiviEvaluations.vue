<script setup>
import { ref } from 'vue'
import { TYPES_EVALUATION, DECISIONS, BADGE_DECISION, STATUTS_EVALUATION, formatScore } from '@/api/selection'
import { formatDate } from '@/views/offres/format'
import FormPlanification from './FormPlanification.vue'
import FormResultat from './FormResultat.vue'

defineProps({
  evaluations: { type: Array, required: true },
  postes: { type: Array, default: () => [] },
  // postes de l'utilisateur : seul le poste responsable (ou son délégué) saisit le résultat
  mesPostes: { type: Array, default: () => [] },
})
// change(dossier) : une évaluation a été planifiée ou notée
const emit = defineEmits(['change'])

// Formulaire ouvert : { id, type: 'planifier' | 'resultat' }
const ouvert = ref(null)
const estOuvert = (e, type) => ouvert.value?.id === e.id && ouvert.value.type === type

function enregistre(dossier) {
  ouvert.value = null
  emit('change', dossier)
}
</script>

<template>
  <div>
    <h6>Sélection</h6>
    <ol class="list-group list-group-numbered mb-0">
      <li v-for="e in evaluations" :key="e.id" class="list-group-item" :class="{ 'list-group-item-primary': e.statut === 'A_FAIRE' }">
        <div class="d-inline-flex flex-wrap justify-content-between align-items-start gap-2" style="width: calc(100% - 1.5rem)">
          <div>
            <strong>{{ TYPES_EVALUATION[e.typeEvaluation] ?? e.typeEvaluation }}</strong>
            <span class="text-muted small">
              · {{ e.scoreMin !== null ? `minimum ${formatScore(e.scoreMin)}/20` : 'décision de l\'évaluateur' }}
            </span>
            <div class="small">
              <template v-if="e.datePrevue">
                Prévu le {{ formatDate(e.datePrevue) }}<span v-if="e.posteResponsable"> · {{ e.posteResponsable }}</span><span v-if="e.libelle"> · {{ e.libelle }}</span>
              </template>
              <span v-else-if="e.statut !== 'FAITE'" class="text-muted">Pas encore planifié</span>
            </div>
            <div v-if="e.decision" class="small">
              <span class="badge" :class="BADGE_DECISION[e.decision]">{{ DECISIONS[e.decision] }}</span>
              <span v-if="e.score !== null" class="ms-1">{{ formatScore(e.score) }}/20</span>
              · le {{ formatDate(e.dateRealisee) }}<span v-if="e.evaluateur"> par {{ e.evaluateur }}</span>
              <div v-if="e.commentaire" class="fst-italic">« {{ e.commentaire }} »</div>
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge" :class="STATUTS_EVALUATION[e.statut]?.badge">{{ STATUTS_EVALUATION[e.statut]?.libelle }}</span>
            <button v-if="e.statut === 'A_FAIRE' || e.statut === 'EN_ATTENTE'" type="button"
                    class="btn btn-outline-secondary btn-sm" @click="ouvert = { id: e.id, type: 'planifier' }">
              {{ e.datePrevue ? 'Replanifier' : 'Planifier' }}
            </button>
            <button v-if="e.statut === 'A_FAIRE' && mesPostes.includes(e.idPosteResponsable)" type="button" class="btn btn-primary btn-sm"
                    @click="ouvert = { id: e.id, type: 'resultat' }">
              Saisir le résultat
            </button>
            <span v-else-if="e.statut === 'A_FAIRE'" class="small text-muted">
              {{ e.idPosteResponsable ? `Résultat saisi par : ${e.posteResponsable}` : 'Poste responsable à choisir en planifiant' }}
            </span>
          </div>
        </div>
        <FormPlanification v-if="estOuvert(e, 'planifier')" :evaluation="e" :postes="postes"
                           @enregistre="enregistre" @annuler="ouvert = null" />
        <FormResultat v-if="estOuvert(e, 'resultat')" :evaluation="e" @enregistre="enregistre" @annuler="ouvert = null" />
      </li>
    </ol>
  </div>
</template>
