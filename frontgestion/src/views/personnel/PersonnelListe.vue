<script setup>
// P3 – Liste du personnel en poste, avec recherche
import { ref, onMounted, watch } from 'vue'
import { employesApi } from '@/api/employes'
import { formatDate } from '@/views/offres/format'

const employes = ref([])
const q = ref('')
const erreur = ref(null)
const chargement = ref(true)
let minuterie = null

async function charger() {
  chargement.value = true
  try {
    employes.value = await employesApi.liste(q.value.trim())
    erreur.value = null
  } catch (e) {
    erreur.value = e.message
  } finally {
    chargement.value = false
  }
}
onMounted(charger)
watch(q, () => { clearTimeout(minuterie); minuterie = setTimeout(charger, 300) })
</script>

<template>
  <div class="container" style="max-width: 1100px">
    <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
      <div>
        <h4 class="mb-1">Personnel</h4>
        <p class="text-muted mb-0">{{ employes.length }} employé(s) en poste</p>
      </div>
      <input v-model="q" type="search" class="form-control" style="max-width: 320px" placeholder="Nom, prénom ou matricule" aria-label="Rechercher">
    </div>
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div class="card shadow-sm">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light"><tr><th>Matricule</th><th>Nom</th><th>Poste</th><th>Unité</th><th>En poste depuis</th></tr></thead>
        <tbody>
          <tr v-if="chargement && !employes.length"><td colspan="5" class="text-center text-muted py-3">Chargement…</td></tr>
          <tr v-else-if="!employes.length"><td colspan="5" class="text-center text-muted py-3">Aucun employé trouvé.</td></tr>
          <tr v-for="e in employes" :key="e.id" style="cursor: pointer" @click="$router.push({ name: 'employe-fiche', params: { id: e.id } })">
            <td class="font-monospace small">{{ e.matricule }}</td>
            <td><RouterLink :to="{ name: 'employe-fiche', params: { id: e.id } }" @click.stop>{{ e.nom }} {{ e.prenoms }}</RouterLink></td>
            <td>{{ e.poste }}</td>
            <td>{{ e.unite }}</td>
            <td>{{ formatDate(e.dateEntree) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
