<script setup>
// Arrivée : /emplois/:id/candidater (bouton « Candidater » de la liste des offres)
import { ref, reactive, onMounted } from 'vue'
import { candidaturesPubliquesApi as api } from '@/api/candidatures'
import ChampTexte from '@/components/candidatures/ChampTexte.vue'
import LigneParcours from '@/components/candidatures/LigneParcours.vue'
import ChampCv from '@/components/candidatures/ChampCv.vue'
import ConfirmationCandidature from '@/components/candidatures/ConfirmationCandidature.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })

const aujourdhui = new Date().toISOString().slice(0, 10)

const offre = ref(null)
const types = ref([])
const errorChargement = ref(null)

const form = reactive({ nom: '', prenom: '', dateNaissance: '', adresse: '', telephone: '', email: '', details: [] })
const cv = ref(null)
const erreurs = ref({}) // clé = nom du champ côté back (ex. "email", "details[0].dateFin")
const error = ref(null)
const envoi = ref(false)
const confirmation = ref(null)

onMounted(async () => {
  try {
    const [o, t] = await Promise.all([api.offre(props.id), api.typesInformation()])
    offre.value = o
    types.value = t
    ajouterLigne()
  } catch (e) {
    errorChargement.value = e.message
  }
})

function ajouterLigne() {
  form.details.push({ codeTypeInformation: types.value[0]?.code ?? '', libelle: '', dateDebut: '', dateFin: '' })
}

function retirerLigne(i) {
  form.details.splice(i, 1)
  erreurs.value = {} // les numéros de ligne des erreurs ne correspondent plus
}

/** Efface l'erreur d'un champ dès qu'il est corrigé. */
function effacer(...champs) {
  const e = { ...erreurs.value }
  champs.forEach((c) => delete e[c])
  erreurs.value = e
}

function choisirCv(fichier, erreur) {
  cv.value = fichier
  effacer('cv')
  if (erreur) erreurs.value = { ...erreurs.value, cv: erreur }
}

const ligneVide = (d) => !d.libelle.trim() && !d.dateDebut && !d.dateFin

/** Contrôles immédiats ; le back refait tous les contrôles. */
function verifier() {
  const e = {}
  if (!form.nom.trim()) e.nom = 'Le nom est obligatoire'
  if (!form.dateNaissance) e.dateNaissance = 'La date de naissance est obligatoire'
  if (!form.telephone.trim()) e.telephone = 'Le téléphone est obligatoire'
  if (!form.email.trim()) e.email = "L'email est obligatoire"
  if (!cv.value) e.cv = 'Le CV au format PDF est obligatoire'
  else if (erreurs.value.cv) e.cv = erreurs.value.cv
  form.details.forEach((d, i) => {
    if (ligneVide(d)) return // ligne laissée vide : ignorée
    if (!d.libelle.trim()) e[`details[${i}].libelle`] = 'Le libellé est obligatoire'
    if (d.dateDebut && d.dateFin && d.dateFin < d.dateDebut) e[`details[${i}].dateFin`] = 'La date de fin doit suivre la date de début'
  })
  return e
}

async function valider() {
  error.value = null
  erreurs.value = verifier()
  if (Object.keys(erreurs.value).length) {
    error.value = 'Corrigez les champs signalés.'
    window.scrollTo(0, 0)
    return
  }
  // Retirer les lignes vides AVANT l'envoi : les erreurs du back (details[i]) visent alors les lignes affichées
  form.details = form.details.filter((d) => !ligneVide(d))
  envoi.value = true
  try {
    confirmation.value = await api.deposer({
      idOffreEmploi: Number(props.id),
      nom: form.nom.trim(),
      prenom: form.prenom.trim() || null,
      dateNaissance: form.dateNaissance || null,
      adresse: form.adresse.trim() || null,
      telephone: form.telephone.trim(),
      email: form.email.trim(),
      details: form.details.map((d) => ({
        codeTypeInformation: d.codeTypeInformation,
        libelle: d.libelle.trim(),
        dateDebut: d.dateDebut || null,
        dateFin: d.dateFin || null,
      })),
    }, cv.value)
  } catch (e) {
    erreurs.value = e.champs ?? {}
    error.value = e.message
  } finally {
    envoi.value = false
    window.scrollTo(0, 0)
  }
}
</script>

