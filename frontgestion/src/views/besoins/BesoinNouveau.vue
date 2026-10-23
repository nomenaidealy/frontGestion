<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { besoinsApi } from '@/api/besoins'
import { organisationApi } from '@/api/organisation'
import { reportingApi } from '@/api/reporting'
import { useToast } from '@/composables/useToast'
import { aujourdhui, dateFr, TYPES_UNITE } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Rail from '@/components/ui/Rail.vue'
import Icon from '@/components/ui/Icon.vue'

const router = useRouter()
const toast = useToast()

const unites = ref([])
const motifs = ref([])
const metiers = ref([])
const categories = ref([])
const echelons = ref([])
const superieurs = ref([])
const postesVacants = ref([])
const postesOccupes = ref([])
const circuit = ref([])

const form = reactive({ typeBesoin: 'CREATION', idUniteOrga: null, idMotif: null, dateSouhaitee: '', precisionMotif: '' })
const nouvelleLigne = (mode = 'existant') => ({
  mode, idPoste: null, quantite: 1,
  libelle: '', modeMetier: 'existant', idMetier: null, nouveauMetierLibelle: '', idCategorie: null, idEchelon: null, idSuperieurDirect: null,
})
const lignes = ref([nouvelleLigne()])
const remplaces = ref([])      // clés "idPoste:idEmploye" cochées
const nouveauMotif = ref('')
const ajoutMotif = ref(false)
const erreurs = ref([])
const envoi = ref(false)

const effectif = computed(() => form.typeBesoin === 'REMPLACEMENT'
  ? remplaces.value.length
  : lignes.value.reduce((s, l) => s + (Number(l.quantite) || 0), 0))

onMounted(async () => {
  const [u, m, me, c, e, s, ci, acc] = await Promise.all([
    organisationApi.unitesDemandables(), besoinsApi.motifs(), besoinsApi.metiers(), besoinsApi.categories(), besoinsApi.echelons(),
    Promise.resolve([]), organisationApi.circuit(), reportingApi.accueil().catch(() => null),
  ])
  const rang = Object.keys(TYPES_UNITE)
  unites.value = [...u].sort((x, y) => rang.indexOf(x.type) - rang.indexOf(y.type) || x.libelle.localeCompare(y.libelle)); motifs.value = m; metiers.value = me; categories.value = c; echelons.value = e
  superieurs.value = s; circuit.value = ci
  // unité de l'utilisateur proposée par défaut
  const mienne = acc?.unite && u.find((x) => x.libelle === acc.unite)
  if (mienne) form.idUniteOrga = mienne.id
  else if (u.length === 1) form.idUniteOrga = u[0].id
})

// filtre de la liste des unités par niveau (direction, département, service, section)
const niveau = ref('')
const niveaux = computed(() => Object.entries(TYPES_UNITE).filter(([k]) => unites.value.some((u) => u.type === k)))
const unitesFiltrees = computed(() => unites.value.filter((u) => !niveau.value || u.type === niveau.value))
watch(niveau, () => {
  if (form.idUniteOrga && !unitesFiltrees.value.some((u) => u.id === form.idUniteOrga)) form.idUniteOrga = null
})

watch(() => form.idUniteOrga, async (id) => {
  postesVacants.value = []; postesOccupes.value = []; remplaces.value = []
  superieurs.value = []
  lignes.value = lignes.value.map((l) => ({ ...l, idPoste: null, idSuperieurDirect: null }))
  if (!id) return
  // seuls les postes actifs et vacants peuvent être demandés en renfort ; les occupés passent par un remplacement.
  // Le supérieur d'un nouveau poste est pris dans l'unité ou dans une unité dont elle dépend.
  const [v, o, s] = await Promise.all([organisationApi.postes({ etat: 'ACTIF', occupation: 'LIBRE', idUnite: id }),
    besoinsApi.postesOccupes(id), besoinsApi.superieurs(id)])
  postesVacants.value = v
  postesOccupes.value = o
  superieurs.value = s
})

const etapesCircuit = computed(() => {
  const ordres = [...new Set(circuit.value.map((e) => e.ordre))]
  return ordres.map((o) => {
    const e = circuit.value.filter((x) => x.ordre === o)
    return {
      titre: e.map((x) => x.poste).join(' ou '),
      meta: e.some((x) => x.controle === 'BUDGET') ? 'Contrôle budgétaire automatique' : 'Validation',
      statut: 'a-venir',
    }
  })
})

