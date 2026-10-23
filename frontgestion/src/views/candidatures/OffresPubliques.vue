<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { candidaturesPubliquesApi as api } from '@/api/candidatures'
import OffreCarte from '@/components/candidatures/OffreCarte.vue'

const route = useRoute()
const router = useRouter()

const unites = ref([])
const offres = ref([])
const chargement = ref(true)
const error = ref(null)

// Filtre gardé dans l'URL (?unite=5) : la page peut être partagée ou rechargée
const idUnite = ref(route.query.unite ? String(route.query.unite) : '')
const libelleFiltre = computed(() => unites.value.find((u) => String(u.id) === idUnite.value)?.libelle)

async function chargerOffres() {
  chargement.value = true
  try {
    offres.value = await api.offres(idUnite.value || null)
    error.value = null
  } catch (e) {
    error.value = e.message
    offres.value = []
  } finally {
    chargement.value = false
  }
}

watch(idUnite, (v) => {
  router.replace({ query: v ? { unite: v } : {} })
  chargerOffres()
})

onMounted(async () => {
  try {
    unites.value = await api.unites()
  } catch {
    unites.value = [] // la liste s'affiche quand même, sans filtre
  }
  await chargerOffres()
})

/** Libellé indenté selon le niveau dans l'organigramme. */
const libelleUnite = (u) => '   '.repeat(Math.max(0, u.profondeur - 1)) + u.libelle
</script>

<template>
  <div class="container" style="max-width: 960px">
    <PageHeader titre="Nos offres d'emploi" sous-titre="Consultez les postes ouverts et déposez votre candidature en ligne, CV en PDF." />

    <div class="row g-2 align-items-center mb-3">
      <label for="filtre-unite" class="col-auto col-form-label fw-semibold">Direction ou département</label>
      <div class="col-12 col-sm-auto">
        <select id="filtre-unite" v-model="idUnite" class="form-select">
          <option value="">Toutes les directions</option>
          <option v-for="u in unites" :key="u.id" :value="String(u.id)">{{ libelleUnite(u) }}</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-else-if="chargement" class="text-muted py-4 text-center">Chargement des offres…</div>
    <div v-else-if="!offres.length" class="card card-body text-muted text-center py-4">
      Aucune offre ouverte<span v-if="libelleFiltre">&nbsp;pour « {{ libelleFiltre }} »</span> pour le moment.
    </div>
    <template v-else>
      <OffreCarte v-for="o in offres" :key="o.id" :offre="o" />
    </template>
  </div>
</template>
