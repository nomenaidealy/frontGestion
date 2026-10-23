<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { financeApi } from '@/api/finance'
import { besoinsApi } from '@/api/besoins'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { ariary, dateFr } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Modal from '@/components/ui/Modal.vue'
import Icon from '@/components/ui/Icon.vue'

const { a } = useAuth()
const toast = useToast()
const annee = new Date().getFullYear()
const exercice = ref(Number(useRoute().query.exercice) || annee)
const budgets = ref(null)
const unites = ref([])
const edition = ref(null)
const form = reactive({ idUnite: null, exercice: annee, montant: '' })
const erreur = ref('')
const refus = ref(null)            // budget dont le DG refuse la proposition
const motif = ref('')

const estDG = computed(() => a('DG'))
const peutSaisir = computed(() => a('Finance', 'DG', 'ADMIN'))
const aValider = computed(() => (budgets.value || []).filter((b) => b.statut === 'A_VALIDER'))

async function charger() { budgets.value = null; budgets.value = await financeApi.budgets(exercice.value) }
watch(exercice, charger)
onMounted(async () => { unites.value = await besoinsApi.unites(); charger() })

function ouvrir(b) {
  erreur.value = ''
  edition.value = b || {}
  Object.assign(form, b
    ? { idUnite: b.idUnite, exercice: b.exercice, montant: b.statut === 'A_VALIDER' ? b.montantPropose : b.montant }
    : { idUnite: null, exercice: exercice.value, montant: '' })
}
async function enregistrer() {
  erreur.value = ''
  try {
    const corps = { ...form, montant: Number(form.montant) }
    const b = edition.value.id ? await financeApi.modifierBudget(edition.value.id, corps) : await financeApi.creerBudget(corps)
    toast.ok(b?.statut === 'A_VALIDER' ? 'Budget proposé : en attente de validation par le DG' : 'Budget enregistré et validé')
    edition.value = null
    charger()
  } catch (e) { erreur.value = e.message }
}
async function valider(b) {
  try { await financeApi.validerBudget(b.id); toast.ok(`Budget de ${b.unite} validé`); charger() } catch (e) { toast.erreur(e) }
}
function ouvrirRefus(b) { refus.value = b; motif.value = ''; erreur.value = '' }
async function refuser() {
  erreur.value = ''
  try {
    await financeApi.refuserBudget(refus.value.id, motif.value)
    toast.ok('Proposition refusée')
    refus.value = null
    charger()
  } catch (e) { erreur.value = e.message }
}
async function supprimer(b) {
  try { await financeApi.supprimerBudget(b.id); toast.ok('Budget supprimé'); charger() } catch (e) { toast.erreur(e) }
}
// suppression : une proposition par son auteur (Finance), un budget validé seulement par le DG
const peutSupprimer = (b) => estDG.value || (peutSaisir.value && b.montant == null)
const pct = (b) => (Number(b.montant) ? Math.min(100, Math.round(((Number(b.masseSalariale) + Number(b.besoinsEnCours)) * 100) / Number(b.montant))) : 0)
</script>