async function creerMotif() {
  const libelle = nouveauMotif.value.trim()
  if (!libelle) return
  try {
    const m = await besoinsApi.creerMotif(libelle)
    motifs.value = await besoinsApi.motifs()
    form.idMotif = m.id
    nouveauMotif.value = ''
    ajoutMotif.value = false
  } catch (e) { toast.erreur(e) }
}

function controler() {
  const l = []
  if (!form.idUniteOrga) l.push("Choisissez l'unité demandeuse.")
  if (!form.idMotif) l.push('Choisissez le motif.')
  if (!form.dateSouhaitee) l.push('Indiquez la date souhaitée.')
  else if (form.dateSouhaitee < aujourdhui()) l.push('La date souhaitée ne peut pas être passée.')
  if (form.precisionMotif.length > 100) l.push('La précision du motif ne dépasse pas 100 caractères.')
  if (form.typeBesoin === 'REMPLACEMENT') {
    if (!remplaces.value.length) l.push('Cochez au moins un employé à remplacer.')
  } else {
    lignes.value.forEach((x, i) => {
      const n = `Poste ${i + 1}`
      if (!(x.quantite > 0)) l.push(`${n} : la quantité doit être au moins 1.`)
      if (x.mode === 'existant' && !x.idPoste) l.push(`${n} : choisissez un poste vacant.`)
      if (x.mode === 'nouveau') {
        if (!x.libelle.trim()) l.push(`${n} : saisissez l'intitulé du poste.`)
        if (x.modeMetier === 'existant' && !x.idMetier) l.push(`${n} : choisissez le métier.`)
        if (x.modeMetier === 'nouveau' && (!x.nouveauMetierLibelle.trim() || !x.idCategorie)) l.push(`${n} : saisissez le nouveau métier et sa catégorie.`)
        if (!x.idEchelon) l.push(`${n} : choisissez l'échelon.`)
      }
    })
  }
  return l
}

