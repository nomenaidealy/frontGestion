<script setup>
// P4 – Fiche d'une proposition : réponses du candidat, contre-proposition, retrait, historique
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { propositionsApi as api, ETAPES_PROPOSITION, montant } from '@/api/propositions'
import { formatDate } from '@/views/offres/format'
import { formatDateHeure } from '@/components/candidatures/candidat'

const props = defineProps({ id: [String, Number] })
const route = useRoute()

const p = ref(null)
const erreur = ref(null)
const message = ref(route.query.message || null)
const nouvelles = ref({})          // idCondition -> nouvelle valeur proposée
const dateLimite = ref('')
const commentaire = ref('')
const motifRetrait = ref('')
const envoi = ref(false)
const copie = ref(false)

async function charger() {
  try {
    p.value = await api.fiche(props.id)
    nouvelles.value = Object.fromEntries(p.value.conditions.filter((c) => c.accepte === false).map((c) => [c.id, c.valeur]))
    erreur.value = null
  } catch (e) {
    erreur.value = e.message
  }
}
onMounted(charger)

const etape = computed(() => ETAPES_PROPOSITION[p.value?.etape] ?? { libelle: p.value?.etape, classe: 'bg-secondary' })
const refusees = computed(() => p.value?.conditions.filter((c) => c.accepte === false) ?? [])

async function contreProposer() {
  envoi.value = true
  try {
    p.value = await api.contreProposer(p.value.id, {
      conditions: Object.entries(nouvelles.value).map(([idCondition, valeur]) => ({ idCondition: Number(idCondition), valeur })),
      dateLimiteReponse: dateLimite.value || null,
      commentaire: commentaire.value || null,
    })
    message.value = 'Contre-proposition envoyée : le candidat peut répondre avec le même lien.'
    erreur.value = null
  } catch (e) {
    erreur.value = e.message
  } finally {
    envoi.value = false
  }
}

async function retirer() {
  if (!window.confirm('Retirer cette proposition ? Le candidat ne pourra plus y répondre.')) return
  envoi.value = true
  try {
    p.value = await api.retirer(p.value.id, motifRetrait.value || null)
    message.value = 'Proposition retirée.'
    erreur.value = null
  } catch (e) {
    erreur.value = e.message
  } finally {
    envoi.value = false
  }
}

async function copier() {
  try {
    await navigator.clipboard.writeText(p.value.lienReponse)
    copie.value = true
    setTimeout(() => (copie.value = false), 2000)
  } catch { /* le lien reste sélectionnable */ }
}

const reponse = (c) => (c.accepte === true ? ['Acceptée', 'text-success'] : c.accepte === false ? ['Refusée', 'text-danger'] : ['En attente', 'text-muted'])
</script>

