<script setup>
// P4 – Formulaire de création d'une offre d'emploi
// Arrivée : /offres/nouvelle?idBesoin=ID (bouton « Ouvrir Recrutement » de P3, ou page des besoins)
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { offresApi } from '@/api/offres'
import { formatDate, formatMontant } from './format'

const route = useRoute()
const router = useRouter()

const besoin = ref(null)
const typesContrat = ref([])
const form = ref(null)
const error = ref(null)
const envoi = ref(false)

onMounted(async () => {
  try {
    const data = await offresApi.nouvelle(route.query.idBesoin)
    besoin.value = data.besoin
    typesContrat.value = data.typesContrat
    // Valeurs par défaut calculées par le back (date de publication = aujourd'hui, référence proposée)
    form.value = { ...data.form, idTypeContrat: data.form.idTypeContrat ?? '' }
  } catch (e) {
    router.replace({ path: '/offres/besoins', query: { error: e.message } })
  }
})

async function valider() {
  envoi.value = true
  error.value = null
  try {
    const o = await offresApi.creer(form.value)
    router.push({ path: '/offres', query: { message: `Offre ${o.ref} enregistrée (${o.etat})` } })
  } catch (e) {
    error.value = e.message
    window.scrollTo(0, 0)
  } finally {
    envoi.value = false
  }
}

async function apercu() {
  // Ouvre l'onglet tout de suite (sinon bloqué par le navigateur), puis y écrit le HTML
  const w = window.open('', '_blank')
  try {
    const html = await offresApi.apercu(form.value)
    w.document.open()
    w.document.write(html)
    w.document.close()
  } catch (e) {
    w?.close()
    error.value = e.message
  }
}
</script>

<template>
  <div class="container" style="max-width: 900px">
    <h4 class="mb-3">Nouvelle offre d'emploi</h4>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="!form" class="text-muted">Chargement…</div>

    <template v-if="form && besoin">
      <!-- Récapitulatif du besoin (lecture seule) -->
      <div class="card shadow-sm mb-3">
        <div class="card-header">Besoin à pourvoir</div>
        <div class="card-body">
          <div class="row g-2 small">
            <div class="col-md-6"><strong>Poste :</strong> {{ besoin.poste ?? '—' }}</div>
            <div class="col-md-6"><strong>Unité :</strong> {{ besoin.unite }}
              <span class="text-muted">({{ besoin.uniteType }})</span></div>
            <div class="col-md-6"><strong>Effectif :</strong> {{ besoin.effectif }}</div>
            <div class="col-md-6"><strong>Date souhaitée :</strong> {{ formatDate(besoin.dateSouhaitee) }}</div>
            <div class="col-md-6"><strong>Motif :</strong> {{ besoin.motif }}</div>
            <div class="col-md-6"><strong>Fourchette (grille) :</strong>
              <template v-if="besoin.salaireMin != null">
                {{ formatMontant(besoin.salaireMin) }} – {{ formatMontant(besoin.salaireMax) }} Ar
              </template>
              <template v-else>—</template>
            </div>
          </div>
        </div>
      </div>

      <form class="card shadow-sm" @submit.prevent="valider">
        <div class="card-body">
          <!-- Besoin : chargé depuis « Ouvrir Recrutement », champ désactivé -->
          <div class="mb-3">
            <label class="form-label">Besoin</label>
            <input type="text" class="form-control" disabled
                   :value="`${besoin.reference} – ${besoin.poste ?? ''}`">
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Référence *</label>
              <input v-model.trim="form.reference" type="text" class="form-control" maxlength="50" required>
            </div>
            <div class="col-md-6">
              <label class="form-label">Type de contrat <span class="text-muted">(facultatif)</span></label>
              <select v-model="form.idTypeContrat" class="form-select">
                <option value="">— non précisé —</option>
                <option v-for="t in typesContrat" :key="t.id" :value="t.id">{{ t.libelle }}</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Date de publication</label>
              <input v-model="form.datePublication" type="date" class="form-control">
            </div>
            <div class="col-md-6">
              <label class="form-label">Date limite de candidature *</label>
              <input v-model="form.dateLimiteCandidature" type="date" class="form-control"
                     :min="form.datePublication" required>
            </div>
            <div class="col-12">
              <label class="form-label">Description du poste <span class="text-muted">(dans le PDF)</span></label>
              <textarea v-model="form.description" class="form-control" rows="4"></textarea>
            </div>
            <div class="col-12">
              <label class="form-label">Profil recherché <span class="text-muted">(dans le PDF)</span></label>
              <textarea v-model="form.profil" class="form-control" rows="4"></textarea>
            </div>
            <div class="col-12">
              <label class="form-label">État à l'enregistrement</label>
              <div>
                <div class="form-check form-check-inline">
                  <input id="etatPub" v-model="form.etat" class="form-check-input" type="radio" value="PUBLIEE">
                  <label class="form-check-label" for="etatPub">Publier tout de suite</label>
                </div>
                <div class="form-check form-check-inline">
                  <input id="etatBr" v-model="form.etat" class="form-check-input" type="radio" value="BROUILLON">
                  <label class="form-check-label" for="etatBr">Brouillon (relecture)</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer d-flex gap-2 justify-content-end">
          <RouterLink to="/offres/besoins" class="btn btn-outline-secondary">Annuler</RouterLink>
          <button type="button" class="btn btn-outline-primary" @click="apercu">Aperçu</button>
          <button type="submit" class="btn btn-primary" :disabled="envoi">
            {{ envoi ? 'Génération…' : 'Valider et générer le PDF' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
