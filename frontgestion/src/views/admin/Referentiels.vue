<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { referentielsApi } from '@/api/referentiels'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Modal from '@/components/ui/Modal.vue'
import Icon from '@/components/ui/Icon.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const ORDRE = ['metiers', 'categories', 'echelons', 'motifs', 'types-contrat', 'types-document', 'types-information']
const AIDE = {
  metiers: "Chaque métier appartient à une catégorie, qui fixe avec l'échelon la ligne de grille salariale.",
  categories: 'Catégories de métier (cadre, agent de maîtrise…) utilisées par la grille salariale.',
  echelons: "Niveaux d'expérience d'un poste (junior, confirmé, senior…).",
  motifs: "Raisons d'un besoin en personnel.",
  'types-contrat': 'Durée maximale en mois et nombre de renouvellements autorisés. CE, CDD et CDI sont utilisés par l\'application.',
  'types-document': 'Types des pièces enregistrées (CV, contrats…).',
  'types-information': 'Rubriques du CV saisies par les candidats.',
}
const refs = ref({})
const modifiables = ref([])   // organisation (métiers, catégories, échelons, types de contrat) : DG ; recrutement : RH, DG, administrateur
const modifiable = computed(() => modifiables.value.includes(courant.value))
const courant = ref(route.query.ref || 'metiers')
const liste = ref(null)
const categories = ref([])
const edition = ref(null)
const form = reactive({ libelle: '', idParent: null, dureeMax: '', renouvellementMax: '' })
const erreur = ref('')
const aSupprimer = ref(null)

async function charger() {
  liste.value = null
  router.replace({ query: { ref: courant.value } })
  liste.value = await referentielsApi.lister(courant.value)
  if (courant.value === 'metiers') categories.value = await referentielsApi.lister('categories')
}
watch(courant, charger)
onMounted(async () => {
  ;[refs.value, modifiables.value] = await Promise.all([referentielsApi.liste(), referentielsApi.modifiables()])
  charger()
})
const titre = computed(() => refs.value[courant.value] || '')

function ouvrir(x) {
  erreur.value = ''
  edition.value = x || {}
  Object.assign(form, x
    ? { libelle: x.libelle, idParent: x.idParent, dureeMax: x.dureeMax ?? '', renouvellementMax: x.renouvellementMax ?? '' }
    : { libelle: '', idParent: null, dureeMax: '', renouvellementMax: '' })
}
async function enregistrer() {
  erreur.value = ''
  const corps = { libelle: form.libelle, idParent: form.idParent,
    dureeMax: form.dureeMax === '' ? null : Number(form.dureeMax), renouvellementMax: form.renouvellementMax === '' ? null : Number(form.renouvellementMax) }
  try {
    if (edition.value.id) await referentielsApi.modifier(courant.value, edition.value.id, corps)
    else await referentielsApi.creer(courant.value, corps)
    toast.ok('Enregistré')
    edition.value = null
    charger()
  } catch (e) { erreur.value = e.message }
}
async function supprimer() {
  try { await referentielsApi.supprimer(courant.value, aSupprimer.value.id); toast.ok('Supprimé'); charger() } catch (e) { toast.erreur(e) }
  aSupprimer.value = null
}
</script>

<template>
  <PageHeader titre="Référentiels" sous-titre="Les listes de valeurs proposées dans les formulaires. Une valeur déjà utilisée ne peut pas être supprimée." />
  <nav class="tabs">
    <button v-for="k in ORDRE" :key="k" type="button" :class="{ on: courant === k }" @click="courant = k">{{ refs[k] || k }}</button>
  </nav>
  <section class="panel">
    <div class="panel-head">
      <div><h2>{{ titre }}</h2><p>{{ AIDE[courant] }}</p></div>
      <button v-if="modifiable" type="button" class="btn btn-primary btn-sm" @click="ouvrir(null)"><Icon name="plus" /> Ajouter</button>
      <span v-else class="small muted">Consultation seule : référentiel d'organisation modifiable par le Directeur général.</span>
    </div>
    <Chargement v-if="liste === null" />
    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead>
          <tr><th>Libellé</th><th v-if="courant === 'metiers'">Catégorie</th>
            <template v-if="courant === 'types-contrat'"><th class="num">Durée max.</th><th class="num">Renouvellements</th></template><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="x in liste" :key="x.id">
            <td class="cell-main">{{ x.libelle }} <span v-if="x.systeme" class="badge ms-1" title="Utilisé par l'application">système</span></td>
            <td v-if="courant === 'metiers'">{{ x.parent }}</td>
            <template v-if="courant === 'types-contrat'">
              <td class="num">{{ x.dureeMax ? `${x.dureeMax} mois` : 'Illimitée' }}</td>
              <td class="num">{{ x.renouvellementMax ?? '—' }}</td>
            </template>
            <td class="text-end nowrap">
              <template v-if="modifiable">
                <button type="button" class="btn btn-sm btn-light" @click="ouvrir(x)">Modifier</button>
                <button v-if="!x.systeme" type="button" class="btn btn-sm btn-link text-danger" @click="aSupprimer = x">Supprimer</button>
              </template>
            </td>
          </tr>
          <tr v-if="!liste.length"><td colspan="4" class="muted text-center py-4">Aucune valeur.</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <Modal v-if="edition" :titre="edition.id ? 'Modifier' : `Ajouter : ${titre}`" @fermer="edition = null">
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div class="form-grid">
      <div class="full">
        <label class="form-label" for="rl">Libellé</label>
        <input id="rl" v-model="form.libelle" class="form-control" :disabled="edition.systeme && courant !== 'types-contrat'" @keydown.enter.prevent="enregistrer">
        <span v-if="['types-contrat', 'types-document', 'types-information'].includes(courant)" class="form-text">Enregistré en code : majuscules, sans accents ni espaces.</span>
      </div>
      <div v-if="courant === 'metiers'" class="full">
        <label class="form-label" for="rc">Catégorie</label>
        <select id="rc" v-model="form.idParent" class="form-select"><option :value="null" disabled>Choisir…</option><option v-for="c in categories" :key="c.id" :value="c.id">{{ c.libelle }}</option></select>
      </div>
      <template v-if="courant === 'types-contrat'">
        <div><label class="form-label" for="rd">Durée maximale (mois)</label><input id="rd" v-model="form.dureeMax" type="number" min="1" class="form-control" placeholder="Illimitée"></div>
        <div><label class="form-label" for="rr">Renouvellements autorisés</label><input id="rr" v-model="form.renouvellementMax" type="number" min="0" class="form-control"></div>
      </template>
    </div>
    <template #pied>
      <button type="button" class="btn btn-light" @click="edition = null">Annuler</button>
      <button type="button" class="btn btn-primary" @click="enregistrer">Enregistrer</button>
    </template>
  </Modal>
  <Modal v-if="aSupprimer" :titre="`Supprimer « ${aSupprimer.libelle} » ?`" @fermer="aSupprimer = null">
    <p>Cette valeur ne sera plus proposée. La suppression est refusée si elle est déjà utilisée.</p>
    <template #pied>
      <button type="button" class="btn btn-light" @click="aSupprimer = null">Annuler</button>
      <button type="button" class="btn btn-danger" @click="supprimer">Supprimer</button>
    </template>
  </Modal>
</template>
