<script setup>
import { onMounted, reactive, ref } from 'vue'
import { organisationApi } from '@/api/organisation'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { ariaryCourt, TYPES_UNITE } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Modal from '@/components/ui/Modal.vue'
import Icon from '@/components/ui/Icon.vue'

const toast = useToast()
const { a } = useAuth()
const modifiable = a('DG')   // la structure de l'organisation est décidée par le DG
const unites = ref(null)
const postesUnite = ref([])
const edition = ref(null)
const form = reactive({ code: '', type: 'SERVICE', libelle: '', idUniteMere: null, idPosteResponsable: null })
const erreur = ref('')
const aSupprimer = ref(null)

const charger = async () => { unites.value = await organisationApi.unites() }
onMounted(charger)

async function ouvrir(u) {
  erreur.value = ''
  edition.value = u || {}
  Object.assign(form, u
    ? { code: u.code, type: u.type, libelle: u.libelle, idUniteMere: u.idUniteMere, idPosteResponsable: u.idPosteResponsable }
    : { code: '', type: 'SERVICE', libelle: '', idUniteMere: null, idPosteResponsable: null })
  postesUnite.value = u ? await organisationApi.postes({ etat: 'ACTIF', idUnite: u.id }) : []
}
async function enregistrer() {
  erreur.value = ''
  try {
    if (edition.value.id) await organisationApi.modifierUnite(edition.value.id, form)
    else await organisationApi.creerUnite(form)
    toast.ok('Unité enregistrée')
    edition.value = null
    charger()
  } catch (e) { erreur.value = e.message }
}
async function supprimer() {
  try { await organisationApi.supprimerUnite(aSupprimer.value.id); toast.ok('Unité supprimée'); charger() } catch (e) { toast.erreur(e) }
  aSupprimer.value = null
}
</script>

<template>
  <PageHeader titre="Unités organisationnelles" sous-titre="Directions, départements, services et sections. Une unité ne dépend jamais d'une unité de rang inférieur.">
    <RouterLink to="/organigramme" class="btn btn-light">Voir l'organigramme</RouterLink>
    <button v-if="modifiable" type="button" class="btn btn-primary" @click="ouvrir(null)"><Icon name="plus" /> Créer une unité</button>
  </PageHeader>
  <div v-if="!modifiable" class="alert alert-info">Consultation seule : la création et la modification des unités sont réservées au Directeur général.</div>
  <section class="panel">
    <Chargement v-if="unites === null" />
    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead><tr><th>Unité</th><th>Type</th><th>Rattachée à</th><th>Responsable</th><th class="num">Postes</th><th class="num">Budget</th><th></th></tr></thead>
        <tbody>
          <tr v-for="u in unites" :key="u.id">
            <td><span class="cell-main">{{ u.libelle }}</span><span class="cell-sub">{{ u.code }}</span></td>
            <td>{{ TYPES_UNITE[u.type] }}</td>
            <td>{{ u.uniteMere || '—' }}</td>
            <td>{{ u.posteResponsable || '—' }}<span v-if="u.responsable" class="cell-sub">{{ u.responsable }}</span></td>
            <td class="num">{{ u.postes }}<span class="cell-sub">{{ u.vacants }} vacant(s)</span></td>
            <td class="num">{{ u.budget ? ariaryCourt(u.budget) : '—' }}</td>
            <td class="text-end nowrap">
              <template v-if="modifiable">
                <button type="button" class="btn btn-sm btn-light" @click="ouvrir(u)">Modifier</button>
                <button type="button" class="btn btn-sm btn-link text-danger" @click="aSupprimer = u">Supprimer</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <Modal v-if="edition" :titre="edition.id ? `Modifier ${edition.libelle}` : 'Créer une unité'" @fermer="edition = null">
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div class="form-grid">
      <div><label class="form-label" for="uc">Code</label><input id="uc" v-model="form.code" class="form-control" placeholder="S-DATA"></div>
      <div>
        <label class="form-label" for="ut">Type</label>
        <select id="ut" v-model="form.type" class="form-select"><option v-for="(l, k) in TYPES_UNITE" :key="k" :value="k">{{ l }}</option></select>
      </div>
      <div class="full"><label class="form-label" for="ul">Libellé</label><input id="ul" v-model="form.libelle" class="form-control"></div>
      <div class="full">
        <label class="form-label" for="um">Unité mère</label>
        <select id="um" v-model="form.idUniteMere" class="form-select">
          <option :value="null">Aucune (direction de premier niveau)</option>
          <option v-for="u in unites.filter((x) => x.id !== edition.id)" :key="u.id" :value="u.id">{{ u.libelle }} ({{ TYPES_UNITE[u.type] }})</option>
        </select>
      </div>
      <div v-if="edition.id" class="full">
        <label class="form-label" for="ur">Poste responsable</label>
        <select id="ur" v-model="form.idPosteResponsable" class="form-select">
          <option :value="null">Aucun</option>
          <option v-for="p in postesUnite" :key="p.id" :value="p.id">{{ p.libelle }}</option>
        </select>
        <span class="form-text">Créez d'abord le poste dans l'unité pour pouvoir le désigner.</span>
      </div>
    </div>
    <template #pied>
      <button type="button" class="btn btn-light" @click="edition = null">Annuler</button>
      <button type="button" class="btn btn-primary" @click="enregistrer">Enregistrer</button>
    </template>
  </Modal>
  <Modal v-if="aSupprimer" :titre="`Supprimer ${aSupprimer.libelle} ?`" @fermer="aSupprimer = null">
    <p>Une unité qui a des sous-unités, des postes, des besoins ou un budget ne peut pas être supprimée.</p>
    <template #pied>
      <button type="button" class="btn btn-light" @click="aSupprimer = null">Annuler</button>
      <button type="button" class="btn btn-danger" @click="supprimer">Supprimer</button>
    </template>
  </Modal>
</template>
