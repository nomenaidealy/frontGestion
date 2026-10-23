<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, onMounted, ref } from 'vue'
import { NonConnecteError } from '@/api/http'
import { selectionApi, TYPES_EVALUATION, formatScore } from '@/api/selection'
import { formatDate } from '@/views/offres/format'
import FormResultat from '@/components/candidatures/FormResultat.vue'
import AlerteConnexion from '@/components/candidatures/AlerteConnexion.vue'

const donnees = ref(null)
const chargement = ref(true)
const nonConnecte = ref(false)
const error = ref(null)
const ouverte = ref(null)   // id de l'évaluation dont le formulaire est ouvert
const message = ref(null)   // confirmation après une saisie

const aFaire = computed(() => donnees.value?.evaluations.filter((e) => e.aSaisir) ?? [])
const plusTard = computed(() => donnees.value?.evaluations.filter((e) => !e.aSaisir) ?? [])

async function charger() {
  try {
    donnees.value = await selectionApi.mesEvaluations()
    error.value = null
  } catch (e) {
    if (e instanceof NonConnecteError) nonConnecte.value = true
    else error.value = e.message
  } finally {
    chargement.value = false
  }
}

async function enregistre(e, dossier) {
  ouverte.value = null
  const issue = { RETENUE: 'la candidature est retenue', REFUSE: 'la candidature est refusée' }[dossier.etat]
  message.value = `Résultat enregistré pour ${e.candidat}${issue ? ` : ${issue}` : ''}.`
  await charger()
}

const echeance = (iso) => {
  if (!iso) return { texte: 'Date à fixer par la RH', classe: 'text-muted' }
  const auj = new Date().toISOString().slice(0, 10)
  if (iso < auj) return { texte: `Prévu le ${formatDate(iso)} (passé)`, classe: 'text-danger' }
  if (iso === auj) return { texte: "Aujourd'hui", classe: 'text-primary fw-semibold' }
  return { texte: `Prévu le ${formatDate(iso)}`, classe: '' }
}

onMounted(charger)
</script>

<template>
  <div class="container" style="max-width: 960px">
    <PageHeader titre="Mes évaluations" sous-titre="Tests et entretiens que vous faites passer aux candidats, pour votre poste." />

    <div v-if="chargement" class="text-muted">Chargement…</div>
    <AlerteConnexion v-else-if="nonConnecte" />
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="!donnees.relieAEmploye" class="alert alert-warning">
      Votre compte n'est relié à aucun employé : impossible de savoir quel poste vous occupez.
      Demandez à l'administrateur de relier votre compte à votre fiche employé.
    </div>

    <template v-else>
      <div v-if="message" class="alert alert-success alert-dismissible">
        {{ message }}
        <button type="button" class="btn-close" aria-label="Fermer" @click="message = null" />
      </div>

      <h5 class="mt-2">À faire passer</h5>
      <div v-if="!aFaire.length" class="card card-body text-muted text-center mb-4">Aucune évaluation à faire pour le moment.</div>
      <div v-for="e in aFaire" :key="e.id" class="card shadow-sm mb-3">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between gap-2">
            <div>
              <div class="small text-muted">{{ e.referenceOffre }} · niveau {{ e.ordre }}</div>
              <h6 class="mb-1">{{ TYPES_EVALUATION[e.typeEvaluation] ?? e.typeEvaluation }} — {{ e.candidat }}</h6>
              <div class="small">
                <span :class="echeance(e.datePrevue).classe">{{ echeance(e.datePrevue).texte }}</span>
                <span v-if="e.libelle"> · {{ e.libelle }}</span>
                · {{ e.scoreMin !== null ? `minimum ${formatScore(e.scoreMin)}/20` : 'vous décidez : admis ou non' }}
              </div>
            </div>
            <div>
              <button v-if="ouverte !== e.id" type="button" class="btn btn-primary btn-sm" @click="ouverte = e.id; message = null">
                Saisir le résultat
              </button>
            </div>
          </div>
          <FormResultat v-if="ouverte === e.id" :evaluation="e" @enregistre="(d) => enregistre(e, d)" @annuler="ouverte = null" />
        </div>
      </div>

      <template v-if="plusTard.length">
        <h5 class="mt-4">Plus tard</h5>
        <p class="text-muted small">Le candidat doit d'abord réussir les niveaux précédents.</p>
        <ul class="list-group mb-4">
          <li v-for="e in plusTard" :key="e.id" class="list-group-item d-flex flex-wrap justify-content-between gap-2">
            <span>{{ TYPES_EVALUATION[e.typeEvaluation] ?? e.typeEvaluation }} — {{ e.candidat }}
              <span class="text-muted small">· {{ e.referenceOffre }} · niveau {{ e.ordre }}</span></span>
            <span class="small" :class="echeance(e.datePrevue).classe">{{ echeance(e.datePrevue).texte }}</span>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>
