<script setup>
import Statut from '@/components/ui/Statut.vue'
import PageHeader from '@/components/ui/PageHeader.vue'
// P4 – Liste des offres d'emploi (RH)
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { offresApi } from '@/api/offres'
import { formatDate } from './format'

const route = useRoute()
const offres = ref([])
const error = ref(null)
const message = ref(route.query.message || null)
const chargement = ref(true)

async function charger() {
  chargement.value = true
  try {
    offres.value = await offresApi.liste()
    error.value = null
  } catch (e) {
    error.value = e.message
  } finally {
    chargement.value = false
  }
}

async function publier(o) {
  try {
    await offresApi.publier(o.id)
    message.value = `Offre ${o.ref} publiée`
    await charger()
  } catch (e) {
    error.value = e.message
  }
}

async function cloturer(o) {
  if (!window.confirm(`Clôturer l'offre ${o.ref} ? Elle ne recevra plus de candidatures.`)) return
  try {
    await offresApi.cloturer(o.id)
    message.value = `Offre ${o.ref} clôturée`
    error.value = null
    await charger()
  } catch (e) {
    error.value = e.message
  }
}

const MOTIFS = { DATE_LIMITE: 'date limite passée', POSTES_POURVUS: 'postes pourvus', MANUELLE: 'clôture manuelle' }

const badge = (etat) =>
  etat === 'PUBLIEE' ? 'bg-success' : etat === 'BROUILLON' ? 'bg-secondary' : 'bg-dark'

onMounted(charger)
</script>

<template>
  <div class="container">
    <PageHeader titre="Offres d'emploi" sous-titre="Offres créées à partir des besoins validés : brouillon, publication sur le site carrières, clôture.">
      <RouterLink to="/offres/besoins" class="btn btn-primary">Nouvelle offre</RouterLink>
    </PageHeader>

    <div v-if="message" class="alert alert-success">{{ message }}</div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="card shadow-sm">
      <table class="table table-hover mb-0 align-middle">
        <thead class="table-light">
          <tr>
            <th>Réf.</th><th>Besoin</th><th>Poste</th><th>Contrat</th>
            <th>Publication</th><th>Date limite</th><th>État</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="chargement"><td colspan="8" class="text-center text-muted py-4">Chargement…</td></tr>
          <tr v-else-if="!offres.length">
            <td colspan="8" class="text-center text-muted py-4">Aucune offre pour le moment.</td>
          </tr>
          <tr v-for="o in offres" :key="o.id">
            <td>{{ o.ref }}</td>
            <td>{{ o.besoinRef ?? o.idBesoin }}</td>
            <td>{{ o.poste ?? '—' }}</td>
            <td>{{ o.typeContrat ?? '—' }}</td>
            <td>{{ formatDate(o.datePublication) }}</td>
            <td>{{ formatDate(o.dateLimiteCandidature) }}</td>
            <td>
              <Statut type="offre" :valeur="o.etat" />
              <div v-if="o.motifCloture" class="small text-muted">{{ MOTIFS[o.motifCloture] ?? o.motifCloture }}</div>
            </td>
            <td class="text-end text-nowrap">
              <a v-if="o.pdfUrl" :href="o.pdfUrl" target="_blank" class="btn btn-outline-secondary btn-sm">PDF</a>
              <button v-if="o.etat === 'BROUILLON'" class="btn btn-success btn-sm ms-1" @click="publier(o)">
                Publier
              </button>
              <button v-if="o.cloturable && o.etat === 'PUBLIEE'" class="btn btn-outline-danger btn-sm ms-1" @click="cloturer(o)">
                Clôturer
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
