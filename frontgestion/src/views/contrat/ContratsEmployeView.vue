<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { besoinApi as api } from '@/api/besoinApi'

// Route attendue : { path: '/employes/:idEmploye/contrats', component: ContratsEmployeView, props: true }
const props = defineProps({ idEmploye: [String, Number] })

const contrats = ref([])
const erreur = ref('')
const chargement = ref(false)

const libelleStatut = { CREE: 'Créé', VALIDE: 'Validé', SIGNE: 'Signé', TERMINE: 'Terminé', ANNULE: 'Annulé' }
const classeStatut = {
  CREE: 'bg-secondary', VALIDE: 'bg-info', SIGNE: 'bg-success',
  TERMINE: 'bg-dark', ANNULE: 'bg-danger',
}

async function charger() {
  erreur.value = ''
  chargement.value = true
  try {
    contrats.value = await api.contratsEmploye(props.idEmploye)
  } catch (e) {
    console.error(e)
    erreur.value = e.response?.data?.message || e.message
  } finally {
    chargement.value = false
  }
}

onMounted(charger)
watch(() => props.idEmploye, charger)

// Du plus récent au plus ancien
const contratsTries = computed(() =>
  [...contrats.value].sort((a, b) => String(b.dateDebut).localeCompare(String(a.dateDebut))))

const contratEnCours = computed(() => contrats.value.find(c => c.statut === 'SIGNE') || null)

const employe = computed(() => {
  const c = contrats.value[0]
  return c ? `${c.employe} (${c.matricule})` : ''
})
</script>

<template>
  <div class="container">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">Contrats de l'employé<span v-if="employe"> : {{ employe }}</span></h2>
      <button class="btn btn-outline-secondary" :disabled="chargement" @click="charger">Actualiser</button>
    </div>

    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>

    <p v-if="chargement" class="text-muted">Chargement...</p>

    <template v-else-if="!erreur">
      <p v-if="contrats.length === 0" class="text-muted">
        Aucun contrat pour cet employé.
      </p>

      <template v-else>
        <div class="card mb-3">
          <div class="card-body">
            <div v-if="contratEnCours">
              Contrat en cours :
              <RouterLink :to="`/contrats/${contratEnCours.id}`">{{ contratEnCours.reference }}</RouterLink>
              ({{ contratEnCours.type }}, {{ contratEnCours.poste }}),
              fin prévue : {{ contratEnCours.dateFinPrevue || 'sans limite' }}.
            </div>
            <div v-else class="text-muted">Aucun contrat signé en cours.</div>
            <small class="text-muted">{{ contrats.length }} contrat(s) au total.</small>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Type</th>
                <th>Poste</th>
                <th>Début</th>
                <th>Fin prévue</th>
                <th>Fin effective</th>
                <th>Précédent</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in contratsTries" :key="c.id">
                <td>{{ c.reference }}</td>
                <td>{{ c.type }}</td>
                <td>{{ c.poste }}</td>
                <td>{{ c.dateDebut }}</td>
                <td>{{ c.dateFinPrevue || 'Sans limite' }}</td>
                <td>{{ c.dateFinEffective || '-' }}</td>
                <td>{{ c.referencePrecedent || '-' }}</td>
                <td>
                  <span class="badge" :class="classeStatut[c.statut]">
                    {{ libelleStatut[c.statut] || c.statut }}
                  </span>
                </td>
                <td class="text-end">
                  <RouterLink class="btn btn-sm btn-outline-primary" :to="`/contrats/${c.id}`">Ouvrir</RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>
  </div>
</template>