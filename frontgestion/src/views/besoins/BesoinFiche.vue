<script setup>
import { computed, onMounted, ref } from 'vue'
import { besoinsApi } from '@/api/besoins'
import { useToast } from '@/composables/useToast'
import { ariary, dateFr, dateHeure, TYPES_BESOIN } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Rail from '@/components/ui/Rail.vue'
import Modal from '@/components/ui/Modal.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Icon from '@/components/ui/Icon.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const toast = useToast()
const b = ref(null)
const erreur = ref('')
const dialogue = ref(null)       // 'valider' | 'refuser' | 'annuler'
const commentaire = ref('')
const erreurDialogue = ref('')
const envoi = ref(false)

async function charger() {
  try { b.value = await besoinsApi.fiche(props.id) } catch (e) { erreur.value = e.message }
}
onMounted(charger)

const LIBELLES_ACTION = {
  CREATION: 'Demande soumise', VALIDATION: 'Étape validée', VALIDATION_AUTOMATIQUE: 'Validation automatique (budget)',
  REFUS: 'Demande refusée', OUVERTURE_RECRUTEMENT: 'Recrutement ouvert', SIEGE_POURVU: 'Siège pourvu',
  POURVU: 'Besoin pourvu', ANNULATION: 'Demande annulée',
}

const etapes = computed(() => (b.value?.circuit || []).map((e) => ({
  titre: e.poste,
  meta: e.statut === 'FAIT' || e.statut === 'REFUSE'
    ? `${e.decideur} — ${dateHeure(e.date)}`
    : e.statut === 'EN_COURS' ? 'Décision attendue' : e.controleBudget ? 'Contrôle budgétaire' : 'À venir',
  note: e.commentaire,
  statut: { FAIT: 'fait', EN_COURS: 'en-cours', REFUSE: 'refuse', NON_ATTEINTE: 'non-atteinte' }[e.statut] || 'a-venir',
})))

const ecart = computed(() => {
  const x = b.value?.budget
  if (!x?.budgetUnite || !x?.coutAnnuel) return null
  if (!(x.disponible > 0)) return 100
  return Math.min(100, Math.round((x.coutAnnuel / x.disponible) * 100))
})

function ouvrir(type) {
  dialogue.value = type
  commentaire.value = ''
  erreurDialogue.value = ''
}

