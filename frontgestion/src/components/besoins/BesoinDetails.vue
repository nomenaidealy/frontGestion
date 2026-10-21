<script setup>
import BesoinValidationButton from './BesoinValidationButton.vue'

defineProps({
  besoin: { type: Object, default: null },
  canValidate: Boolean,
  validating: Boolean,
})
defineEmits(['validate'])

function display(value) {
  return value === null || value === undefined || value === '' ? 'Non renseigne' : value
}
</script>

<template>
  <section v-if="besoin" class="besoin-details panel">
    <div class="details-header">
      <div><span class="eyebrow">FICHE DE BESOIN</span><h2>{{ display(besoin.reference) }}</h2><p>{{ display(besoin.typeBesoin) }}</p></div>
      <span class="state-pill large" :class="String(besoin.etatActuel || '').toLowerCase()">{{ display(besoin.etatActuel) }}</span>
    </div>
    <div class="details-grid">
      <div class="detail-field"><span>Unite organisationnelle</span><strong>{{ display(besoin.uniteOrgaLibelle) }}</strong><small>{{ display(besoin.uniteOrgaCode) }}</small></div>
      <div class="detail-field"><span>Motif</span><strong>{{ display(besoin.motifLibelle) }}</strong><small>{{ display(besoin.precisionMotif) }}</small></div>
      <div class="detail-field"><span>Effectif demande</span><strong>{{ display(besoin.effectif) }}</strong></div>
      <div class="detail-field"><span>Date souhaitee</span><strong>{{ display(besoin.dateSouhaitee) }}</strong></div>
      <div class="detail-field"><span>Budget estime</span><strong>{{ display(besoin.budgetEstime) }}</strong></div>
      <div class="detail-field"><span>Demandeur</span><strong>{{ display(besoin.userLogin) }}</strong></div>
    </div>
    <div class="details-footer"><span class="muted">La validation declenche l'etape suivante du workflow.</span><BesoinValidationButton :disabled="!canValidate" :loading="validating" @validate="$emit('validate')" /></div>
  </section>
  <section v-else class="details-placeholder panel"><div class="empty-icon">⌁</div><h2>Selectionnez une fiche</h2><p>Choisissez un besoin dans la liste pour consulter ses informations.</p></section>
</template>