<template>
  <PageHeader titre="Budgets des unités" sous-titre="Budget annuel de chaque unité, comparé à la masse salariale engagée et au coût des besoins en cours. La Finance propose, le Directeur général valide ; seul le budget validé sert au contrôle des besoins.">
    <button v-if="peutSaisir" type="button" class="btn btn-primary" @click="ouvrir(null)"><Icon name="plus" /> {{ estDG ? 'Fixer un budget' : 'Proposer un budget' }}</button>
  </PageHeader>

  <div v-if="estDG && aValider.length" class="alert alert-warning">
    <b>{{ aValider.length }} proposition{{ aValider.length > 1 ? 's' : '' }} de budget</b> attend{{ aValider.length > 1 ? 'ent' : '' }} votre validation pour {{ exercice }}.
  </div>

  <div class="filters">
    <div class="segment">
      <button v-for="y in [annee - 1, annee, annee + 1]" :key="y" type="button" :class="{ on: exercice === y }" @click="exercice = y">{{ y }}</button>
    </div>
  </div>
  <section class="panel">
    <Chargement v-if="budgets === null" />
    <Vide v-else-if="!budgets.length" :titre="`Aucun budget pour ${exercice}`" texte="Sans budget validé, les besoins de l'unité sont tous soumis à la décision de la Finance." />
    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead>
          <tr>
            <th>Unité</th><th>Statut</th><th class="num">Budget validé</th><th class="num">Masse salariale</th><th class="num">Besoins en cours</th>
            <th class="num">Disponible</th><th style="width:150px">Consommation</th><th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in budgets" :key="b.id">
            <td class="cell-main">{{ b.unite }}</td>
            <td>
              <Statut type="budget" :valeur="b.statut" />
              <span v-if="b.statut === 'A_VALIDER'" class="cell-sub">{{ ariary(b.montantPropose) }} proposé<template v-if="b.proposePar"> par {{ b.proposePar }}</template></span>
              <span v-else-if="b.decidePar" class="cell-sub" :title="b.commentaire || ''">
                {{ b.statut === 'REFUSE' ? 'Refusé' : 'Validé' }} par {{ b.decidePar }}<template v-if="b.dateDecision">, le {{ dateFr(b.dateDecision) }}</template>
              </span>
              <span v-if="b.commentaire && b.statut !== 'A_VALIDER'" class="cell-sub">« {{ b.commentaire }} »</span>
            </td>
            <td class="num">{{ b.montant != null ? ariary(b.montant) : '—' }}</td>
            <td class="num">{{ ariary(b.masseSalariale) }}</td><td class="num">{{ ariary(b.besoinsEnCours) }}</td>
            <td class="num" :class="Number(b.disponible) < 0 ? 'text-danger fw-semibold' : ''">{{ b.montant != null ? ariary(b.disponible) : '—' }}</td>
            <td>
              <template v-if="b.montant != null">
                <div class="progress-line"><span :style="{ width: `${pct(b)}%`, background: pct(b) >= 100 ? 'var(--sirh-danger)' : '' }"></span></div>
                <span class="cell-sub">{{ pct(b) }} %</span>
              </template>
            </td>
            <td class="text-end nowrap">
              <template v-if="estDG && b.statut === 'A_VALIDER'">
                <button type="button" class="btn btn-sm btn-primary" @click="valider(b)">Valider</button>
                <button type="button" class="btn btn-sm btn-light" @click="ouvrirRefus(b)">Refuser</button>
              </template>
              <button v-if="peutSaisir" type="button" class="btn btn-sm btn-light" @click="ouvrir(b)">Modifier</button>
              <button v-if="peutSupprimer(b)" type="button" class="btn btn-sm btn-link text-danger" @click="supprimer(b)">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <Modal v-if="edition" :titre="edition.id ? 'Modifier le budget' : (estDG ? 'Fixer un budget' : 'Proposer un budget')" @fermer="edition = null">
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <p v-if="!estDG" class="small muted">Le montant saisi est une proposition : il s'appliquera après validation par le Directeur général. En attendant, le budget validé actuel reste en vigueur.</p>
    <div class="form-grid">
      <div class="full">
        <label class="form-label" for="bu">Unité</label>
        <select id="bu" v-model="form.idUnite" class="form-select" :disabled="!!edition.id"><option :value="null" disabled>Choisir…</option><option v-for="u in unites" :key="u.id" :value="u.id">{{ u.libelle }}</option></select>
      </div>
      <div><label class="form-label" for="be">Exercice</label><input id="be" v-model.number="form.exercice" type="number" class="form-control" :disabled="!!edition.id"></div>
      <div><label class="form-label" for="bm">Montant annuel (Ar)</label><input id="bm" v-model="form.montant" type="number" min="0" step="100000" class="form-control"></div>
    </div>
    <template #pied>
      <button type="button" class="btn btn-light" @click="edition = null">Annuler</button>
      <button type="button" class="btn btn-primary" @click="enregistrer">{{ estDG ? 'Enregistrer' : 'Soumettre au DG' }}</button>
    </template>
  </Modal>

  <Modal v-if="refus" titre="Refuser la proposition" @fermer="refus = null">
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <p class="small">Budget proposé pour <b>{{ refus.unite }}</b> ({{ refus.exercice }}) : <b>{{ ariary(refus.montantPropose) }}</b>.
      <template v-if="refus.montant != null"> Le budget validé de {{ ariary(refus.montant) }} reste en vigueur.</template></p>
    <label class="form-label" for="rm">Motif du refus</label>
    <textarea id="rm" v-model="motif" rows="3" class="form-control" placeholder="Transmis à la Finance"></textarea>
    <template #pied>
      <button type="button" class="btn btn-light" @click="refus = null">Annuler</button>
      <button type="button" class="btn btn-danger" :disabled="!motif.trim()" @click="refuser">Refuser</button>
    </template>
  </Modal>
</template>