async function envoyer() {
  erreurs.value = controler()
  if (erreurs.value.length) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
  const lignesApi = form.typeBesoin === 'REMPLACEMENT'
    ? remplaces.value.map((k) => { const [p, e] = k.split(':').map(Number); return { idPoste: p, idEmployeRemplace: e, quantite: 1 } })
    : lignes.value.map((x) => x.mode === 'existant'
      ? { idPoste: x.idPoste, quantite: Number(x.quantite) }
      : {
          quantite: Number(x.quantite),
          nouveauPoste: {
            libelle: x.libelle.trim(), idEchelon: x.idEchelon, idSuperieurDirect: x.idSuperieurDirect,
            idMetier: x.modeMetier === 'existant' ? x.idMetier : null,
            nouveauMetierLibelle: x.modeMetier === 'nouveau' ? x.nouveauMetierLibelle.trim() : null,
            idCategorie: x.modeMetier === 'nouveau' ? x.idCategorie : null,
          },
        })
  envoi.value = true
  try {
    const b = await besoinsApi.creer({ ...form, precisionMotif: form.precisionMotif.trim() || null, lignes: lignesApi })
    toast.ok(`Besoin ${b.reference} envoyé en validation`)
    router.push(`/besoins/${b.id}`)
  } catch (e) {
    erreurs.value = [e.message]
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <PageHeader titre="Exprimer un besoin" sous-titre="Décrivez les personnes dont votre unité a besoin. La demande part ensuite dans le circuit de validation." retour="/besoins" retour-libelle="Besoins" />

  <div v-if="erreurs.length" class="alert alert-danger" role="alert">
    <b>La demande ne peut pas être envoyée :</b>
    <ul class="mb-0 mt-1" style="padding-left:18px"><li v-for="e in erreurs" :key="e">{{ e }}</li></ul>
  </div>

  <form class="split" novalidate @submit.prevent="envoyer">
    <div class="stack">
      <section class="panel">
        <div class="panel-body">
          <div class="form-section">
            <h3>Nature du besoin</h3>
            <p>Un nouveau poste peut être créé directement dans la demande : il sera actif dès la validation du besoin.</p>
            <div class="choice">
              <label><input v-model="form.typeBesoin" type="radio" value="CREATION"><span><b>Renfort ou création de poste</b><span>Pourvoir un poste vacant ou créer un nouveau poste.</span></span></label>
              <label><input v-model="form.typeBesoin" type="radio" value="REMPLACEMENT"><span><b>Remplacement</b><span>Remplacer un employé qui quitte son poste.</span></span></label>
            </div>
          </div>

          <div class="form-section">
            <h3>Demande</h3>
            <div class="form-grid">
              <div>
                <label class="form-label" for="unite">Unité demandeuse</label>
                <div class="segment segment-sm mb-2" role="group" aria-label="Niveau d'unité">
                  <button type="button" :class="{ on: !niveau }" @click="niveau = ''">Toutes</button>
                  <button v-for="[k, l] in niveaux" :key="k" type="button" :class="{ on: niveau === k }" @click="niveau = k">{{ l }}</button>
                </div>
                <select id="unite" v-model="form.idUniteOrga" class="form-select">
                  <option :value="null" disabled>Choisir… ({{ unitesFiltrees.length }})</option>
                  <optgroup v-for="[k, l] in niveaux.filter(([t]) => !niveau || t === niveau)" :key="k" :label="l">
                    <option v-for="u in unitesFiltrees.filter((x) => x.type === k)" :key="u.id" :value="u.id">
                      {{ u.libelle }}<template v-if="u.uniteMere"> — {{ u.uniteMere }}</template>
                    </option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label class="form-label" for="date">Date d'arrivée souhaitée</label>
                <input id="date" v-model="form.dateSouhaitee" type="date" :min="aujourdhui()" class="form-control">
              </div>
              <div class="full">
                <label class="form-label" for="motif">Motif</label>
                <div class="input-group">
                  <select id="motif" v-model="form.idMotif" class="form-select">
                    <option :value="null" disabled>Choisir…</option>
                    <option v-for="m in motifs" :key="m.id" :value="m.id">{{ m.libelle }}</option>
                  </select>
                  <button type="button" class="btn btn-light" @click="ajoutMotif = !ajoutMotif">Nouveau motif</button>
                </div>
                <div v-if="ajoutMotif" class="input-group mt-2">
                  <input v-model="nouveauMotif" class="form-control" placeholder="Ex. : Ouverture d'une agence" maxlength="150" @keydown.enter.prevent="creerMotif">
                  <button type="button" class="btn btn-primary" @click="creerMotif">Ajouter</button>
                </div>
              </div>
              <div class="full">
                <label class="form-label" for="precision">Précision <span class="opt">(facultatif, 100 caractères)</span></label>
                <input id="precision" v-model="form.precisionMotif" class="form-control" maxlength="100" placeholder="Ex. : projet de paiement mobile, démarrage en janvier">
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Création / renfort -->
      <section v-if="form.typeBesoin === 'CREATION'" class="panel">
        <div class="panel-head"><div><h2>Postes demandés</h2><p>Une ligne par poste ; la quantité donne le nombre de personnes à recruter.</p></div></div>
        <div class="panel-body">
          <p v-if="!form.idUniteOrga" class="muted mb-0">Choisissez d'abord l'unité demandeuse.</p>
          <template v-else>
            <div v-for="(l, i) in lignes" :key="i" class="repeat">
              <div class="repeat-head">
                <b>Poste {{ i + 1 }}</b>
                <button v-if="lignes.length > 1" type="button" class="btn btn-sm btn-outline-danger" @click="lignes.splice(i, 1)">Retirer</button>
              </div>
              <div class="segment mb-3">
                <button type="button" :class="{ on: l.mode === 'existant' }" @click="l.mode = 'existant'">Poste vacant existant</button>
                <button type="button" :class="{ on: l.mode === 'nouveau' }" @click="l.mode = 'nouveau'">Nouveau poste</button>
              </div>

              <div v-if="l.mode === 'existant'" class="form-grid">
                <div>
                  <label class="form-label">Poste vacant</label>
                  <select v-model="l.idPoste" class="form-select">
                    <option :value="null" disabled>{{ postesVacants.length ? 'Choisir…' : 'Aucun poste vacant dans cette unité' }}</option>
                    <option v-for="p in postesVacants" :key="p.id" :value="p.id">{{ p.libelle }}</option>
                  </select>
                  <span v-if="!postesVacants.length" class="form-text">Utilisez « Nouveau poste » pour en créer un.</span>
                </div>
                <div>
                  <label class="form-label">Nombre de personnes</label>
                  <input v-model.number="l.quantite" type="number" min="1" class="form-control" style="max-width:120px">
                </div>
              </div>

              <div v-else class="form-grid">
                <div class="full">
                  <label class="form-label">Intitulé du poste</label>
                  <input v-model="l.libelle" class="form-control" placeholder="Ex. : Développeur mobile">
                </div>
                <div class="full">
                  <label class="form-label">Métier</label>
                  <div class="d-flex gap-3 mb-2">
                    <label class="form-check"><input v-model="l.modeMetier" type="radio" value="existant" class="form-check-input"> <span class="form-check-label">Métier existant</span></label>
                    <label class="form-check"><input v-model="l.modeMetier" type="radio" value="nouveau" class="form-check-input"> <span class="form-check-label">Nouveau métier</span></label>
                  </div>
                  <select v-if="l.modeMetier === 'existant'" v-model="l.idMetier" class="form-select">
                    <option :value="null" disabled>Choisir…</option>
                    <option v-for="m in metiers" :key="m.id" :value="m.id">{{ m.libelle }}</option>
                  </select>
                  <div v-else class="form-grid">
                    <input v-model="l.nouveauMetierLibelle" class="form-control" placeholder="Libellé du métier">
                    <select v-model="l.idCategorie" class="form-select">
                      <option :value="null" disabled>Catégorie…</option>
                      <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.libelle }}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="form-label">Échelon</label>
                  <select v-model="l.idEchelon" class="form-select">
                    <option :value="null" disabled>Choisir…</option>
                    <option v-for="e in echelons" :key="e.id" :value="e.id">{{ e.libelle }}</option>
                  </select>
                  <span class="form-text">La catégorie et l'échelon fixent la fourchette de salaire.</span>
                </div>
                <div>
                  <label class="form-label">Supérieur direct <span class="opt">(facultatif)</span></label>
                  <select v-model="l.idSuperieurDirect" class="form-select">
                    <option :value="null">Aucun</option>
                    <option v-for="s in superieurs" :key="s.id" :value="s.id">{{ s.libelle }}</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">Nombre de personnes</label>
                  <input v-model.number="l.quantite" type="number" min="1" class="form-control" style="max-width:120px">
                </div>
              </div>
            </div>
            <button type="button" class="btn btn-light mt-3" @click="lignes.push(nouvelleLigne())"><Icon name="plus" /> Ajouter un poste</button>
          </template>
        </div>
      </section>

      <!-- Remplacement -->
      <section v-else class="panel">
        <div class="panel-head"><div><h2>Employés à remplacer</h2><p>Le poste reste occupé jusqu'au départ effectif : le remplaçant peut être recruté avant.</p></div></div>
        <p v-if="!form.idUniteOrga" class="panel-body muted mb-0">Choisissez d'abord l'unité demandeuse.</p>
        <p v-else-if="!postesOccupes.length" class="panel-body muted mb-0">Aucun poste occupé dans cette unité.</p>
        <div v-else class="table-responsive">
          <table class="table align-middle">
            <thead><tr><th style="width:40px"></th><th>Employé</th><th>Poste</th><th>Départ prévu</th></tr></thead>
            <tbody>
              <tr v-for="o in postesOccupes" :key="`${o.idPoste}:${o.idEmploye}`">
                <td><input v-model="remplaces" type="checkbox" class="form-check-input" :value="`${o.idPoste}:${o.idEmploye}`" :aria-label="`Remplacer ${o.employe}`"></td>
                <td class="cell-main">{{ o.employe }}<span class="cell-sub">{{ o.matricule }}</span></td>
                <td>{{ o.poste }}</td>
                <td>{{ o.dateDepart ? dateFr(o.dateDepart) : 'Non connu' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <aside class="panel" style="position:sticky;top:76px">
      <div class="panel-head"><h2>Récapitulatif</h2></div>
      <div class="panel-body">
        <dl class="facts" style="grid-template-columns:1fr 1fr">
          <div><dt>Personnes</dt><dd style="font-size:1.5rem">{{ effectif }}</dd></div>
          <div><dt>Arrivée souhaitée</dt><dd>{{ form.dateSouhaitee ? dateFr(form.dateSouhaitee) : '—' }}</dd></div>
        </dl>
        <hr>
        <p class="small fw-semibold mb-2">Circuit de validation</p>
        <Rail :etapes="etapesCircuit" class="rail-vertical" style="flex-direction:column;gap:12px" />
        <p class="small muted mt-3">Le coût annuel est estimé avec le salaire maximum de la grille. L'étape de la Finance est validée d'office s'il tient dans le disponible de l'unité (budget validé moins la masse salariale et les autres besoins en cours).</p>
        <button type="submit" class="btn btn-primary btn-lg w-100" :disabled="envoi"><Icon name="send" /> Envoyer en validation</button>
      </div>
    </aside>
  </form>
</template>

<style scoped>
/* rail vertical dans le récapitulatif */
.rail-vertical :deep(li) { display: grid; grid-template-columns: 28px 1fr; column-gap: 12px; padding: 0; }
.rail-vertical :deep(li::before) { left: 13px; top: 30px; bottom: -12px; right: auto; width: 2px; height: auto; }
.rail-vertical :deep(.rail-title) { margin-top: 3px; }
</style>
