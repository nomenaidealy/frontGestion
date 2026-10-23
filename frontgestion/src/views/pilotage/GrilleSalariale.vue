<script setup>
import { computed, onMounted, ref } from 'vue'
import { financeApi } from '@/api/finance'
import { referentielsApi } from '@/api/referentiels'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { ariary, dateFr } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Modal from '@/components/ui/Modal.vue'
import Vide from '@/components/ui/Vide.vue'

const { a } = useAuth()
const toast = useToast()
const grilles = ref(null)
const choisie = ref(null)
const categories = ref([])
const echelons = ref([])
const nouvelle = ref(null)
const erreur = ref('')
const refus = ref(false)
const motif = ref('')
const estDG = computed(() => a('DG'))
const peutSaisir = computed(() => a('Finance', 'DG', 'ADMIN'))
const enAttente = computed(() => (grilles.value || []).find((g) => g.statut === 'A_VALIDER'))

async function charger() {
  grilles.value = await financeApi.grilles()
  const enVigueur = grilles.value.find((g) => g.etat === 'EN_VIGUEUR') || grilles.value[0]
  if (enVigueur) choisie.value = await financeApi.grille(enVigueur.id)
}
onMounted(async () => {
  ;[categories.value, echelons.value] = await Promise.all([referentielsApi.lister('categories'), referentielsApi.lister('echelons')])
  charger()
})
async function voir(g) { choisie.value = await financeApi.grille(g.id) }

// Matrice catégorie × échelon
const cellule = (lignes, c, e) => lignes.find((l) => l.idCategorie === c && l.idEchelon === e)
const categoriesGrille = computed(() => categories.value.filter((c) => choisie.value?.lignes.some((l) => l.idCategorie === c.id)))

function preparer() {
  erreur.value = ''
  const base = choisie.value?.lignes || []
  const d = new Date(); d.setMonth(d.getMonth() + 1, 1)
  nouvelle.value = {
    dateEffectif: d.toISOString().slice(0, 10),
    lignes: categories.value.flatMap((c) => echelons.value.map((e) => {
      const x = cellule(base, c.id, e.id)
      return { idCategorie: c.id, categorie: c.libelle, idEchelon: e.id, echelon: e.libelle, montantMin: x?.montantMin ?? '', montantMax: x?.montantMax ?? '' }
    })),
  }
}
async function enregistrer() {
  erreur.value = ''
  const lignes = nouvelle.value.lignes.filter((l) => l.montantMin !== '' && l.montantMax !== '')
    .map((l) => ({ idCategorie: l.idCategorie, idEchelon: l.idEchelon, montantMin: Number(l.montantMin), montantMax: Number(l.montantMax) }))
  try {
    await financeApi.creerGrille({ dateEffectif: nouvelle.value.dateEffectif, lignes })
    toast.ok(estDG.value ? 'Nouvelle grille enregistrée' : 'Grille soumise à la validation du DG')
    nouvelle.value = null
    charger()
  } catch (e) { erreur.value = e.message }
}
async function valider() {
  try { await financeApi.validerGrille(choisie.value.id); toast.ok('Grille validée'); await charger() } catch (e) { toast.erreur(e) }
}
async function refuser() {
  erreur.value = ''
  try {
    await financeApi.refuserGrille(choisie.value.id, motif.value)
    toast.ok('Grille refusée')
    refus.value = false
    await charger()
  } catch (e) { erreur.value = e.message }
}
</script>

