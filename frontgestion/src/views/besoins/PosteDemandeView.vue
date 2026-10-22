<script setup>
import { ref, reactive, onMounted } from 'vue'
import { besoinApi as api } from '@/api/besoinApi'
import SelectField from '@/components/besoins/SelectField.vue'
import AlertMessage from '@/components/besoins/AlertMessage.vue'

// Listes des menus déroulants (OptionDto : { id, libelle })
const metiers = ref([])
const categories = ref([])
const echelons = ref([])
const unites = ref([])
const superieurs = ref([])

// "existant" = choisir un métier de la liste, "nouveau" = en créer un
const modeMetier = ref('existant')

const form = reactive({
  idMetier: null,
  nouveauMetierLibelle: '',
  idCategorie: null,
  idEchelon: null,
  idUniteOrga: null,
  idSuperieurDirect: null,
  libelle: '',
})

const erreur = ref('')
const succes = ref('')
const envoi = ref(false)

onMounted(async () => {
  try {
    ;[metiers.value, categories.value, echelons.value, unites.value, superieurs.value] =
      await Promise.all([
        api.metiers(), api.categories(), api.echelons(), api.unites(), api.superieurs(),
      ])
  } catch (e) {
    erreur.value = "Impossible de charger les listes. Es-tu connecté ?"
  }
})

function valider() {
  if (!form.libelle.trim()) return 'Le libellé du poste est obligatoire.'
  if (modeMetier.value === 'existant' && !form.idMetier) return 'Choisis un métier.'
  if (modeMetier.value === 'nouveau') {
    if (!form.nouveauMetierLibelle.trim()) return 'Saisis le libellé du nouveau métier.'
    if (!form.idCategorie) return 'La catégorie est obligatoire pour un nouveau métier.'
  }
  if (!form.idEchelon) return "L'échelon est obligatoire."
  if (!form.idUniteOrga) return "L'unité organisationnelle est obligatoire."
  return ''
}

function reinitialiser() {
  Object.assign(form, {
    idMetier: null, nouveauMetierLibelle: '', idCategorie: null, idEchelon: null,
    idUniteOrga: null, idSuperieurDirect: null, libelle: '',
  })
  modeMetier.value = 'existant'
}

async function envoyer() {
  erreur.value = ''
  succes.value = ''
  const probleme = valider()
  if (probleme) { erreur.value = probleme; return }

  // On n'envoie que les champs utiles au mode choisi
  const payload = {
    idEchelon: form.idEchelon,
    idUniteOrga: form.idUniteOrga,
    idSuperieurDirect: form.idSuperieurDirect,
    libelle: form.libelle.trim(),
    ...(modeMetier.value === 'existant'
      ? { idMetier: form.idMetier }
      : { nouveauMetierLibelle: form.nouveauMetierLibelle.trim(), idCategorie: form.idCategorie }),
  }

  envoi.value = true
  try {
    const poste = await api.demanderPoste(payload)   // PosteDto
    succes.value = `Poste ${poste.code} créé avec l'état ${poste.etat}. En attente de validation par le DG.`
    reinitialiser()
    metiers.value = await api.metiers()              // le nouveau métier apparaît dans la liste
  } catch (e) {
    erreur.value = e.response?.data?.erreur || "Erreur lors de l'envoi de la demande."
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <h2>Demander la création d'un poste</h2>

  <AlertMessage type="erreur" :message="erreur" />
  <AlertMessage type="succes" :message="succes" />

  <form @submit.prevent="envoyer">
    <div class="champ">
      <label>Libellé du poste</label>
      <input v-model="form.libelle" type="text" maxlength="150" />
    </div>

    <fieldset>
      <legend>Métier</legend>
      <label><input type="radio" value="existant" v-model="modeMetier" /> Métier existant</label>
      <label><input type="radio" value="nouveau" v-model="modeMetier" /> Nouveau métier</label>

      <SelectField v-if="modeMetier === 'existant'"
                   label="Métier" :options="metiers" v-model="form.idMetier" />

      <template v-else>
        <div class="champ">
          <label>Libellé du nouveau métier</label>
          <input v-model="form.nouveauMetierLibelle" type="text" maxlength="150" />
        </div>
        <SelectField label="Catégorie (obligatoire)" :options="categories" v-model="form.idCategorie" />
      </template>
    </fieldset>

    <SelectField label="Échelon" :options="echelons" v-model="form.idEchelon" />
    <SelectField label="Unité organisationnelle" :options="unites" v-model="form.idUniteOrga" />
    <SelectField label="Supérieur direct (facultatif)" :options="superieurs" v-model="form.idSuperieurDirect" />

    <button type="submit" :disabled="envoi">
      {{ envoi ? 'Envoi...' : 'Envoyer la demande' }}
    </button>
  </form>
</template>

<style scoped>
.champ { display: flex; flex-direction: column; margin-bottom: 12px; }
input[type='text'] { padding: 6px; }
fieldset { margin-bottom: 14px; padding: 10px 14px; }
fieldset label { margin-right: 16px; }
button { padding: 8px 18px; cursor: pointer; }
</style>