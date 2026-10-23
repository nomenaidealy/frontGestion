<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { organisationApi } from '@/api/organisation'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import Rail from '@/components/ui/Rail.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Modal from '@/components/ui/Modal.vue'
import Icon from '@/components/ui/Icon.vue'

const { a } = useAuth()
const modifiable = a('DG')   // le circuit de validation est fixé par le DG

const toast = useToast()
const etapes = ref(null)
const postes = ref([])
const edition = ref(null)
const form = reactive({ ordre: 1, idPoste: null, controle: '' })
const erreur = ref('')

const charger = async () => { etapes.value = await organisationApi.circuit() }
onMounted(async () => { charger(); postes.value = await organisationApi.postes({ etat: 'ACTIF' }) })

const apercu = computed(() => {
  const ordres = [...new Set((etapes.value || []).map((e) => e.ordre))].sort((x, y) => x - y)
  return ordres.map((o) => {
    const l = etapes.value.filter((e) => e.ordre === o)
    return { titre: l.map((e) => e.poste).join(' ou '), meta: l.some((e) => e.controle === 'BUDGET') ? 'Contrôle budgétaire' : 'Validation', statut: 'a-venir' }
  })
})

function ouvrir(e) {
  erreur.value = ''
  edition.value = e || {}
  const max = Math.max(0, ...(etapes.value || []).map((x) => x.ordre))
  Object.assign(form, e ? { ordre: e.ordre, idPoste: e.idPoste, controle: e.controle || '' } : { ordre: max + 1, idPoste: null, controle: '' })
}
async function enregistrer() {
  erreur.value = ''
  try {
    const corps = { ...form, controle: form.controle || null }
    if (edition.value.id) await organisationApi.modifierEtape(edition.value.id, corps)
    else await organisationApi.ajouterEtape(corps)
    toast.ok('Circuit enregistré')
    edition.value = null
    charger()
  } catch (e) { erreur.value = e.message }
}
async function supprimer(e) {
  try { await organisationApi.supprimerEtape(e.id); toast.ok('Étape retirée'); charger() } catch (x) { toast.erreur(x) }
}
</script>

<template>
  <PageHeader titre="Circuit de validation des besoins" sous-titre="Les étapes qu'un besoin traverse avant l'ouverture du recrutement. Deux postes au même rang : l'un ou l'autre peut valider.">
    <button v-if="modifiable" type="button" class="btn btn-primary" @click="ouvrir(null)"><Icon name="plus" /> Ajouter une étape</button>
  </PageHeader>
  <div v-if="!modifiable" class="alert alert-info">Consultation seule : le circuit de validation est fixé par le Directeur général.</div>
  <Chargement v-if="etapes === null" />
  <template v-else>
    <section class="panel">
      <div class="panel-body"><Rail :etapes="apercu" /></div>
    </section>
    <section class="panel">
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th class="num" style="width:70px">Rang</th><th>Poste valideur</th><th>Occupant actuel</th><th>Contrôle</th><th></th></tr></thead>
          <tbody>
            <tr v-for="e in etapes" :key="e.id">
              <td class="num fw-semibold">{{ e.ordre }}</td>
              <td><span class="cell-main">{{ e.poste }}</span><span class="cell-sub">{{ e.unite }}</span></td>
              <td>{{ e.occupant || 'Poste vacant' }}</td>
              <td><span v-if="e.controle === 'BUDGET'" class="status info">Budget : validation d'office si le coût tient dans le budget</span><span v-else class="muted">Décision manuelle</span></td>
              <td class="text-end nowrap">
                <template v-if="modifiable">
                  <button type="button" class="btn btn-sm btn-light" @click="ouvrir(e)">Modifier</button>
                  <button type="button" class="btn btn-sm btn-link text-danger" @click="supprimer(e)">Retirer</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </template>

  <Modal v-if="edition" :titre="edition.id ? 'Modifier l\'étape' : 'Ajouter une étape'" @fermer="edition = null">
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div class="form-grid">
      <div><label class="form-label" for="co">Rang</label><input id="co" v-model.number="form.ordre" type="number" min="1" class="form-control"></div>
      <div>
        <label class="form-label" for="cc">Contrôle</label>
        <select id="cc" v-model="form.controle" class="form-select"><option value="">Décision manuelle</option><option value="BUDGET">Contrôle budgétaire</option></select>
      </div>
      <div class="full">
        <label class="form-label" for="cp">Poste valideur</label>
        <select id="cp" v-model="form.idPoste" class="form-select">
          <option :value="null" disabled>Choisir…</option>
          <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.libelle }} — {{ p.unite }}</option>
        </select>
      </div>
    </div>
    <template #pied>
      <button type="button" class="btn btn-light" @click="edition = null">Annuler</button>
      <button type="button" class="btn btn-primary" @click="enregistrer">Enregistrer</button>
    </template>
  </Modal>
</template>
