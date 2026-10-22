<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { besoinApi as api } from '@/api/besoinApi'
import SelectField from '@/components/besoins/SelectField.vue'
import AlertMessage from '@/components/besoins/AlertMessage.vue'


const types = [
  { id: 'CREATION', libelle: 'Création de poste' },
  { id: 'REMPLACEMENT', libelle: 'Remplacement' },
]

const unites = ref([])
const postes = ref([])
const motifs = ref([])

const form = reactive({
  typeBesoin: null,
  idUniteOrga: null,
  idMotif: null,
  dateSouhaitee: '',
  precisionMotif: '',
})

// Tableau : une ligne = un poste + une quantité
const lignes = ref([{ idPoste: null, quantite: 1 }])

const effectifTotal = computed(() =>
  lignes.value.reduce((s, l) => s + (Number(l.quantite) || 0), 0))

const nouveauMotif = ref('')
const erreur = ref('')
const succes = ref('')
const envoi = ref(false)
const aujourdhui = new Date().toISOString().slice(0, 10)

onMounted(async () => {
  try {
    ;[unites.value, motifs.value] = await Promise.all([api.unites(), api.motifs()])
  } catch (e) {
    erreur.value = 'Impossible de charger les listes. Es-tu connecté ?'
  }
})

watch(() => form.idUniteOrga, async (idUnite) => {
  lignes.value = [{ idPoste: null, quantite: 1 }]
  postes.value = []
  if (!idUnite) return
  try {
    postes.value = await api.postesActifs(idUnite)
  } catch (e) {
    erreur.value = 'Impossible de charger les postes de cette unité.'
  }
})

function ajouterLigne() { lignes.value.push({ idPoste: null, quantite: 1 }) }
function supprimerLigne(i) {
  lignes.value.splice(i, 1)
  if (lignes.value.length === 0) ajouterLigne()
}

// Un poste déjà choisi dans une autre ligne n'est plus proposé
function optionsPoste(i) {
  const pris = lignes.value.filter((l, k) => k !== i && l.idPoste).map(l => l.idPoste)
  return postes.value.filter(p => !pris.includes(p.id))
}

async function ajouterMotif() {
  erreur.value = ''
  const libelle = nouveauMotif.value.trim()
  if (!libelle) { erreur.value = 'Saisis le libellé du motif.'; return }
  try {
    const motif = await api.creerMotif(libelle)
    motifs.value = await api.motifs()
    form.idMotif = motif.id
    nouveauMotif.value = ''
  } catch (e) {
    erreur.value = e.response?.data?.erreur || "Erreur lors de l'ajout du motif."
  }
}

function valider() {
  if (!form.typeBesoin) return 'Choisis le type de besoin.'
  if (!form.idUniteOrga) return "Choisis l'unité demandeuse."
  if (lignes.value.some(l => !l.idPoste)) return 'Choisis un poste dans chaque ligne.'
  if (lignes.value.some(l => !l.quantite || l.quantite <= 0)) return 'Chaque quantité doit être supérieure à 0.'
  if (!form.idMotif) return 'Choisis un motif.'
  if (!form.dateSouhaitee) return 'La date souhaitée est obligatoire.'
  if (form.dateSouhaitee < aujourdhui) return 'La date souhaitée ne peut pas être dans le passé.'
  if (form.precisionMotif.length > 100) return 'La précision du motif ne doit pas dépasser 100 caractères.'
  return ''
}

function reinitialiser() {
  Object.assign(form, {
    typeBesoin: null, idUniteOrga: null, idMotif: null, dateSouhaitee: '', precisionMotif: '',
  })
  lignes.value = [{ idPoste: null, quantite: 1 }]
  postes.value = []
}

