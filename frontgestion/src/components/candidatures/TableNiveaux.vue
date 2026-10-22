<script setup>
import { computed, reactive, ref } from 'vue'
import { selectionApi, TYPES_EVALUATION, formatScore } from '@/api/selection'

const props = defineProps({
  niveaux: { type: Array, required: true },
  idOffre: { type: Number, default: null },  // null = niveaux communs
  modifiable: { type: Boolean, default: true },
})
const emit = defineEmits(['change'])

const enEdition = ref(null)  // id du niveau modifié, ou 'nouveau'
const form = reactive({ ordre: '', typeEvaluation: 'TEST', scoreMin: '' })
const erreurs = ref({})
const error = ref(null)
const envoi = ref(false)

const prochainOrdre = computed(() => Math.max(0, ...props.niveaux.map((n) => n.ordre)) + 1)

function editer(n) {
  error.value = null
  erreurs.value = {}
  if (n) Object.assign(form, { ordre: n.ordre, typeEvaluation: n.typeEvaluation, scoreMin: n.scoreMin ?? '' })
  else Object.assign(form, { ordre: prochainOrdre.value, typeEvaluation: 'ENTRETIEN_RH', scoreMin: '' })
  enEdition.value = n ? n.id : 'nouveau'
}

async function appeler(action) {
  envoi.value = true
  error.value = null
  try {
    await action()
    enEdition.value = null
    emit('change')
  } catch (e) {
    erreurs.value = e.champs ?? {}
    error.value = Object.keys(erreurs.value).length ? null : e.message
  } finally {
    envoi.value = false
  }
}

function enregistrer() {
  const e = {}
  const ordre = Number(form.ordre)
  if (!Number.isInteger(ordre) || ordre < 1) e.ordre = "L'ordre commence à 1"
  const min = form.scoreMin === '' ? null : Number(form.scoreMin)
  if (min !== null && (Number.isNaN(min) || min < 0 || min > 20)) e.scoreMin = 'Entre 0 et 20'
  erreurs.value = e
  if (Object.keys(e).length) return
  const niveau = { ordre, typeEvaluation: form.typeEvaluation, scoreMin: min, idOffreEmploi: props.idOffre }
  appeler(() => (enEdition.value === 'nouveau'
    ? selectionApi.creerNiveau(niveau)
    : selectionApi.modifierNiveau(enEdition.value, niveau)))
}

const supprimer = (n) => appeler(() => selectionApi.supprimerNiveau(n.id))
</script>

<template>
  <div>
    <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
    <div class="card shadow-sm">
      <div class="table-responsive">
        <table class="table mb-0 align-middle">
          <thead class="table-light">
            <tr><th style="width: 90px">Ordre</th><th>Type</th><th style="width: 170px">Score minimum</th><th class="text-end"></th></tr>
          </thead>
          <tbody>
            <tr v-if="!niveaux.length && enEdition !== 'nouveau'">
              <td colspan="4" class="text-center text-muted py-3">Aucun niveau : aucune candidature ne pourra être présélectionnée.</td>
            </tr>
            <template v-for="n in [...niveaux, ...(enEdition === 'nouveau' ? [{ id: 'nouveau' }] : [])]" :key="n.id">
              <tr v-if="enEdition === n.id">
                <td>
                  <input v-model="form.ordre" type="number" min="1" class="form-control form-control-sm"
                         :class="{ 'is-invalid': erreurs.ordre }" aria-label="Ordre">
                  <div class="invalid-feedback">{{ erreurs.ordre }}</div>
                </td>
                <td>
                  <select v-model="form.typeEvaluation" class="form-select form-select-sm" aria-label="Type"
                          :class="{ 'is-invalid': erreurs.typeEvaluation }">
                    <option v-for="(libelle, code) in TYPES_EVALUATION" :key="code" :value="code">{{ libelle }}</option>
                  </select>
                  <div class="invalid-feedback">{{ erreurs.typeEvaluation }}</div>
                </td>
                <td>
                  <input v-model="form.scoreMin" type="number" min="0" max="20" step="0.25" class="form-control form-control-sm"
                         :class="{ 'is-invalid': erreurs.scoreMin }" placeholder="aucun" aria-label="Score minimum">
                  <div class="invalid-feedback">{{ erreurs.scoreMin }}</div>
                </td>
                <td class="text-end text-nowrap">
                  <button type="button" class="btn btn-primary btn-sm" :disabled="envoi" @click="enregistrer">Enregistrer</button>
                  <button type="button" class="btn btn-link btn-sm" @click="enEdition = null">Annuler</button>
                </td>
              </tr>
              <tr v-else>
                <td>{{ n.ordre }}</td>
                <td>{{ TYPES_EVALUATION[n.typeEvaluation] ?? n.typeEvaluation }}</td>
                <td>{{ n.scoreMin !== null ? `${formatScore(n.scoreMin)} / 20` : "Décision de l'évaluateur" }}</td>
                <td class="text-end text-nowrap">
                  <span v-if="n.utilise" class="badge bg-light text-muted border" title="Des candidatures sont déjà évaluées sur ce niveau">
                    Utilisé
                  </span>
                  <template v-else-if="modifiable">
                    <button type="button" class="btn btn-outline-secondary btn-sm" @click="editer(n)">Modifier</button>
                    <button type="button" class="btn btn-outline-danger btn-sm ms-1" :disabled="envoi" @click="supprimer(n)">Supprimer</button>
                  </template>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
    <button v-if="modifiable && enEdition === null" type="button" class="btn btn-outline-primary btn-sm mt-2" @click="editer(null)">
      + Ajouter un niveau
    </button>
  </div>
</template>