<template>
  <div class="container" style="max-width: 900px">
    <RouterLink :to="{ name: 'emplois' }" class="d-inline-block mb-3">← Retour aux offres</RouterLink>

    <div v-if="errorChargement" class="alert alert-danger">{{ errorChargement }}</div>
    <div v-else-if="!offre" class="text-muted">Chargement…</div>

    <ConfirmationCandidature v-else-if="confirmation" :confirmation="confirmation" :offre="offre" :email="form.email" />

    <template v-else>
      <div class="small text-muted">{{ offre.reference }}</div>
      <h4 class="mb-1">Candidater : {{ offre.postes || 'Poste à pourvoir' }}</h4>
      <p class="text-muted">
        {{ offre.unite }}<span v-if="offre.direction && offre.direction !== offre.unite"> · {{ offre.direction }}</span>
      </p>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <form novalidate @submit.prevent="valider">
        <div class="card shadow-sm mb-3">
          <div class="card-header">Vos coordonnées</div>
          <div class="card-body row g-3">
            <ChampTexte id="nom" v-model="form.nom" label="Nom *" maxlength="100" autocomplete="family-name"
                        class="col-md-6" :erreur="erreurs.nom" @corrige="effacer('nom')" />
            <ChampTexte id="prenom" v-model="form.prenom" label="Prénom(s)" maxlength="150" autocomplete="given-name"
                        class="col-md-6" :erreur="erreurs.prenom" @corrige="effacer('prenom')" />
            <ChampTexte id="dateNaissance" v-model="form.dateNaissance" label="Date de naissance *" type="date"
                        :max="aujourdhui" autocomplete="bday"
                        class="col-md-6" :erreur="erreurs.dateNaissance" @corrige="effacer('dateNaissance')" />
            <ChampTexte id="email" v-model="form.email" label="Email *" type="email" maxlength="150" autocomplete="email"
                        class="col-md-6" :erreur="erreurs.email" @corrige="effacer('email')" />
            <ChampTexte id="telephone" v-model="form.telephone" label="Téléphone *" type="tel" maxlength="30"
                        autocomplete="tel" class="col-md-6" :erreur="erreurs.telephone" @corrige="effacer('telephone')" />
            <ChampTexte id="adresse" v-model="form.adresse" label="Adresse" maxlength="255" autocomplete="street-address"
                        class="col-md-6" :erreur="erreurs.adresse" @corrige="effacer('adresse')" />
          </div>
        </div>

        <div class="card shadow-sm mb-3">
          <div class="card-header">Votre parcours</div>
          <div class="card-body">
            <p class="text-muted small">Expériences professionnelles, formations et qualités. Ajoutez autant de lignes que nécessaire.</p>
            <LigneParcours v-for="(l, i) in form.details" :key="i" v-model="form.details[i]" :index="i" :types="types"
                           :erreurs="erreurs" :aujourdhui="aujourdhui" @corrige="effacer" @retirer="retirerLigne(i)" />
            <button type="button" class="btn btn-outline-primary btn-sm" @click="ajouterLigne">+ Ajouter une ligne</button>
          </div>
        </div>

        <ChampCv :erreur="erreurs.cv" @choisi="choisirCv" />

        <div class="d-flex align-items-center gap-3 mb-4">
          <button type="submit" class="btn btn-primary" :disabled="envoi">
            {{ envoi ? 'Envoi en cours…' : 'Envoyer ma candidature' }}
          </button>
          <span class="text-muted small">* champs obligatoires</span>
        </div>
      </form>
    </template>
  </div>
</template>