<template>
  <PageHeader titre="Grille salariale" sous-titre="Salaire mensuel minimum et maximum par catégorie de métier et par échelon. La Finance propose une nouvelle grille, le Directeur général la valide ; seule une grille validée encadre les propositions d'embauche et le coût des besoins.">
    <button v-if="peutSaisir" type="button" class="btn btn-primary" :disabled="!!enAttente" :title="enAttente ? 'Une grille attend déjà la décision du DG' : ''" @click="preparer">
      {{ estDG ? 'Nouvelle grille' : 'Proposer une grille' }}
    </button>
  </PageHeader>
  <Chargement v-if="grilles === null" />
  <Vide v-else-if="!grilles.length" titre="Aucune grille salariale" texte="Saisissez la première grille pour activer le contrôle des salaires." />
  <template v-else>
  <div v-if="enAttente" class="alert alert-warning d-flex justify-content-between align-items-center gap-3 flex-wrap">
    <span>Une nouvelle grille au {{ dateFr(enAttente.dateEffectif) }}<template v-if="enAttente.proposePar">, proposée par {{ enAttente.proposePar }},</template> attend la validation du Directeur général.</span>
    <button v-if="choisie?.id !== enAttente.id" type="button" class="btn btn-sm btn-light" @click="voir(enAttente)">Voir la proposition</button>
  </div>
  <div class="split">
    <section class="panel">
      <div class="panel-head">
        <div><h2>Grille du {{ dateFr(choisie?.dateEffectif) }}</h2><p>{{ choisie?.dateFin ? `jusqu'au ${dateFr(choisie.dateFin)}` : 'sans date de fin' }}</p></div>
        <div class="d-flex align-items-center gap-2">
          <Statut type="grille" :valeur="choisie?.etat" />
          <template v-if="estDG && choisie?.statut === 'A_VALIDER'">
            <button type="button" class="btn btn-sm btn-primary" @click="valider">Valider</button>
            <button type="button" class="btn btn-sm btn-light" @click="refus = true; motif = ''; erreur = ''">Refuser</button>
          </template>
        </div>
      </div>
      <p v-if="choisie && (choisie.proposePar || choisie.decidePar)" class="small muted" style="padding:10px 18px 0;margin:0">
        <template v-if="choisie.proposePar">Proposée par {{ choisie.proposePar }}. </template>
        <template v-if="choisie.decidePar">{{ choisie.statut === 'REFUSEE' ? 'Refusée' : 'Validée' }} par {{ choisie.decidePar }}<template v-if="choisie.dateDecision"> le {{ dateFr(choisie.dateDecision) }}</template>.</template>
        <template v-if="choisie.commentaire"> « {{ choisie.commentaire }} »</template>
      </p>
      <div v-if="choisie" class="table-responsive">
        <table class="table">
          <thead><tr><th>Catégorie</th><th v-for="e in echelons" :key="e.id" class="num">{{ e.libelle }}</th></tr></thead>
          <tbody>
            <tr v-for="c in categoriesGrille" :key="c.id">
              <td class="cell-main">{{ c.libelle }}</td>
              <td v-for="e in echelons" :key="e.id" class="num">
                <template v-if="cellule(choisie.lignes, c.id, e.id)">
                  {{ ariary(cellule(choisie.lignes, c.id, e.id).montantMin) }}
                  <span class="cell-sub">à {{ ariary(cellule(choisie.lignes, c.id, e.id).montantMax) }}</span>
                </template>
                <span v-else class="muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <section class="panel">
      <div class="panel-head"><h2>Historique</h2></div>
      <div class="list-group list-group-flush">
        <button v-for="g in grilles" :key="g.id" type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                :class="{ active: g.id === choisie?.id }" @click="voir(g)">
          <span>À partir du {{ dateFr(g.dateEffectif) }}</span><Statut type="grille" :valeur="g.etat" />
        </button>
      </div>
    </section>
  </div>
  </template>

  <Modal v-if="refus" titre="Refuser la grille proposée" @fermer="refus = false">
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <p class="small">La grille en vigueur reste appliquée. Le motif est transmis à la Finance.</p>
    <label class="form-label" for="gm">Motif du refus</label>
    <textarea id="gm" v-model="motif" rows="3" class="form-control"></textarea>
    <template #pied>
      <button type="button" class="btn btn-light" @click="refus = false">Annuler</button>
      <button type="button" class="btn btn-danger" :disabled="!motif.trim()" @click="refuser">Refuser</button>
    </template>
  </Modal>

  <Modal v-if="nouvelle" titre="Nouvelle grille salariale" large @fermer="nouvelle = null">
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <p v-if="!estDG" class="small muted">La grille sera appliquée après validation par le Directeur général.</p>
    <p class="small muted">Les montants de la grille actuelle sont repris : modifiez ceux qui changent. La grille en vigueur se termine la veille de la date d'effet. Laissez une ligne vide pour ne pas la reprendre.</p>
    <div class="mb-3" style="max-width:240px">
      <label class="form-label" for="ge">Date d'effet</label>
      <input id="ge" v-model="nouvelle.dateEffectif" type="date" class="form-control">
    </div>
    <div class="table-responsive" style="max-height:50vh">
      <table class="table table-sm align-middle">
        <thead><tr><th>Catégorie</th><th>Échelon</th><th>Minimum (Ar)</th><th>Maximum (Ar)</th></tr></thead>
        <tbody>
          <tr v-for="(l, i) in nouvelle.lignes" :key="i">
            <td>{{ l.categorie }}</td><td>{{ l.echelon }}</td>
            <td><input v-model="l.montantMin" type="number" min="0" step="10000" class="form-control form-control-sm"></td>
            <td><input v-model="l.montantMax" type="number" min="0" step="10000" class="form-control form-control-sm"></td>
          </tr>
        </tbody>
      </table>
    </div>
    <template #pied>
      <button type="button" class="btn btn-light" @click="nouvelle = null">Annuler</button>
      <button type="button" class="btn btn-primary" @click="enregistrer">{{ estDG ? 'Enregistrer la grille' : 'Soumettre au DG' }}</button>
    </template>
  </Modal>
</template>
