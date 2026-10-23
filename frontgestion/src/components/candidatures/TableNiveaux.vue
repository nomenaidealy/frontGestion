<script setup>
import { computed, reactive, ref } from 'vue'
import { selectionApi, TYPES_EVALUATION, formatScore } from '@/api/selection'

const props = defineProps({
  niveaux: { type: Array, required: true },
  idOffre: { type: Number, default: null },  // null = niveaux communs
  modifiable: { type: Boolean, default: true },
  postes: { type: Array, default: () => [] },   // postes actifs, pour le choix d'un poste fixe
})
const emit = defineEmits(['change'])

const enEdition = ref(null)  // id du niveau modifié, ou 'nouveau'
const regleSeule = ref(false)   // niveau déjà utilisé : seule la règle du poste responsable se modifie
const REGLES = {
  '': 'Choisi à chaque planification',
  SUPERIEUR: 'Supérieur direct du poste à pourvoir',
  RESPONSABLE_UNITE: "Responsable de l'unité du poste à pourvoir",
  POSTE_FIXE: 'Un poste fixe',
}
const form = reactive({ ordre: '', typeEvaluation: 'TEST', scoreMin: '', responsableRegle: '', idPosteResponsable: '' })
const erreurs = ref({})
const error = ref(null)
const envoi = ref(false)

const prochainOrdre = computed(() => Math.max(0, ...props.niveaux.map((n) => n.ordre)) + 1)

function editer(n) {
  error.value = null
  erreurs.value = {}
  if (n) Object.assign(form, { ordre: n.ordre, typeEvaluation: n.typeEvaluation, scoreMin: n.scoreMin ?? '', responsableRegle: n.responsableRegle ?? '', idPosteResponsable: n.idPosteResponsable ?? '' })
  else Object.assign(form, { ordre: prochainOrdre.value, typeEvaluation: 'ENTRETIEN_RH', scoreMin: '', responsableRegle: '', idPosteResponsable: '' })
  regleSeule.value = !!n?.utilise
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
  if (form.responsableRegle === 'POSTE_FIXE' && !form.idPosteResponsable) e.idPosteResponsable = 'Choisissez le poste'
  erreurs.value = e
  if (Object.keys(e).length) return
  const niveau = {
    ordre, typeEvaluation: form.typeEvaluation, scoreMin: min, idOffreEmploi: props.idOffre,
    responsableRegle: form.responsableRegle || null,
    idPosteResponsable: form.responsableRegle === 'POSTE_FIXE' ? Number(form.idPosteResponsable) : null,
  }
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
            <tr><th style="width: 90px">Ordre</th><th>Type</th><th style="width: 150px">Score minimum</th><th>Poste responsable</th><th class="text-end"></th></tr>
          </thead>
          <tbody>
            <tr v-if="!niveaux.length && enEdition !== 'nouveau'">
              <td colspan="5" class="text-center text-muted py-3">Aucun niveau : aucune candidature ne pourra être présélectionnée.</td>
            </tr>
            <template v-for="n in [...niveaux, ...(enEdition === 'nouveau' ? [{ id: 'nouveau' }] : [])]" :key="n.id">
              <tr v-if="enEdition === n.id">
                <td>
                  <input v-model="form.ordre" type="number" min="1" class="form-control form-control-sm" :disabled="regleSeule"
                         :class="{ 'is-invalid': erreurs.ordre }" aria-label="Ordre">
                  <div class="invalid-feedback">{{ erreurs.ordre }}</div>
                </td>
                <td>
                  <select v-model="form.typeEvaluation" class="form-select form-select-sm" aria-label="Type" :disabled="regleSeule"
                          :class="{ 'is-invalid': erreurs.typeEvaluation }">
                    <option v-for="(libelle, code) in TYPES_EVALUATION" :key="code" :value="code">{{ libelle }}</option>
                  </select>
                  <div class="invalid-feedback">{{ erreurs.typeEvaluation }}</div>
                </td>
                <td>
                  <input v-model="form.scoreMin" type="number" min="0" max="20" step="0.25" class="form-control form-control-sm" :disabled="regleSeule"
                         :class="{ 'is-invalid': erreurs.scoreMin }" placeholder="aucun" aria-label="Score minimum">
                  <div class="invalid-feedback">{{ erreurs.scoreMin }}</div>
                </td>
                <td>
                  <select v-model="form.responsableRegle" class="form-select form-select-sm" aria-label="Poste responsable">
                    <option v-for="(libelle, code) in REGLES" :key="code" :value="code">{{ libelle }}</option>
                  </select>
                  <select v-if="form.responsableRegle === 'POSTE_FIXE'" v-model="form.idPosteResponsable"
                          class="form-select form-select-sm mt-1" :class="{ 'is-invalid': erreurs.idPosteResponsable }" aria-label="Poste fixe">
                    <option value="" disabled>Choisir un poste…</option>
                    <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.libelle }} — {{ p.unite }}</option>
                  </select>
                  <div class="invalid-feedback">{{ erreurs.idPosteResponsable }}</div>
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
                <td>
                  <template v-if="!n.responsableRegle"><span class="text-muted">Choisi à chaque planification</span></template>
                  <template v-else-if="n.responsableRegle === 'POSTE_FIXE'">{{ n.posteFixe }}</template>
                  <template v-else>{{ REGLES[n.responsableRegle] }}</template>
                  <div v-if="n.responsableRegle !== 'POSTE_FIXE' && n.responsableApercu" class="small text-muted">→ {{ n.responsableApercu }}</div>
                </td>
                <td class="text-end text-nowrap">
                  <template v-if="n.utilise">
                    <span class="badge bg-light text-muted border" title="Des candidatures sont déjà évaluées sur ce niveau : seul le poste responsable peut changer">
                      Utilisé
                    </span>
                    <button v-if="modifiable" type="button" class="btn btn-outline-secondary btn-sm ms-1" @click="editer(n)">Poste responsable</button>
                  </template>
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