async function confirmer() {
  erreurDialogue.value = ''
  if (dialogue.value !== 'valider' && !commentaire.value.trim()) {
    erreurDialogue.value = 'Le motif est obligatoire.'
    return
  }
  envoi.value = true
  try {
    if (dialogue.value === 'valider') await besoinsApi.valider(b.value.id, commentaire.value.trim())
    if (dialogue.value === 'refuser') await besoinsApi.refuser(b.value.id, commentaire.value.trim())
    if (dialogue.value === 'annuler') await besoinsApi.annuler(b.value.id, commentaire.value.trim())
    toast.ok({ valider: 'Besoin validé', refuser: 'Besoin refusé', annuler: 'Besoin annulé' }[dialogue.value])
    dialogue.value = null
    await charger()
  } catch (e) {
    erreurDialogue.value = e.message
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
  <Chargement v-else-if="!b" />
  <template v-else>
    <PageHeader :titre="`Besoin ${b.reference}`" retour="/besoins" retour-libelle="Besoins">
      <template #sous-titre>
        <p class="d-flex flex-wrap align-items-center gap-2">
          <Statut type="besoin" :valeur="b.etat" />
          {{ TYPES_BESOIN[b.typeBesoin] }} pour {{ b.unite }} — demandé par {{ b.demandeur }} le {{ dateFr(b.dateDemande) }}
        </p>
      </template>
      <button v-if="b.actions.refuser" type="button" class="btn btn-outline-danger" @click="ouvrir('refuser')">Refuser</button>
      <button v-if="b.actions.valider" type="button" class="btn btn-primary" @click="ouvrir('valider')"><Icon name="check" /> Valider</button>
      <RouterLink v-if="b.actions.creerOffre" class="btn btn-primary"
                  :to="b.actions.postesSansOffre.length === 1
                    ? { path: '/offres/nouvelle', query: { idBesoin: b.id, idPoste: b.actions.postesSansOffre[0] } }
                    : '/offres/besoins'">
        {{ b.actions.postesSansOffre.length > 1 ? `Créer les offres d'emploi (${b.actions.postesSansOffre.length} postes)` : "Créer l'offre d'emploi" }}
      </RouterLink>
      <button v-if="b.actions.annuler" type="button" class="btn btn-light" @click="ouvrir('annuler')">Annuler la demande</button>
    </PageHeader>

    <div v-if="b.actions.valider" class="alert alert-warning">Cette demande attend votre décision.</div>

    <section class="panel">
      <div class="panel-head"><h2>Circuit de validation</h2></div>
      <div class="panel-body"><Rail :etapes="etapes" /></div>
    </section>

    <div class="split" style="margin-top:18px">
      <div class="stack">
        <section class="panel">
          <div class="panel-head"><h2>Demande</h2></div>
          <div class="panel-body">
            <dl class="facts">
              <div><dt>Motif</dt><dd>{{ b.motif }}</dd></div>
              <div><dt>Précision</dt><dd>{{ b.precisionMotif || '—' }}</dd></div>
              <div><dt>Arrivée souhaitée</dt><dd>{{ dateFr(b.dateSouhaitee) }}</dd></div>
              <div><dt>Effectif</dt><dd>{{ b.effectif }} personne(s)</dd></div>
            </dl>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><div><h2>Sièges à pourvoir</h2><p>Un siège par personne demandée.</p></div></div>
          <div class="table-responsive">
            <table class="table">
              <thead><tr><th>Poste</th><th>Métier et échelon</th><th class="num">Fourchette mensuelle</th><th>Siège</th><th>Remplace / retenu</th></tr></thead>
              <tbody>
                <tr v-for="l in b.lignes" :key="l.id">
                  <td>
                    <RouterLink :to="`/postes/${l.idPoste}`" class="cell-main text-decoration-none">{{ l.poste }}</RouterLink>
                    <span class="cell-sub">{{ l.codePoste }} <Statut v-if="l.etatPoste !== 'ACTIF'" type="poste" :valeur="l.etatPoste" /></span>
                  </td>
                  <td>{{ l.metier }}<span class="cell-sub">{{ l.echelon }}</span></td>
                  <td class="num">{{ l.salaireMin ? `${ariary(l.salaireMin)} – ${ariary(l.salaireMax)}` : 'Hors grille' }}</td>
                  <td><Statut type="siege" :valeur="l.etat" /></td>
                  <td>
                    <template v-if="l.employeRemplace">Remplace {{ l.employeRemplace }}</template>
                    <template v-if="l.candidatRetenu"><span class="cell-sub">Recruté : {{ l.candidatRetenu }}</span></template>
                    <span v-if="!l.employeRemplace && !l.candidatRetenu" class="muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="b.lignes.some((l) => l.etatPoste === 'PROPOSE')" class="panel-foot" style="justify-content:flex-start">
            <span class="small muted">Les postes proposés deviendront actifs à la validation finale de ce besoin.</span>
          </div>
        </section>

        <section v-if="b.offres.length" class="panel">
          <div class="panel-head"><h2>Offres d'emploi</h2></div>
          <div class="list-group list-group-flush">
            <RouterLink v-for="o in b.offres" :key="o.id" :to="{ path: '/candidatures', query: { offre: o.id } }"
                        class="list-group-item list-group-item-action d-flex justify-content-between align-items-center text-decoration-none">
              <span><b>{{ o.reference }}</b><template v-if="o.poste"> · {{ o.poste }}</template> <span class="muted small">publiée le {{ dateFr(o.datePublication) }}, candidatures jusqu'au {{ dateFr(o.dateLimite) }}</span></span>
              <Statut type="offre" :valeur="o.etat" />
            </RouterLink>
          </div>
        </section>
      </div>

      <div class="stack">
        <section class="panel">
          <div class="panel-head"><h2>Budget {{ b.budget.exercice }}</h2></div>
          <div class="panel-body">
            <dl class="facts" style="grid-template-columns:1fr">
              <div><dt>Coût annuel estimé</dt><dd style="font-size:1.25rem">{{ ariary(b.budget.coutAnnuel) }}</dd></div>
              <div><dt>Budget de l'unité</dt><dd>{{ b.budget.budgetUnite ? ariary(b.budget.budgetUnite) : 'Aucun budget validé' }}</dd></div>
              <template v-if="b.budget.budgetUnite">
                <div><dt>Masse salariale annuelle</dt><dd>− {{ ariary(b.budget.masseSalariale) }}</dd></div>
                <div><dt>Autres besoins en cours</dt><dd>− {{ ariary(b.budget.autresBesoins) }}</dd></div>
                <div><dt>Disponible pour ce besoin</dt><dd :class="b.budget.disponible < 0 ? 'text-danger fw-semibold' : 'fw-semibold'">{{ ariary(b.budget.disponible) }}</dd></div>
              </template>
            </dl>
            <template v-if="ecart !== null">
              <div class="progress-line mt-3"><span :style="{ width: `${ecart}%`, background: b.budget.dansLeBudget ? '' : 'var(--sirh-danger)' }"></span></div>
              <p class="small mt-2 mb-0" :class="b.budget.dansLeBudget ? 'text-success' : 'text-danger'">
                {{ b.budget.dansLeBudget ? 'Le besoin tient dans le disponible de l\'unité.'
                  : b.etat === 'EN_ATTENTE' ? 'Le besoin dépasse le budget : la Finance décide.' : 'Dépassement du budget soumis à la décision de la Finance.' }}
              </p>
            </template>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head"><h2>Historique</h2></div>
          <div class="panel-body">
            <ul class="timeline">
              <li v-for="(h, i) in b.historique" :key="i" :class="{ danger: h.action === 'REFUS' || h.action === 'ANNULATION' }">
                <div class="tl-head">{{ LIBELLES_ACTION[h.action] || h.action }}</div>
                <div class="tl-meta">{{ h.auteur }} — {{ dateHeure(h.date) }}</div>
                <div v-if="h.commentaire" class="tl-body">{{ h.commentaire }}</div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>

    <Modal v-if="dialogue" :titre="{ valider: 'Valider le besoin', refuser: 'Refuser le besoin', annuler: 'Annuler la demande' }[dialogue]" @fermer="dialogue = null">
      <p v-if="dialogue === 'valider'">La demande passera à l'étape suivante du circuit.</p>
      <p v-else-if="dialogue === 'refuser'">Le besoin sera annulé et le demandeur prévenu avec votre motif.</p>
      <p v-else>Le besoin ne sera plus traité. Les postes qu'il proposait seront refusés.</p>
      <label class="form-label" for="com">{{ dialogue === 'valider' ? 'Commentaire' : 'Motif' }} <span v-if="dialogue === 'valider'" class="opt">(facultatif)</span></label>
      <textarea id="com" v-model="commentaire" class="form-control" :class="{ 'is-invalid': erreurDialogue }" rows="3"></textarea>
      <div class="invalid-feedback">{{ erreurDialogue }}</div>
      <template #pied>
        <button type="button" class="btn btn-light" @click="dialogue = null">Fermer</button>
        <button type="button" class="btn" :class="dialogue === 'valider' ? 'btn-primary' : 'btn-danger'" :disabled="envoi" @click="confirmer">
          {{ { valider: 'Valider', refuser: 'Refuser le besoin', annuler: 'Annuler la demande' }[dialogue] }}
        </button>
      </template>
    </Modal>
  </template>
</template>
