<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { besoinsApi } from '@/api/besoins'
import { useAuth } from '@/composables/useAuth'
import { dateFr, ariaryCourt, TYPES_BESOIN } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Icon from '@/components/ui/Icon.vue'

const route = useRoute()
const router = useRouter()
const { a } = useAuth()

const vue = ref(route.query.vue || 'tous')
const etat = ref(route.query.etat || '')
const q = ref(route.query.q || '')
const besoins = ref(null)
const erreur = ref('')

const VUES = [['tous', 'Tous les besoins'], ['a-valider', 'À valider par moi'], ['mes-demandes', 'Mes demandes']]
const ETATS = [['', 'Tous les états'], ['EN_ATTENTE', 'En validation'], ['OUVERT', 'Recrutement ouvert'], ['POURVU', 'Pourvus'], ['ANNULE', 'Annulés']]

async function charger() {
  besoins.value = null
  router.replace({ query: { ...(vue.value !== 'tous' && { vue: vue.value }), ...(etat.value && { etat: etat.value }), ...(q.value && { q: q.value }) } })
  try {
    besoins.value = await besoinsApi.lister({ vue: vue.value, etat: etat.value, q: q.value })
    erreur.value = ''
  } catch (e) {
    erreur.value = e.message
    besoins.value = []
  }
}
let minuteur
watch([vue, etat], charger)
watch(q, () => { clearTimeout(minuteur); minuteur = setTimeout(charger, 300) })
onMounted(charger)
</script>

<template>
  <PageHeader titre="Besoins en personnel" sous-titre="Chaque demande suit le circuit de validation RH, Finance puis Direction générale avant l'ouverture du recrutement.">
    <RouterLink v-if="a('Manager', 'RH', 'DG')" to="/besoins/nouveau" class="btn btn-primary"><Icon name="plus" /> Exprimer un besoin</RouterLink>
  </PageHeader>

  <div class="filters">
    <div class="segment" role="tablist">
      <button v-for="[k, l] in VUES" :key="k" type="button" :class="{ on: vue === k }" @click="vue = k">{{ l }}</button>
    </div>
    <select v-model="etat" class="form-select form-select-sm w-auto" aria-label="État">
      <option v-for="[k, l] in ETATS" :key="k" :value="k">{{ l }}</option>
    </select>
    <input v-model="q" type="search" class="form-control form-control-sm search" placeholder="Référence, unité, poste…" aria-label="Rechercher">
  </div>

  <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
  <section class="panel">
    <Chargement v-if="besoins === null" />
    <Vide v-else-if="!besoins.length" :titre="vue === 'a-valider' ? 'Aucun besoin n\'attend votre décision' : 'Aucun besoin trouvé'"
          :texte="vue === 'a-valider' ? 'Les demandes qui arrivent à votre étape du circuit apparaîtront ici.' : 'Modifiez les filtres ou exprimez un nouveau besoin.'" />
    <div v-else class="table-responsive">
      <table class="table">
        <thead>
          <tr><th>Référence</th><th>Unité</th><th>Postes demandés</th><th>Souhaité le</th><th class="num">Coût annuel</th><th>État</th><th>Étape en cours</th></tr>
        </thead>
        <tbody>
          <tr v-for="b in besoins" :key="b.id" class="cliquable" @click="router.push(`/besoins/${b.id}`)">
            <td>
              <RouterLink :to="`/besoins/${b.id}`" class="cell-main text-decoration-none nowrap" @click.stop>{{ b.reference }}</RouterLink>
              <span class="cell-sub">{{ TYPES_BESOIN[b.typeBesoin] }}<template v-if="b.nouveauPoste"> · nouveau poste</template></span>
            </td>
            <td>{{ b.unite }}<span class="cell-sub">par {{ b.demandeur }}</span></td>
            <td>{{ b.postes }}<span class="cell-sub">{{ b.effectif }} personne(s)</span></td>
            <td class="nowrap">{{ dateFr(b.dateSouhaitee) }}</td>
            <td class="num">{{ ariaryCourt(b.coutAnnuel) }}</td>
            <td><Statut type="besoin" :valeur="b.etat" /></td>
            <td>
              <span v-if="b.aValiderParMoi" class="status wait">À vous de décider</span>
              <span v-else class="small muted">{{ b.etapeCourante || '—' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
