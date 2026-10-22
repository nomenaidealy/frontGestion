<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { besoinApi as api } from '@/api/besoinApi'

// Route attendue : { path: '/contrats/echeances', component: ContratsEcheances }
// (à déclarer AVANT '/contrats/:id', sinon "echeances" est pris pour un identifiant)

const delais = [7, 15, 30, 60, 90]
const jours = ref(30)
const contrats = ref([])
const erreur = ref('')
const chargement = ref(false)

async function charger() {
  erreur.value = ''
  chargement.value = true
  try {
    contrats.value = await api.echeances(jours.value)
  } catch (e) {
    console.error(e)
    erreur.value = e.response?.data?.message || e.message
  } finally {
    chargement.value = false
  }
}

onMounted(charger)
watch(jours, charger)

// Nombre de jours entre aujourd'hui et la fin prévue (négatif si déjà dépassée)
function joursRestants(dateFin) {
  if (!dateFin) return null
  const fin = new Date(`${String(dateFin).slice(0, 10)}T00:00:00`)
  const auj = new Date()
  auj.setHours(0, 0, 0, 0)
  return Math.round((fin - auj) / 86400000)
}

function classeUrgence(n) {
  if (n === null) return 'bg-secondary'
  if (n < 0) return 'bg-dark'
  if (n <= 7) return 'bg-danger'
  if (n <= 15) return 'bg-warning text-dark'
  return 'bg-info'
}

function texteUrgence(n) {
  if (n === null) return 'Sans limite'
  if (n < 0) return `Échu depuis ${-n} j`
  if (n === 0) return "Aujourd'hui"
  return `Dans ${n} j`
}

// Les plus proches de l'échéance en premier
const lignes = computed(() =>
  contrats.value
    .map(c => ({ ...c, restants: joursRestants(c.dateFinPrevue) }))
    .sort((a, b) => (a.restants ?? Infinity) - (b.restants ?? Infinity)))
</script>

<template>
  <div class="container">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">Contrats arrivant à échéance</h2>
      <button class="btn btn-outline-secondary" :disabled="chargement" @click="charger">Actualiser</button>
    </div>

    <div class="d-flex align-items-center gap-2 mb-3">
      <label for="delai" class="form-label mb-0">Échéance dans les</label>
      <select id="delai" v-model.number="jours" class="form-select w-auto">
        <option v-for="d in delais" :key="d" :value="d">{{ d }} prochains jours</option>
      </select>
    </div>

    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>

    <p v-if="chargement" class="text-muted">Chargement...</p>

    <template v-else-if="!erreur">
      <p v-if="lignes.length === 0" class="text-muted">
        Aucun contrat n'arrive à échéance dans les {{ jours }} prochains jours.
      </p>

      <div v-else class="table-responsive">
        <table class="table table-sm align-middle">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Poste</th>
              <th>Contrat</th>
              <th>Type</th>
              <th>Fin prévue</th>
              <th>Échéance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in lignes" :key="c.id">
              <td>{{ c.employe }} <small class="text-muted">({{ c.matricule }})</small></td>
              <td>{{ c.poste }}</td>
              <td>{{ c.reference }}</td>
              <td>{{ c.type }}</td>
              <td>{{ c.dateFinPrevue || '-' }}</td>
              <td>
                <span class="badge" :class="classeUrgence(c.restants)">{{ texteUrgence(c.restants) }}</span>
              </td>
              <td class="text-end">
                <RouterLink class="btn btn-sm btn-outline-primary" :to="`/contrats/${c.id}`">Ouvrir</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>