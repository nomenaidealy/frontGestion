<script setup>
import { ref } from 'vue'
import { selectionApi } from '@/api/selection'

const props = defineProps({
  idCandidature: { type: Number, required: true },
  selection: { type: Object, required: true }, // réponse de selectionApi.dossier
})
// change(nouvelleSelection) : l'état de la candidature a changé
const emit = defineEmits(['change'])

const refusOuvert = ref(false)
const motif = ref('')
const erreurMotif = ref(null)
const error = ref(null)
const envoi = ref(false)

async function executer(action) {
  error.value = null
  erreurMotif.value = null
  envoi.value = true
  try {
    const nouvelle = await action()
    refusOuvert.value = false
    motif.value = ''
    emit('change', nouvelle)
  } catch (e) {
    if (e.champs?.commentaire) erreurMotif.value = e.champs.commentaire
    else error.value = e.message
  } finally {
    envoi.value = false
  }
}

const preselectionner = () => executer(() => selectionApi.preselectionner(props.idCandidature))

function refuser() {
  if (!motif.value.trim()) {
    erreurMotif.value = 'Indiquez le motif du refus'
    return
  }
  executer(() => selectionApi.refuser(props.idCandidature, motif.value.trim()))
}
</script>

<template>
  <div v-if="selection.peutPreselectionner || selection.peutRefuser" class="mb-3">
    <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
    <div v-if="!refusOuvert" class="d-flex flex-wrap gap-2">
      <button v-if="selection.peutPreselectionner" type="button" class="btn btn-success btn-sm" :disabled="envoi"
              @click="preselectionner">
        Présélectionner
      </button>
      <button v-if="selection.peutRefuser" type="button" class="btn btn-outline-danger btn-sm" :disabled="envoi"
              @click="refusOuvert = true">
        Refuser…
      </button>
    </div>
    <form v-else class="border rounded p-3 bg-light" novalidate @submit.prevent="refuser">
      <label for="motif-refus" class="form-label fw-semibold">Motif du refus *</label>
      <textarea id="motif-refus" v-model="motif" class="form-control" :class="{ 'is-invalid': erreurMotif }" rows="2"
                maxlength="2000" placeholder="Ex. : expérience insuffisante pour le poste" @input="erreurMotif = null" />
      <div class="invalid-feedback">{{ erreurMotif }}</div>
      <div class="d-flex gap-2 mt-2">
        <button type="submit" class="btn btn-danger btn-sm" :disabled="envoi">Confirmer le refus</button>
        <button type="button" class="btn btn-link btn-sm" @click="refusOuvert = false; erreurMotif = null">Annuler</button>
      </div>
    </form>
  </div>
</template>
