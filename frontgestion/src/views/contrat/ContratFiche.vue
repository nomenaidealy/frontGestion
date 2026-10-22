<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { besoinApi as api } from '@/api/besoinApi'

const props = defineProps({ id: [String, Number] })

const contrat = ref(null)
const erreur = ref('')
const succes = ref('')
const enCours = ref(false)

const fichier = ref(null)
const renouv = reactive({ idTypeNouveau: '', dateFinPrevue: '' })
const types = ref([])   // CE, CDD, CDI : voir note en bas

async function charger() {
  try {
    contrat.value = await api.contrat(props.id)
  } catch (e) {
    erreur.value = e.message
  }
}
onMounted(charger)

// Exécute une action, affiche le résultat, met à jour la fiche
async function agir(action, messageSucces) {
  erreur.value = ''
  succes.value = ''
  enCours.value = true
  try {
    const res = await action()
    if (res && res.id === contrat.value?.id) contrat.value = res
    succes.value = messageSucces
    return res
  } catch (e) {
    erreur.value = e.message
  } finally {
    enCours.value = false
  }
}

const valider = () => agir(() => api.validerContrat(props.id), 'Contrat validé.')
const annuler = () => {
  if (confirm('Annuler ce contrat ?')) agir(() => api.annulerContrat(props.id), 'Contrat annulé.')
}
const signer = async () => {
  await agir(() => api.signerContrat(props.id), 'Contrat signé. Onboarding démarré.')
  await charger()
}

function choisirFichier(e) { fichier.value = e.target.files[0] || null }

async function deposer() {
  if (!fichier.value) { erreur.value = 'Choisis un fichier PDF.'; return }
  await agir(() => api.deposerContrat(props.id, fichier.value), 'Contrat signé déposé.')
  fichier.value = null
}

async function renouveler() {
  const payload = {
    idTypeNouveau: renouv.idTypeNouveau ? Number(renouv.idTypeNouveau) : null,
    dateFinPrevue: renouv.dateFinPrevue || null,
  }
  const nouveau = await agir(() => api.renouveler(props.id, payload), 'Nouveau contrat créé.')
  if (nouveau) window.location.href = `/contrats/${nouveau.id}`
}

const statut = computed(() => contrat.value?.statut)
const libelleStatut = { CREE: 'Créé', VALIDE: 'Validé', SIGNE: 'Signé', TERMINE: 'Terminé', ANNULE: 'Annulé' }
const classeStatut = {
  CREE: 'bg-secondary', VALIDE: 'bg-info', SIGNE: 'bg-success',
  TERMINE: 'bg-dark', ANNULE: 'bg-danger',
}
const formatDate = (d) => (d ? String(d).replace('T', ' ').slice(0, 16) : '-')
</script>

<template>
  <div class="container">
    <h2>Fiche contrat</h2>

    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div v-if="succes" class="alert alert-success">{{ succes }}</div>

    <div v-if="contrat">
      <div class="card mb-3">
        <div class="card-body">
          <h5>
            {{ contrat.reference }}
            <span class="badge ms-2" :class="classeStatut[statut]">{{ libelleStatut[statut] || statut }}</span>
          </h5>
          <dl class="row mb-0">
            <dt class="col-sm-3">Employé</dt>
            <dd class="col-sm-9">{{ contrat.employe }} ({{ contrat.matricule }})</dd>
            <dt class="col-sm-3">Poste</dt>
            <dd class="col-sm-9">{{ contrat.poste }}</dd>
            <dt class="col-sm-3">Type</dt>
            <dd class="col-sm-9">{{ contrat.type }}</dd>
            <dt class="col-sm-3">Début</dt>
            <dd class="col-sm-9">{{ contrat.dateDebut }}</dd>
            <dt class="col-sm-3">Fin prévue</dt>
            <dd class="col-sm-9">{{ contrat.dateFinPrevue || 'Sans limite' }}</dd>
            <dt class="col-sm-3">Fin effective</dt>
            <dd class="col-sm-9">{{ contrat.dateFinEffective || '-' }}</dd>
            <dt class="col-sm-3">Motif de fin</dt>
            <dd class="col-sm-9">{{ contrat.motifFin || '-' }}</dd>
            <dt class="col-sm-3">Contrat précédent</dt>
            <dd class="col-sm-9">{{ contrat.referencePrecedent || '-' }}</dd>
            <dt class="col-sm-3">PDF signé</dt>
            <dd class="col-sm-9">{{ contrat.documentDepose ? 'Déposé' : 'Non déposé' }}</dd>
          </dl>
        </div>
      </div>

      <!-- Actions selon l'état -->
      <div class="card mb-3" v-if="['CREE', 'VALIDE', 'SIGNE'].includes(statut)">
        <div class="card-body">
          <h6>Actions</h6>

          <div v-if="statut === 'CREE'" class="d-flex gap-2">
            <button class="btn btn-primary" :disabled="enCours" @click="valider">Valider</button>
            <button class="btn btn-outline-danger" :disabled="enCours" @click="annuler">Annuler</button>
          </div>

          <div v-if="statut === 'VALIDE'">
            <div class="mb-2">
              <label class="form-label">Contrat signé (PDF)</label>
              <div class="d-flex gap-2">
                <input type="file" accept="application/pdf" class="form-control" @change="choisirFichier" />
                <button class="btn btn-secondary" :disabled="enCours" @click="deposer">Déposer</button>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-success" :disabled="enCours || !contrat.documentDepose" @click="signer">
                Signer
              </button>
              <button class="btn btn-outline-danger" :disabled="enCours" @click="annuler">Annuler</button>
            </div>
            <small v-if="!contrat.documentDepose" class="text-muted">
              Dépose le PDF avant de signer.
            </small>
          </div>

          <div v-if="statut === 'SIGNE'">
            <h6>Renouveler ou changer de type</h6>
            <div class="row g-2 align-items-end">
              <div class="col-md-4">
                <label class="form-label">Nouveau type</label>
                <select v-model="renouv.idTypeNouveau" class="form-select">
                  <option value="">Même type (renouvellement)</option>
                  <option v-for="t in types" :key="t.id" :value="t.id">{{ t.libelle }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Date de fin prévue</label>
                <input v-model="renouv.dateFinPrevue" type="date" class="form-control" />
                <small class="text-muted">Vide pour un CDI.</small>
              </div>
              <div class="col-md-4">
                <button class="btn btn-primary" :disabled="enCours" @click="renouveler">Créer le contrat</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Historique -->
      <div class="card">
        <div class="card-body">
          <h6>Historique des états</h6>
          <table class="table table-sm mb-0">
            <thead><tr><th>État</th><th>Date</th></tr></thead>
            <tbody>
              <tr v-for="(h, i) in contrat.historique" :key="i">
                <td>{{ libelleStatut[h.statut] || h.statut }}</td>
                <td>{{ formatDate(h.date) }}</td>
              </tr>
              <tr v-if="!contrat.historique?.length"><td colspan="2" class="text-muted">Aucun historique.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>