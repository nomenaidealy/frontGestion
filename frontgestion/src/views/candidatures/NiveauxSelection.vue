<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NonConnecteError } from '@/api/http'
import { candidaturesRhApi } from '@/api/candidatures'
import { selectionApi } from '@/api/selection'
import TableNiveaux from '@/components/candidatures/TableNiveaux.vue'
import AlerteConnexion from '@/components/candidatures/AlerteConnexion.vue'

const route = useRoute()
const router = useRouter()

const offres = ref([])
const groupe = ref(null)        // { idOffreEmploi, personnalises, niveaux }
const idOffre = ref(route.query.offre ? String(route.query.offre) : '') // '' = niveaux communs
const nonConnecte = ref(false)
const error = ref(null)
const envoi = ref(false)

const offreChoisie = computed(() => offres.value.find((o) => String(o.id) === idOffre.value))

async function charger() {
  try {
    groupe.value = await selectionApi.niveaux(idOffre.value || null)
    error.value = null
  } catch (e) {
    if (e instanceof NonConnecteError) nonConnecte.value = true
    else error.value = e.message
  }
}

async function basculer(action) {
  envoi.value = true
  try {
    groupe.value = await action()
    error.value = null
  } catch (e) {
    error.value = e.message
  } finally {
    envoi.value = false
  }
}

watch(idOffre, (v) => {
  router.replace({ query: v ? { offre: v } : {} })
  charger()
})

onMounted(async () => {
  try {
    offres.value = await candidaturesRhApi.offres()
  } catch (e) {
    if (e instanceof NonConnecteError) { nonConnecte.value = true; return }
  }
  await charger()
})
</script>

<template>
  <div class="container" style="max-width: 900px">
    <PageHeader titre="Niveaux de sélection" sous-titre="Tests et entretiens que passe chaque candidature présélectionnée, dans l'ordre. Le score minimum est sur 20 ; sans minimum, l'évaluateur décide lui-même." retour="/candidatures" retour-libelle="Candidatures" />

    <AlerteConnexion v-if="nonConnecte" />
    <template v-else>
      <div class="row g-2 align-items-center mb-3">
        <label for="choix-offre" class="col-auto col-form-label fw-semibold">Niveaux de</label>
        <div class="col-12 col-sm">
          <select id="choix-offre" v-model="idOffre" class="form-select">
            <option value="">Toutes les offres (niveaux communs)</option>
            <option v-for="o in offres" :key="o.id" :value="String(o.id)">{{ o.reference }} — {{ o.postes || 'Poste à pourvoir' }}</option>
          </select>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <template v-if="groupe">
        <div v-if="idOffre && !groupe.personnalises" class="alert alert-info d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span>{{ offreChoisie?.reference }} utilise les niveaux communs ci-dessous.</span>
          <button type="button" class="btn btn-primary btn-sm" :disabled="envoi"
                  @click="basculer(() => selectionApi.personnaliser(idOffre))">
            Adapter les niveaux pour cette offre
          </button>
        </div>
        <div v-else-if="idOffre" class="alert alert-light border d-flex flex-wrap align-items-center justify-content-between gap-2">
          <span>Niveaux propres à {{ offreChoisie?.reference }}.</span>
          <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="envoi"
                  @click="basculer(() => selectionApi.reprendreCommuns(idOffre))">
            Revenir aux niveaux communs
          </button>
        </div>

        <!-- Pour une offre sans niveaux propres, on montre les niveaux communs sans les modifier ici -->
        <TableNiveaux :niveaux="groupe.niveaux" :id-offre="idOffre ? Number(idOffre) : null"
                      :modifiable="!idOffre || groupe.personnalises" @change="charger" />
      </template>
    </template>
  </div>
</template>
