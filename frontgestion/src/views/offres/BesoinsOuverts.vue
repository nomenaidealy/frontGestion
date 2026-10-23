<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
// P4 – Besoins dont le recrutement est ouvert (en attendant le bouton « Ouvrir Recrutement » de P3)
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { offresApi } from '@/api/offres'
import { formatDate } from './format'

const route = useRoute()
const besoins = ref([])
const error = ref(route.query.error || null)
const chargement = ref(true)

onMounted(async () => {
  try {
    besoins.value = await offresApi.besoinsOuverts()
  } catch (e) {
    error.value = e.message
  } finally {
    chargement.value = false
  }
})
</script>

<template>
  <div class="container">
    <PageHeader titre="Besoins à publier" sous-titre="Postes des besoins validés qui attendent leur offre d'emploi. Un besoin qui demande plusieurs postes donne une offre par poste." retour="/offres" retour-libelle="Offres d'emploi" />

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="card shadow-sm">
      <table class="table table-hover mb-0 align-middle">
        <thead class="table-light">
          <tr><th>Besoin</th><th>Poste</th><th>Unité</th><th>Places à pourvoir</th><th>Date souhaitée</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-if="chargement"><td colspan="6" class="text-center text-muted py-4">Chargement…</td></tr>
          <tr v-else-if="!besoins.length">
            <td colspan="6" class="text-center text-muted py-4">
              Aucun poste en attente d'offre : tous les besoins ouverts ont leur offre.
            </td>
          </tr>
          <tr v-for="b in besoins" :key="`${b.id}-${b.idPoste}`">
            <td>{{ b.reference }}</td>
            <td>{{ b.poste ?? '—' }}</td>
            <td>{{ b.unite }}</td>
            <td>{{ b.aPourvoir }}<span v-if="b.aPourvoir !== b.effectif" class="text-muted small"> sur {{ b.effectif }}</span></td>
            <td>{{ formatDate(b.dateSouhaitee) }}</td>
            <td class="text-end">
              <RouterLink class="btn btn-primary btn-sm"
                          :to="{ path: '/offres/nouvelle', query: { idBesoin: b.id, idPoste: b.idPoste } }">
                Créer l'offre
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
