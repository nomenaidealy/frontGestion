<script setup>
import { reactive, ref } from 'vue'
import { selectionApi } from '@/api/selection'

const props = defineProps({
  evaluation: { type: Object, required: true },
  postes: { type: Array, required: true },
})
// enregistre(dossier) : planification acceptée ; annuler : formulaire fermé
const emit = defineEmits(['enregistre', 'annuler'])

const form = reactive({
  datePrevue: props.evaluation.datePrevue ?? '',
  idPosteResponsable: props.evaluation.idPosteResponsable ?? '',
  libelle: props.evaluation.libelle ?? '',
})
const erreurs = ref({})
const error = ref(null)
const envoi = ref(false)
const pre = `plan-${props.evaluation.id}`

async function enregistrer() {
  const e = {}
  if (!form.datePrevue) e.datePrevue = 'La date prévue est obligatoire'
  if (!form.idPosteResponsable) e.idPosteResponsable = 'Choisissez le poste responsable'
  erreurs.value = e
  if (Object.keys(e).length) return
  envoi.value = true
  error.value = null
  try {
    emit('enregistre', await selectionApi.planifier(props.evaluation.id, {
      datePrevue: form.datePrevue,
      idPosteResponsable: Number(form.idPosteResponsable),
      libelle: form.libelle.trim() || null,
    }))
  } catch (err) {
    erreurs.value = err.champs ?? {}
    error.value = Object.keys(erreurs.value).length ? null : err.message
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <form class="border rounded p-3 bg-light mt-2" novalidate @submit.prevent="enregistrer">
    <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
    <div class="row g-2">
      <div class="col-md-3">
        <label :for="`${pre}-date`" class="form-label small mb-1">Date prévue *</label>
        <input :id="`${pre}-date`" v-model="form.datePrevue" type="date" class="form-control form-control-sm"
               :class="{ 'is-invalid': erreurs.datePrevue }">
        <div class="invalid-feedback">{{ erreurs.datePrevue }}</div>
      </div>
      <div class="col-md-5">
        <label :for="`${pre}-poste`" class="form-label small mb-1">Poste responsable *</label>
        <select :id="`${pre}-poste`" v-model="form.idPosteResponsable" class="form-select form-select-sm"
                :class="{ 'is-invalid': erreurs.idPosteResponsable }">
          <option value="" disabled>Choisir…</option>
          <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.libelle }} — {{ p.unite }}</option>
        </select>
        <div class="invalid-feedback">{{ erreurs.idPosteResponsable }}</div>
        <div v-if="evaluation.idPosteResponsable && Number(form.idPosteResponsable) === evaluation.idPosteResponsable" class="form-text">
          Désigné d'après le niveau et le poste à pourvoir ; vous pouvez en choisir un autre.
        </div>
      </div>
      <div class="col-md-4">
        <label :for="`${pre}-libelle`" class="form-label small mb-1">Précision</label>
        <input :id="`${pre}-libelle`" v-model="form.libelle" class="form-control form-control-sm" maxlength="255"
               placeholder="Ex. : salle B, 9 h">
      </div>
    </div>
    <div class="d-flex gap-2 mt-2">
      <button type="submit" class="btn btn-primary btn-sm" :disabled="envoi">Enregistrer</button>
      <button type="button" class="btn btn-link btn-sm" @click="emit('annuler')">Annuler</button>
    </div>
  </form>
</template>