<template>
  <div class="container" style="max-width: 1000px">
    <RouterLink to="/propositions" class="small">← Propositions</RouterLink>
    <div v-if="message" class="alert alert-success mt-2">{{ message }}</div>
    <div v-if="erreur" class="alert alert-danger mt-2">{{ erreur }}</div>

    <template v-if="p">
      <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mt-2 mb-3">
        <div>
          <h4 class="mb-1">Proposition #{{ p.id }} — {{ p.nom }} {{ p.prenom }}</h4>
          <div class="text-muted small">
            {{ p.email }} · {{ p.telephone }} · offre {{ p.referenceOffre }} ·
            {{ p.siege?.codePoste }} {{ p.siege?.poste }} ({{ p.siege?.unite }})
          </div>
        </div>
        <span class="badge fs-6" :class="etape.classe">{{ etape.libelle }}</span>
      </div>

      <div v-if="p.idContrat" class="alert alert-success">
        Le candidat a tout accepté : il a été embauché automatiquement.
        <RouterLink :to="{ name: 'contrat-fiche', params: { id: p.idContrat } }" class="alert-link">Voir le contrat</RouterLink>
      </div>

      <div v-if="p.etape === 'ATTENTE_CANDIDAT'" class="card card-body mb-3">
        <div class="small fw-semibold mb-1">Lien personnel à transmettre au candidat (réponse avant le {{ formatDate(p.dateLimiteReponse) }})</div>
        <div class="input-group input-group-sm">
          <input class="form-control" :value="p.lienReponse" readonly aria-label="Lien de réponse">
          <button class="btn btn-outline-secondary" type="button" @click="copier">{{ copie ? 'Copié' : 'Copier' }}</button>
          <a class="btn btn-outline-primary" :href="p.lienReponse" target="_blank" rel="noopener">Ouvrir</a>
        </div>
      </div>

      <div class="card shadow-sm mb-3">
        <div class="card-header bg-white fw-semibold">Conditions proposées</div>
        <table class="table align-middle mb-0">
          <thead class="table-light"><tr><th>Condition</th><th>Valeur</th><th>Réponse du candidat</th><th v-if="p.peutContreProposer">Nouvelle valeur</th></tr></thead>
          <tbody>
            <tr v-for="c in p.conditions" :key="c.id">
              <td class="fw-semibold">{{ c.libelle }}</td>
              <td>
                {{ c.valeurAffichee }}
                <div v-if="c.ancienneValeurAffichee" class="small text-muted">avant : <s>{{ c.ancienneValeurAffichee }}</s></div>
              </td>
              <td>
                <span :class="reponse(c)[1]">{{ reponse(c)[0] }}</span>
                <div v-if="c.commentaireCandidat" class="small fst-italic">« {{ c.commentaireCandidat }} »</div>
              </td>
              <td v-if="p.peutContreProposer">
                <input v-if="c.accepte === false" v-model="nouvelles[c.id]" class="form-control form-control-sm"
                       :type="c.code === 'SALAIRE' ? 'number' : c.code === 'DATE_DEBUT' ? 'date' : 'text'"
                       :aria-label="'Nouvelle valeur ' + c.libelle">
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="p.salaireMin != null" class="card-footer bg-white small text-muted">
          Grille salariale du poste : {{ montant(p.salaireMin) }} à {{ montant(p.salaireMax) }} Ar
        </div>
      </div>

      <div v-if="p.peutContreProposer && refusees.length" class="card card-body mb-3 border-warning">
        <h6>Contre-proposition</h6>
        <div class="row g-2">
          <div class="col-md-4">
            <label class="form-label small" for="dl">Nouvelle date limite de réponse</label>
            <input id="dl" v-model="dateLimite" type="date" class="form-control form-control-sm">
          </div>
          <div class="col-md-8">
            <label class="form-label small" for="com">Message au candidat</label>
            <input id="com" v-model="commentaire" class="form-control form-control-sm">
          </div>
        </div>
        <div class="text-end mt-2">
          <button class="btn btn-warning btn-sm" :disabled="envoi" @click="contreProposer">Envoyer la contre-proposition</button>
        </div>
      </div>

      <div v-if="p.peutRetirer" class="card card-body mb-3">
        <div class="d-flex gap-2 align-items-end">
          <div class="flex-grow-1">
            <label class="form-label small" for="motif">Motif du retrait</label>
            <input id="motif" v-model="motifRetrait" class="form-control form-control-sm">
          </div>
          <button class="btn btn-outline-danger btn-sm" :disabled="envoi" @click="retirer">Retirer la proposition</button>
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="card-header bg-white fw-semibold">Historique</div>
        <ul class="list-group list-group-flush">
          <li v-for="(h, i) in p.historique" :key="'h' + i" class="list-group-item small">
            <strong>{{ formatDateHeure(h.date) }}</strong> — {{ h.statut }}
            <span v-if="h.utilisateur" class="text-muted">par {{ h.utilisateur }}</span>
            <div v-if="h.commentaire" class="text-muted">{{ h.commentaire }}</div>
          </li>
          <li v-for="r in p.relances" :key="'r' + r.id" class="list-group-item small">
            <strong>{{ formatDateHeure(r.date) }}</strong> — contre-proposition {{ r.libelle }} :
            {{ r.ancienneValeur }} → {{ r.nouvelleValeur }} <span class="badge bg-light text-dark">{{ r.statut }}</span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
