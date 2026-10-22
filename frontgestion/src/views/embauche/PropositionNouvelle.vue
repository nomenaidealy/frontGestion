<script setup>
// P4 – Nouvelle proposition d'embauche pour un candidat retenu
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { propositionsApi as api, montant } from '@/api/propositions'

const route = useRoute()
const router = useRouter()
const idCandidature = Number(route.query.candidature)

const f = ref(null)          // formulaire renvoyé par le back (sièges, types de contrat, valeurs par défaut)
const erreur = ref(null)
const champs = ref({})
const envoi = ref(false)
const req = ref({
  idBesoinPoste: null, salaire: null, dateDebut: '', horaire: '8h00 - 16h00, du lundi au vendredi', lieu: '',
  conditionsTravail: '', idTypeContrat: null, dateLimiteReponse: '', commentaire: '',
})

onMounted(async () => {
  if (!idCandidature) { erreur.value = 'Candidature non précisée'; return }
  try {
    f.value = await api.formulaire(idCandidature)
    const libres = f.value.sieges.filter((s) => s.disponible)
    req.value.idBesoinPoste = libres[0]?.idBesoinPoste ?? null
    req.value.idTypeContrat = f.value.idTypeContratParDefaut
    req.value.dateDebut = f.value.dateDebutParDefaut ?? ''
    req.value.dateLimiteReponse = f.value.dateLimiteReponseParDefaut ?? ''
    req.value.lieu = f.value.lieuParDefaut ?? ''
  } catch (e) {
    erreur.value = e.message
  }
})

const siege = computed(() => f.value?.sieges.find((s) => s.idBesoinPoste === req.value.idBesoinPoste) ?? null)
const horsGrille = computed(() => {
  const s = siege.value, v = Number(req.value.salaire)
  if (!s || !req.value.salaire || s.salaireMin == null) return false
  return v < s.salaireMin || v > s.salaireMax
})

async function envoyer() {
  envoi.value = true
  erreur.value = null
  champs.value = {}
  try {
    const p = await api.creer({ idCandidature, ...req.value, commentaire: req.value.commentaire || null })
    router.push({ name: 'proposition-fiche', params: { id: p.id }, query: { message: 'Proposition envoyée. Transmettez le lien personnel au candidat.' } })
  } catch (e) {
    erreur.value = e.message
    champs.value = e.champs ?? {}
  } finally {
    envoi.value = false
  }
}
const invalide = (c) => (champs.value[c] ? 'is-invalid' : '')
</script>

<template>
  <div class="container" style="max-width: 900px">
    <RouterLink to="/propositions" class="small">← Propositions</RouterLink>
    <h4 class="mt-2 mb-1">Nouvelle proposition d'embauche</h4>
    <p v-if="f" class="text-muted">{{ f.nom }} {{ f.prenom }} · {{ f.email }} · offre {{ f.referenceOffre }}</p>

    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div v-if="!f && !erreur" class="text-muted">Chargement…</div>

    <form v-if="f" class="card shadow-sm card-body" @submit.prevent="envoyer">
      <div v-if="f.propositionsPrecedentes?.length" class="alert alert-secondary small">
        Propositions précédentes :
        <span v-for="p in f.propositionsPrecedentes" :key="p.id" class="me-2">#{{ p.id }} {{ p.etape }}</span>
      </div>

      <div class="mb-3">
        <label class="form-label fw-semibold" for="siege">Poste proposé (siège du besoin)</label>
        <select id="siege" v-model="req.idBesoinPoste" class="form-select" :class="invalide('idBesoinPoste')" required>
          <option v-for="s in f.sieges" :key="s.idBesoinPoste" :value="s.idBesoinPoste" :disabled="!s.disponible">
            {{ s.codePoste }} — {{ s.poste }} ({{ s.unite }}){{ s.disponible ? '' : ' — ' + s.indisponibilite }}
          </option>
        </select>
        <div class="invalid-feedback">{{ champs.idBesoinPoste }}</div>
      </div>

      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label fw-semibold" for="salaire">Salaire mensuel brut (Ar)</label>
          <input id="salaire" v-model.number="req.salaire" type="number" min="0" step="1000" class="form-control" :class="invalide('salaire')" required>
          <div class="invalid-feedback">{{ champs.salaire }}</div>
          <div v-if="siege?.salaireMin != null" class="form-text" :class="{ 'text-danger': horsGrille }">
            Grille {{ siege.categorie }} / {{ siege.echelon }} : {{ montant(siege.salaireMin) }} à {{ montant(siege.salaireMax) }} Ar
          </div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold" for="type">Type de contrat</label>
          <select id="type" v-model="req.idTypeContrat" class="form-select">
            <option v-for="t in f.typesContrat" :key="t.id" :value="t.id">{{ t.libelle }}</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold" for="debut">Date de prise de poste</label>
          <input id="debut" v-model="req.dateDebut" type="date" class="form-control" :class="invalide('dateDebut')" required>
          <div class="invalid-feedback">{{ champs.dateDebut }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold" for="limite">Réponse attendue avant le</label>
          <input id="limite" v-model="req.dateLimiteReponse" type="date" class="form-control" :class="invalide('dateLimiteReponse')" required>
          <div class="invalid-feedback">{{ champs.dateLimiteReponse }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold" for="horaire">Horaires</label>
          <input id="horaire" v-model="req.horaire" class="form-control" :class="invalide('horaire')" required>
          <div class="invalid-feedback">{{ champs.horaire }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold" for="lieu">Lieu de travail</label>
          <input id="lieu" v-model="req.lieu" class="form-control" :class="invalide('lieu')" required>
          <div class="invalid-feedback">{{ champs.lieu }}</div>
        </div>
        <div class="col-12">
          <label class="form-label fw-semibold" for="conditions">Conditions de travail</label>
          <textarea id="conditions" v-model="req.conditionsTravail" rows="2" class="form-control" :class="invalide('conditionsTravail')" required
                    placeholder="Avantages, télétravail, période d'essai…"></textarea>
          <div class="invalid-feedback">{{ champs.conditionsTravail }}</div>
        </div>
        <div class="col-12">
          <label class="form-label" for="commentaire">Message au candidat (facultatif)</label>
          <textarea id="commentaire" v-model="req.commentaire" rows="2" class="form-control"></textarea>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-4">
        <RouterLink to="/propositions" class="btn btn-outline-secondary">Annuler</RouterLink>
        <button class="btn btn-primary" :disabled="envoi || !req.idBesoinPoste">{{ envoi ? 'Envoi…' : 'Envoyer la proposition' }}</button>
      </div>
    </form>
  </div>
</template>
