<script setup>
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
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="m-0">Besoins dont le recrutement est ouvert</h4>
      <RouterLink to="/offres" class="btn btn-outline-secondary btn-sm">Voir les offres</RouterLink>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="card shadow-sm">
      <table class="table table-hover mb-0 align-middle">
        <thead class="table-light">
          <tr><th>Réf.</th><th>Poste</th><th>Unité</th><th>Effectif</th><th>Date souhaitée</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-if="chargement"><td colspan="6" class="text-center text-muted py-4">Chargement…</td></tr>
          <tr v-else-if="!besoins.length">
            <td colspan="6" class="text-center text-muted py-4">
              Aucun besoin avec recrutement ouvert.
            </td>
          </tr>
          <tr v-for="b in besoins" :key="b.id">
            <td>{{ b.reference }}</td>
            <td>{{ b.poste ?? '—' }}</td>
            <td>{{ b.unite }}</td>
            <td>{{ b.effectif }}</td>
            <td>{{ formatDate(b.dateSouhaitee) }}</td>
            <td class="text-end">
              <RouterLink class="btn btn-primary btn-sm"
                          :to="{ path: '/offres/nouvelle', query: { idBesoin: b.id } }">
                Créer l'offre
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
