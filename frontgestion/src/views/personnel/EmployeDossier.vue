<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { personnelApi } from '@/api/personnel'
import { organisationApi } from '@/api/organisation'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { aujourdhui, dateFr, MOTIFS_DEPART, initiales } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Modal from '@/components/ui/Modal.vue'
import Chargement from '@/components/ui/Chargement.vue'
import EmployeFormulaire from './EmployeFormulaire.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const { a } = useAuth()
const toast = useToast()
const d = ref(null)
const onglet = ref('poste')
const dialogue = ref(null)          // identite | mutation | depart | banque
const form = reactive({})
const postesLibres = ref([])
const erreur = ref('')

const f = computed(() => d.value?.fiche)
const charger = async () => { d.value = await personnelApi.dossier(props.id) }
onMounted(charger)

async function ouvrir(type) {
  erreur.value = ''
  for (const k of Object.keys(form)) delete form[k]
  if (type === 'identite') {
    Object.assign(form, { nom: f.value.nom, prenoms: f.value.prenoms || '', dateNaissance: f.value.dateNaissance || '', cin: f.value.cin || '',
      telephone: f.value.telephone || '', email: f.value.email || '', adresse: f.value.adresse || '' })
  }
  if (type === 'mutation') {
    Object.assign(form, { idPoste: null, date: aujourdhui() })
    postesLibres.value = await organisationApi.postes({ etat: 'ACTIF', occupation: 'LIBRE' })
  }
  if (type === 'depart') Object.assign(form, { date: aujourdhui(), motif: 'DEMISSION', commentaire: '' })
  if (type === 'banque') Object.assign(form, { banque: '', agence: '', titulaire: `${f.value.nom} ${f.value.prenoms || ''}`.trim(), rib: '', dateEffet: aujourdhui() })
  dialogue.value = type
}

async function enregistrer() {
  erreur.value = ''
  try {
    if (dialogue.value === 'identite') d.value = await personnelApi.modifier(props.id, { ...form, dateNaissance: form.dateNaissance || null })
    if (dialogue.value === 'mutation') d.value = await personnelApi.muter(props.id, form)
    if (dialogue.value === 'depart') d.value = await personnelApi.depart(props.id, form)
    if (dialogue.value === 'banque') { await personnelApi.enregistrerBanque(props.id, form); await charger() }
    toast.ok({ identite: 'Identité enregistrée', mutation: 'Mutation enregistrée', depart: 'Départ enregistré', banque: 'Coordonnées bancaires enregistrées' }[dialogue.value])
    dialogue.value = null
  } catch (e) { erreur.value = e.message }
}

const ONGLETS = [['poste', 'Poste et parcours'], ['contrats', 'Contrats'], ['onboarding', 'Onboarding'], ['banque', 'Coordonnées bancaires']]
</script>

