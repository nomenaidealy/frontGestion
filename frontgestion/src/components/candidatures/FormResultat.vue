<script setup>
import { computed, reactive, ref } from 'vue'
import { selectionApi, formatScore } from '@/api/selection'

const props = defineProps({ evaluation: { type: Object, required: true } })
const emit = defineEmits(['enregistre', 'annuler'])

const aujourdhui = new Date().toISOString().slice(0, 10)
const form = reactive({ dateRealisee: aujourdhui, presence: 'PRESENT', score: '', decision: '', commentaire: '' })
const erreurs = ref({})
const error = ref(null)
const envoi = ref(false)
const pre = `res-${props.evaluation.id}`

const aMinimum = computed(() => props.evaluation.scoreMin !== null && props.evaluation.scoreMin !== undefined)
const absent = computed(() => form.presence === 'ABSENT')
/** Ce que le back décidera, pour prévenir l'évaluateur avant l'envoi. */
const issue = computed(() => {
  if (absent.value) return { texte: 'Absent : la candidature sera refusée.', classe: 'text-danger' }
  if (aMinimum.value && form.score !== '') {
    return Number(form.score) >= Number(props.evaluation.scoreMin)
      ? { texte: 'Score suffisant : admis à ce niveau.', classe: 'text-success' }
      : { texte: 'Score insuffisant : la candidature sera refusée.', classe: 'text-danger' }
  }
  if (!aMinimum.value && form.decision === 'NON_ADMIS') return { texte: 'Non admis : la candidature sera refusée.', classe: 'text-danger' }
  return null
})

function verifier() {
  const e = {}
  if (!form.dateRealisee) e.dateRealisee = 'La date est obligatoire'
  else if (form.dateRealisee > aujourdhui) e.dateRealisee = 'La date ne peut pas être dans le futur'
  if (!absent.value) {
    const s = form.score === '' ? null : Number(form.score)
    if (aMinimum.value && s === null) e.score = 'Le score est obligatoire pour ce niveau'
    if (s !== null && (Number.isNaN(s) || s < 0 || s > 20)) e.score = 'Le score est entre 0 et 20'
    if (!aMinimum.value && !form.decision) e.decision = 'Choisissez une décision'
  }
  return e
}

async function enregistrer() {
  erreurs.value = verifier()
  if (Object.keys(erreurs.value).length) return
  envoi.value = true
  error.value = null
  try {
    emit('enregistre', await selectionApi.resultat(props.evaluation.id, {
      dateRealisee: form.dateRealisee,
      score: absent.value || form.score === '' ? null : Number(form.score),
      decision: absent.value ? 'ABSENT' : (aMinimum.value ? null : form.decision),
      commentaire: form.commentaire.trim() || null,
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
    <div class="row g-2 align-items-start">
      <div class="col-md-3">
        <label :for="`${pre}-date`" class="form-label small mb-1">Date *</label>
        <input :id="`${pre}-date`" v-model="form.dateRealisee" type="date" :max="aujourdhui"
               class="form-control form-control-sm" :class="{ 'is-invalid': erreurs.dateRealisee }">
        <div class="invalid-feedback">{{ erreurs.dateRealisee }}</div>
      </div>
      <div class="col-md-3">
        <span class="form-label small mb-1 d-block">Présence</span>
        <div class="btn-group btn-group-sm" role="group">
          <input :id="`${pre}-present`" v-model="form.presence" type="radio" class="btn-check" value="PRESENT">
          <label class="btn btn-outline-secondary" :for="`${pre}-present`">Présent</label>
          <input :id="`${pre}-absent`" v-model="form.presence" type="radio" class="btn-check" value="ABSENT">
          <label class="btn btn-outline-secondary" :for="`${pre}-absent`">Absent</label>
        </div>
      </div>
      <template v-if="!absent">
        <div class="col-md-3">
          <label :for="`${pre}-score`" class="form-label small mb-1">
            Score / 20 {{ aMinimum ? '*' : '' }}
          </label>
          <input :id="`${pre}-score`" v-model="form.score" type="number" min="0" max="20" step="0.25"
                 class="form-control form-control-sm" :class="{ 'is-invalid': erreurs.score }">
          <div class="invalid-feedback">{{ erreurs.score }}</div>
          <div v-if="aMinimum" class="form-text">Minimum : {{ formatScore(evaluation.scoreMin) }}</div>
        </div>
        <div v-if="!aMinimum" class="col-md-3">
          <span class="form-label small mb-1 d-block">Décision *</span>
          <div class="btn-group btn-group-sm" role="group" :class="{ 'is-invalid': erreurs.decision }">
            <input :id="`${pre}-admis`" v-model="form.decision" type="radio" class="btn-check" value="ADMIS">
            <label class="btn btn-outline-success" :for="`${pre}-admis`">Admis</label>
            <input :id="`${pre}-non-admis`" v-model="form.decision" type="radio" class="btn-check" value="NON_ADMIS">
            <label class="btn btn-outline-danger" :for="`${pre}-non-admis`">Non admis</label>
          </div>
          <div v-if="erreurs.decision" class="invalid-feedback d-block">{{ erreurs.decision }}</div>
        </div>
      </template>
      <div class="col-12">
        <label :for="`${pre}-commentaire`" class="form-label small mb-1">Commentaire</label>
        <textarea :id="`${pre}-commentaire`" v-model="form.commentaire" class="form-control form-control-sm" rows="2"
                  maxlength="2000" />
      </div>
    </div>
    <p v-if="issue" class="small mt-2 mb-0" :class="issue.classe">{{ issue.texte }}</p>
    <div class="d-flex gap-2 mt-2">
      <button type="submit" class="btn btn-primary btn-sm" :disabled="envoi">Enregistrer le résultat</button>
      <button type="button" class="btn btn-link btn-sm" @click="emit('annuler')">Annuler</button>
    </div>
  </form>
</template>