async function envoyer() {
  erreur.value = ''
  succes.value = ''
  const probleme = valider()
  if (probleme) { erreur.value = probleme; return }

  envoi.value = true
  try {
    const b = await api.creerBesoin({
      typeBesoin: form.typeBesoin,
      idUniteOrga: form.idUniteOrga,
      idMotif: form.idMotif,
      dateSouhaitee: form.dateSouhaitee,
      precisionMotif: form.precisionMotif.trim() || null,
      lignes: lignes.value.map(l => ({ idPoste: l.idPoste, quantite: Number(l.quantite) })),
    })
    succes.value = `Besoin ${b.reference} enregistré (${b.effectif} personne(s)) : ${b.poste}.`
    reinitialiser()
  } catch (e) {
  console.error(e)
  erreur.value = e.response?.data?.message || e.message
} finally {
    envoi.value = false
  }
}
</script>

<template>
  <h2>Exprimer un besoin en personnel</h2>

  <AlertMessage type="erreur" :message="erreur" />
  <AlertMessage type="succes" :message="succes" />

  <form @submit.prevent="envoyer">
    <!-- EN HAUT : le besoin -->
    <SelectField label="Type de besoin" :options="types" v-model="form.typeBesoin" />
    <SelectField label="Unité demandeuse" :options="unites" v-model="form.idUniteOrga" />

    <SelectField label="Motif" :options="motifs" v-model="form.idMotif" />
    <div class="ajout-motif">
      <input v-model="nouveauMotif" type="text" maxlength="150" placeholder="Ajouter un nouveau motif" />
      <button type="button" @click="ajouterMotif">Ajouter</button>
    </div>

    <div class="champ">
      <label>Date souhaitée</label>
      <input v-model="form.dateSouhaitee" type="date" :min="aujourdhui" />
    </div>

    <div class="champ">
      <label>Précision du motif ({{ form.precisionMotif.length }}/100)</label>
      <textarea v-model="form.precisionMotif" maxlength="100" rows="2"></textarea>
    </div>

    <!-- EN BAS : le tableau des postes -->
    <h3>Postes demandés</h3>
    <p v-if="!form.idUniteOrga" class="info">Choisis d'abord l'unité pour charger ses postes.</p>
    <p v-else-if="postes.length === 0" class="info">
      Aucun poste ACTIF dans cette unité. Demande d'abord la création d'un poste.
    </p>

    <table>
      <thead>
        <tr><th>Poste</th><th>Quantité</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="(l, i) in lignes" :key="i">
          <td>
            <select v-model="l.idPoste" :disabled="!form.idUniteOrga">
              <option :value="null">-- Choisir --</option>
              <option v-for="p in optionsPoste(i)" :key="p.id" :value="p.id">{{ p.libelle }}</option>
              <!-- garde visible le poste déjà choisi dans cette ligne -->
              <option v-if="l.idPoste && !optionsPoste(i).some(p => p.id === l.idPoste)"
                      :value="l.idPoste">
                {{ postes.find(p => p.id === l.idPoste)?.libelle }}
              </option>
            </select>
          </td>
          <td><input v-model.number="l.quantite" type="number" min="1" /></td>
          <td><button type="button" @click="supprimerLigne(i)">Retirer</button></td>
        </tr>
      </tbody>
      <tfoot>
        <tr><td><strong>Effectif total</strong></td><td><strong>{{ effectifTotal }}</strong></td><td></td></tr>
      </tfoot>
    </table>
    <button type="button" @click="ajouterLigne" :disabled="!form.idUniteOrga">+ Ajouter un poste</button>

    <div class="actions">
      <button type="submit" :disabled="envoi">{{ envoi ? 'Envoi...' : 'Envoyer le besoin' }}</button>
    </div>
  </form>
</template>

<style scoped>
.champ { display: flex; flex-direction: column; margin-bottom: 12px; }
input[type='text'], input[type='date'], input[type='number'], textarea, select { padding: 6px; }
.ajout-motif { display: flex; gap: 8px; margin: -4px 0 14px; }
.ajout-motif input { flex: 1; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; }
th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
td select { width: 100%; }
td input { width: 80px; }
.info { color: #92400e; background: #fef3c7; padding: 8px 12px; border-radius: 6px; }
.actions { margin-top: 18px; }
button { padding: 8px 18px; cursor: pointer; }
</style>