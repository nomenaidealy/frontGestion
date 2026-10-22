<script setup>
// P3 – Fiche employé : identité, poste, contrats
import { ref, computed, onMounted, watch } from 'vue'
import { employesApi } from '@/api/employes'
import { formatDate } from '@/views/offres/format'

const props = defineProps({ id: [String, Number] })
const e = ref(null)
const erreur = ref(null)

async function charger() {
  try {
    e.value = await employesApi.fiche(props.id)
    erreur.value = null
  } catch (err) {
    erreur.value = err.message
  }
}
onMounted(charger)
watch(() => props.id, charger)

const STATUTS = { CREE: ['Créé', 'bg-secondary'], VALIDE: ['Validé', 'bg-info text-dark'], SIGNE: ['Signé', 'bg-success'], TERMINE: ['Terminé', 'bg-dark'], ANNULE: ['Annulé', 'bg-danger'] }
const statut = (s) => STATUTS[s] ?? [s, 'bg-secondary']
const contratActuel = computed(() => e.value?.contrats.find((c) => c.statut === 'SIGNE') ?? null)
const champ = (v) => v ?? '—'
</script>

<template>
  <div class="container" style="max-width: 1000px">
    <RouterLink to="/personnel" class="small">← Personnel</RouterLink>
    <div v-if="erreur" class="alert alert-danger mt-2">{{ erreur }}</div>
    <div v-if="!e && !erreur" class="text-muted mt-2">Chargement…</div>

    <template v-if="e">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mt-2 mb-3">
        <div>
          <h4 class="mb-1">{{ e.nom }} {{ e.prenoms }}</h4>
          <div class="text-muted">Matricule <span class="font-monospace">{{ e.matricule }}</span></div>
        </div>
        <span v-if="contratActuel" class="badge bg-success fs-6">{{ contratActuel.type }} en cours</span>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <div class="card h-100 shadow-sm"><div class="card-body">
            <h6 class="text-muted text-uppercase small">Identité</h6>
            <dl class="row mb-0 small">
              <dt class="col-5">Date de naissance</dt><dd class="col-7">{{ formatDate(e.dateNaissance) }}</dd>
              <dt class="col-5">Adresse</dt><dd class="col-7">{{ champ(e.adresse) }}</dd>
              <dt class="col-5">Téléphone</dt><dd class="col-7">{{ champ(e.telephone) }}</dd>
              <dt class="col-5">Email</dt><dd class="col-7">{{ champ(e.email) }}</dd>
              <dt class="col-5">CIN</dt><dd class="col-7">{{ champ(e.cin) }}</dd>
            </dl>
          </div></div>
        </div>
        <div class="col-md-6">
          <div class="card h-100 shadow-sm"><div class="card-body">
            <h6 class="text-muted text-uppercase small">Poste</h6>
            <dl class="row mb-0 small">
              <dt class="col-5">Poste</dt><dd class="col-7">{{ champ(e.codePoste) }} {{ champ(e.poste) }}</dd>
              <dt class="col-5">Unité</dt><dd class="col-7">{{ champ(e.unite) }}</dd>
              <dt class="col-5">Supérieur direct</dt><dd class="col-7">{{ champ(e.superieur) }}</dd>
              <dt class="col-5">En poste depuis</dt><dd class="col-7">{{ formatDate(e.dateEntree) }}</dd>
            </dl>
          </div></div>
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="card-header bg-white d-flex justify-content-between align-items-center">
          <span class="fw-semibold">Contrats</span>
          <RouterLink :to="{ name: 'contrats-employe', params: { idEmploye: e.id } }" class="small">Vue détaillée</RouterLink>
        </div>
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light"><tr><th>Référence</th><th>Type</th><th>Début</th><th>Fin prévue</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            <tr v-if="!e.contrats.length"><td colspan="6" class="text-center text-muted py-3">Aucun contrat enregistré dans le SIRH.</td></tr>
            <tr v-for="c in e.contrats" :key="c.id">
              <td>{{ c.reference }}<div v-if="c.referencePrecedent" class="small text-muted">suite de {{ c.referencePrecedent }}</div></td>
              <td>{{ c.type }}</td>
              <td>{{ formatDate(c.dateDebut) }}</td>
              <td>{{ formatDate(c.dateFinPrevue) }}</td>
              <td><span class="badge" :class="statut(c.statut)[1]">{{ statut(c.statut)[0] }}</span></td>
              <td class="text-end"><RouterLink :to="{ name: 'contrat-fiche', params: { id: c.id } }" class="btn btn-outline-secondary btn-sm">Ouvrir</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
