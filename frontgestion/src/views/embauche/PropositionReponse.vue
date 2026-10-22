<script setup>
// P4 – Page publique du candidat (lien personnel /proposition/:jeton) : accepter ou refuser chaque condition
import { ref, computed, onMounted } from 'vue'
import { propositionPubliqueApi as api } from '@/api/propositions'
import { formatDate } from '@/views/offres/format'

const props = defineProps({ jeton: String })

const p = ref(null)
const erreur = ref(null)
const reponses = ref({})   // idCondition -> { accepte, commentaire }
const envoi = ref(false)
const declin = ref(false)
const motifDeclin = ref('')

function preparer(dto) {
  p.value = dto
  reponses.value = Object.fromEntries(dto.conditions.filter(aRepondre).map((c) => [c.id, { accepte: null, commentaire: '' }]))
}
// Conditions déjà acceptées : rien à redire ; les autres (nouvelles ou contre-proposées) attendent une réponse
const aRepondre = (c) => c.accepte !== true
const aTraiter = computed(() => p.value?.conditions.filter(aRepondre) ?? [])
const complet = computed(() => aTraiter.value.every((c) => reponses.value[c.id]?.accepte !== null))

onMounted(async () => {
  try {
    preparer(await api.voir(props.jeton))
  } catch (e) {
    erreur.value = e.status === 404 ? 'Ce lien n\'est pas valide.' : e.message
  }
})

async function envoyer() {
  envoi.value = true
  erreur.value = null
  try {
    preparer(await api.repondre(props.jeton, aTraiter.value.map((c) => ({
      idCondition: c.id, accepte: reponses.value[c.id].accepte, commentaire: reponses.value[c.id].commentaire || null,
    }))))
  } catch (e) {
    erreur.value = e.message
  } finally {
    envoi.value = false
  }
}

async function decliner() {
  envoi.value = true
  try {
    preparer(await api.decliner(props.jeton, motifDeclin.value || null))
    declin.value = false
  } catch (e) {
    erreur.value = e.message
  } finally {
    envoi.value = false
  }
}

const couleur = { ACCEPTEE: 'alert-success', REFUSEE: 'alert-secondary', EXPIREE: 'alert-secondary', ATTENTE_RH: 'alert-info', ATTENTE_CANDIDAT: 'alert-light border' }
</script>

<template>
  <div class="container" style="max-width: 820px">
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div v-if="!p && !erreur" class="text-muted">Chargement…</div>

    <template v-if="p">
      <h4 class="mb-1">Proposition d'embauche</h4>
      <p class="text-muted">
        {{ p.prenom }} {{ p.nom }} — poste <strong>{{ p.poste }}</strong> ({{ p.unite }}), offre {{ p.referenceOffre }}
      </p>

      <div class="alert" :class="couleur[p.etape] ?? 'alert-light'">{{ p.message }}</div>

      <div class="card shadow-sm">
        <ul class="list-group list-group-flush">
          <li v-for="c in p.conditions" :key="c.id" class="list-group-item py-3">
            <div class="d-flex flex-wrap justify-content-between gap-2">
              <div>
                <div class="fw-semibold">{{ c.libelle }}</div>
                <div>{{ c.valeurAffichee }}
                  <span v-if="c.ancienneValeurAffichee" class="badge bg-warning text-dark ms-1">nouvelle proposition</span>
                </div>
                <div v-if="c.ancienneValeurAffichee" class="small text-muted">précédemment : <s>{{ c.ancienneValeurAffichee }}</s></div>
              </div>
              <div v-if="p.peutRepondre && aRepondre(c)" class="btn-group btn-group-sm align-self-start" role="group" :aria-label="'Réponse ' + c.libelle">
                <input :id="'ok' + c.id" v-model="reponses[c.id].accepte" class="btn-check" type="radio" :value="true">
                <label class="btn btn-outline-success" :for="'ok' + c.id">J'accepte</label>
                <input :id="'ko' + c.id" v-model="reponses[c.id].accepte" class="btn-check" type="radio" :value="false">
                <label class="btn btn-outline-danger" :for="'ko' + c.id">Je refuse</label>
              </div>
              <span v-else-if="c.accepte === true" class="text-success small align-self-start">Acceptée</span>
              <span v-else-if="c.accepte === false" class="text-danger small align-self-start">Refusée</span>
            </div>
            <input v-if="p.peutRepondre && aRepondre(c) && reponses[c.id].accepte === false" v-model="reponses[c.id].commentaire"
                   class="form-control form-control-sm mt-2" placeholder="Votre souhait (ex. le salaire attendu)" :aria-label="'Commentaire ' + c.libelle">
          </li>
        </ul>
      </div>

      <div v-if="p.peutRepondre" class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
        <span class="small text-muted">Réponse attendue avant le {{ formatDate(p.dateLimiteReponse) }}</span>
        <div class="d-flex gap-2">
          <button class="btn btn-link text-danger btn-sm" type="button" @click="declin = !declin">Décliner la proposition</button>
          <button class="btn btn-primary" :disabled="envoi || !complet" @click="envoyer">Envoyer ma réponse</button>
        </div>
      </div>
      <div v-if="declin" class="card card-body mt-2 border-danger">
        <label class="form-label small" for="motif">Pourquoi déclinez-vous ? (facultatif)</label>
        <input id="motif" v-model="motifDeclin" class="form-control form-control-sm mb-2">
        <div class="text-end"><button class="btn btn-danger btn-sm" :disabled="envoi" @click="decliner">Confirmer le refus</button></div>
      </div>
    </template>
  </div>
</template>