<template>
  <Chargement v-if="!d" />
  <template v-else>
    <PageHeader :titre="`${f.nom} ${f.prenoms || ''}`" retour="/personnel" retour-libelle="Employés">
      <template #sous-titre>
        <p class="d-flex flex-wrap gap-2 align-items-center"><Statut type="employe" :valeur="d.statut" /> {{ f.matricule }} — {{ f.poste || 'Sans poste' }}<template v-if="f.unite">, {{ f.unite }}</template></p>
      </template>
      <template v-if="a('RH')">
        <button type="button" class="btn btn-light" @click="ouvrir('identite')">Modifier l'identité</button>
        <template v-if="d.statut === 'ACTIF'">
          <button type="button" class="btn btn-light" @click="ouvrir('mutation')">Muter</button>
          <button type="button" class="btn btn-outline-danger" @click="ouvrir('depart')">Enregistrer un départ</button>
        </template>
      </template>
    </PageHeader>

    <div class="split">
      <div>
        <nav class="tabs" aria-label="Dossier">
          <button v-for="[k, l] in ONGLETS" :key="k" type="button" :class="{ on: onglet === k }" @click="onglet = k">{{ l }}
            <span v-if="k === 'contrats'" class="count">{{ f.contrats.length }}</span>
          </button>
        </nav>

        <section v-if="onglet === 'poste'" class="panel">
          <div class="panel-body">
            <dl class="facts mb-4">
              <div><dt>Poste actuel</dt><dd><RouterLink v-if="f.idPoste" :to="`/postes/${f.idPoste}`">{{ f.poste }}</RouterLink><template v-else>—</template></dd></div>
              <div><dt>Unité</dt><dd>{{ f.unite || '—' }}</dd></div>
              <div><dt>Supérieur direct</dt><dd>{{ f.superieur || '—' }}</dd></div>
              <div><dt>Sur ce poste depuis</dt><dd>{{ dateFr(f.dateEntree) }}</dd></div>
            </dl>
            <p class="small fw-semibold mb-2">Parcours dans l'entreprise</p>
            <ul class="timeline">
              <li v-for="x in d.affectations" :key="x.id" :class="{ muted: !x.enCours }">
                <div class="tl-head">{{ x.poste }} <span class="muted fw-normal">— {{ x.unite }}</span></div>
                <div class="tl-meta">du {{ dateFr(x.dateDebut) }} {{ x.dateFin ? `au ${dateFr(x.dateFin)}` : "à aujourd'hui" }}</div>
              </li>
            </ul>
          </div>
        </section>

        <section v-if="onglet === 'contrats'" class="panel">
          <p v-if="!f.contrats.length" class="panel-body muted mb-0">Aucun contrat enregistré pour cet employé.</p>
          <div v-else class="table-responsive">
            <table class="table align-middle">
              <thead><tr><th>Référence</th><th>Type</th><th>Début</th><th>Fin prévue</th><th>Statut</th></tr></thead>
              <tbody>
                <tr v-for="c in f.contrats" :key="c.id" class="cliquable" @click="$router.push(`/contrats/${c.id}`)">
                  <td class="cell-main">{{ c.reference }}<span v-if="c.referencePrecedent" class="cell-sub">suite de {{ c.referencePrecedent }}</span></td>
                  <td>{{ c.type }}</td><td>{{ dateFr(c.dateDebut) }}</td><td>{{ c.dateFinPrevue ? dateFr(c.dateFinPrevue) : 'Sans limite' }}</td>
                  <td><Statut type="contrat" :valeur="c.statut" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="onglet === 'onboarding'" class="panel">
          <p v-if="!d.onboardings.length" class="panel-body muted mb-0">L'onboarding démarre à la signature du premier contrat.</p>
          <div v-for="o in d.onboardings" :key="o.id" class="panel-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <RouterLink :to="`/onboarding/${o.id}`" class="fw-semibold">{{ o.modele }} — contrat {{ o.contrat }}</RouterLink>
              <Statut type="onboarding" :valeur="o.statut" />
            </div>
            <div class="progress-line"><span :style="{ width: `${o.total ? (o.faites * 100) / o.total : 0}%` }"></span></div>
            <p class="small muted mt-2 mb-0">{{ o.faites }} tâche(s) sur {{ o.total }}<template v-if="o.enRetard">, {{ o.enRetard }} en retard</template></p>
          </div>
        </section>

        <section v-if="onglet === 'banque'" class="panel">
          <div class="panel-head">
            <div><h2>Coordonnées bancaires</h2><p>Utilisées pour le virement du salaire.</p></div>
            <button v-if="a('RH')" type="button" class="btn btn-sm btn-primary" @click="ouvrir('banque')">Nouvelles coordonnées</button>
          </div>
          <p v-if="!d.banque.length" class="panel-body muted mb-0">Aucune coordonnée bancaire enregistrée.</p>
          <div v-else class="table-responsive">
            <table class="table">
              <thead><tr><th>Banque</th><th>Titulaire</th><th>RIB / IBAN</th><th>Depuis</th><th></th></tr></thead>
              <tbody>
                <tr v-for="x in d.banque" :key="x.id" :class="{ muted: !x.actif }">
                  <td class="cell-main">{{ x.banque }}<span class="cell-sub">{{ x.agence }}</span></td>
                  <td>{{ x.titulaire }}</td><td><code>{{ x.rib }}</code></td><td>{{ dateFr(x.dateEffet) }}</td>
                  <td><span v-if="x.actif" class="status ok">En cours</span><span v-else class="small muted">Remplacées</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside class="panel">
        <div class="panel-body">
          <div class="d-flex align-items-center gap-3 mb-3">
            <span class="avatar" style="width:48px;height:48px;font-size:.95rem">{{ initiales(`${f.nom} ${f.prenoms || ''}`) }}</span>
            <div><b>{{ f.nom }} {{ f.prenoms }}</b><div class="small muted">{{ f.matricule }}</div></div>
          </div>
          <dl class="facts" style="grid-template-columns:1fr">
            <div><dt>Date de naissance</dt><dd>{{ dateFr(f.dateNaissance) }}</dd></div>
            <div><dt>CIN</dt><dd>{{ f.cin || '—' }}</dd></div>
            <div><dt>Téléphone</dt><dd>{{ f.telephone || '—' }}</dd></div>
            <div><dt>Email</dt><dd><a v-if="f.email" :href="`mailto:${f.email}`">{{ f.email }}</a><template v-else>—</template></dd></div>
            <div><dt>Adresse</dt><dd>{{ f.adresse || '—' }}</dd></div>
            <div><dt>Compte utilisateur</dt><dd>{{ d.compte || 'Aucun' }}</dd></div>
          </dl>
        </div>
      </aside>
    </div>

    <Modal v-if="dialogue" :titre="{ identite: 'Modifier l\'identité', mutation: 'Muter l\'employé', depart: 'Enregistrer un départ', banque: 'Coordonnées bancaires' }[dialogue]"
           :large="dialogue === 'identite'" @fermer="dialogue = null">
      <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
      <EmployeFormulaire v-if="dialogue === 'identite'" v-model="form" />
      <div v-if="dialogue === 'mutation'" class="form-grid">
        <p class="full small muted mb-0">L'affectation actuelle se termine la veille. Le contrat en cours suit l'employé sur son nouveau poste.</p>
        <div class="full">
          <label class="form-label" for="mp">Nouveau poste</label>
          <select id="mp" v-model="form.idPoste" class="form-select">
            <option :value="null" disabled>Choisir un poste vacant…</option>
            <option v-for="p in postesLibres" :key="p.id" :value="p.id">{{ p.libelle }} — {{ p.unite }}</option>
          </select>
        </div>
        <div><label class="form-label" for="md">Date d'effet</label><input id="md" v-model="form.date" type="date" class="form-control"></div>
      </div>
      <div v-if="dialogue === 'depart'" class="form-grid">
        <p class="full small muted mb-0">L'affectation et les contrats en cours se terminent à cette date. Le poste reste occupé jusque-là, puis redevient vacant.</p>
        <div><label class="form-label" for="dd">Date de départ</label><input id="dd" v-model="form.date" type="date" class="form-control"></div>
        <div>
          <label class="form-label" for="dm">Motif</label>
          <select id="dm" v-model="form.motif" class="form-select"><option v-for="(l, k) in MOTIFS_DEPART" :key="k" :value="k">{{ l }}</option></select>
        </div>
        <div class="full"><label class="form-label" for="dc">Commentaire <span class="opt">(facultatif)</span></label><textarea id="dc" v-model="form.commentaire" class="form-control" rows="2"></textarea></div>
      </div>
      <div v-if="dialogue === 'banque'" class="form-grid">
        <div><label class="form-label" for="bb">Banque</label><input id="bb" v-model="form.banque" class="form-control" placeholder="BNI Madagascar"></div>
        <div><label class="form-label" for="ba">Agence <span class="opt">(facultatif)</span></label><input id="ba" v-model="form.agence" class="form-control"></div>
        <div class="full"><label class="form-label" for="bt">Titulaire du compte</label><input id="bt" v-model="form.titulaire" class="form-control"></div>
        <div class="full"><label class="form-label" for="br">RIB ou IBAN</label><input id="br" v-model="form.rib" class="form-control" placeholder="00005 00001 12345678901 23"></div>
        <div><label class="form-label" for="be">À partir du</label><input id="be" v-model="form.dateEffet" type="date" class="form-control"></div>
      </div>
      <template #pied>
        <button type="button" class="btn btn-light" @click="dialogue = null">Annuler</button>
        <button type="button" class="btn" :class="dialogue === 'depart' ? 'btn-danger' : 'btn-primary'" @click="enregistrer">Enregistrer</button>
      </template>
    </Modal>
  </template>
</template>
