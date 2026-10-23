<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { personnelApi } from '@/api/personnel'
import { organisationApi } from '@/api/organisation'
import { contratsApi } from '@/api/contrats'
import { propositionsApi } from '@/api/propositions'
import { useToast } from '@/composables/useToast'
import { aujourdhui, ariary } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmployeFormulaire from './EmployeFormulaire.vue'

const router = useRouter()
const toast = useToast()
const postes = ref([])
const form = reactive({ nom: '', prenoms: '', dateNaissance: '', cin: '', telephone: '', email: '', adresse: '', idPoste: null, dateEntree: aujourdhui(),
  idTypeContrat: null, dateFinPrevue: '', salaire: '' })
const erreur = ref('')

const types = ref([])
const fourchette = ref(null)   // salaire min et max de la grille pour le poste choisi
onMounted(async () => {
  ;[postes.value, types.value] = await Promise.all([organisationApi.postes({ etat: 'ACTIF', occupation: 'LIBRE' }), contratsApi.types()])
  form.idTypeContrat = types.value.find((t) => t.libelle === 'CDI')?.id ?? null
})
watch(() => [form.idPoste, form.dateEntree], async ([idPoste, date]) => {
  fourchette.value = null
  if (idPoste) fourchette.value = await propositionsApi.fourchette(idPoste, date || null).catch(() => null)
})
// CE et CDD ont une date de fin (par défaut : durée maximale du type)
const aDureeLimitee = computed(() => ['CE', 'CDD'].includes(types.value.find((t) => t.id === form.idTypeContrat)?.libelle))

async function enregistrer() {
  erreur.value = ''
  try {
    const d = await personnelApi.creer({ ...form, dateNaissance: form.dateNaissance || null,
      dateFinPrevue: aDureeLimitee.value ? form.dateFinPrevue || null : null, salaire: form.salaire === '' ? null : Number(form.salaire) })
    toast.ok(`Employé ${d.fiche.matricule} enregistré`)
    router.push(`/personnel/${d.fiche.id}`)
  } catch (e) { erreur.value = e.message }
}
</script>

<template>
  <PageHeader titre="Saisir un employé" sous-titre="Pour reprendre un employé déjà présent dans l'entreprise. Les nouvelles recrues sont créées automatiquement quand elles acceptent leur proposition." retour="/personnel" retour-libelle="Employés" />
  <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
  <form class="panel" @submit.prevent="enregistrer">
    <div class="panel-body">
      <div class="form-section">
        <h3>Identité</h3>
        <p>Le matricule est attribué automatiquement.</p>
        <EmployeFormulaire v-model="form" />
      </div>
      <div class="form-section">
        <h3>Affectation</h3>
        <p>Seuls les postes actifs et vacants sont proposés.</p>
        <div class="form-grid">
          <div>
            <label class="form-label" for="poste">Poste</label>
            <select id="poste" v-model="form.idPoste" class="form-select">
              <option :value="null" disabled>Choisir…</option>
              <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.libelle }} — {{ p.unite }}</option>
            </select>
          </div>
          <div>
            <label class="form-label" for="entree">Date d'entrée sur le poste</label>
            <input id="entree" v-model="form.dateEntree" type="date" class="form-control">
          </div>
        </div>
      </div>
      <div class="form-section">
        <h3>Contrat en cours</h3>
        <p>Le contrat est enregistré comme déjà signé ; son salaire entre dans la masse salariale de l'unité.</p>
        <div class="form-grid">
          <div>
            <label class="form-label" for="type">Type de contrat</label>
            <select id="type" v-model="form.idTypeContrat" class="form-select">
              <option v-for="t in types" :key="t.id" :value="t.id">{{ t.libelle }}</option>
            </select>
          </div>
          <div v-if="aDureeLimitee">
            <label class="form-label" for="fin">Fin prévue <span class="muted">(facultatif : durée maximale du type)</span></label>
            <input id="fin" v-model="form.dateFinPrevue" type="date" class="form-control">
          </div>
          <div>
            <label class="form-label" for="salaire">Salaire mensuel brut (Ar)</label>
            <input id="salaire" v-model="form.salaire" type="number" min="0" step="50000" class="form-control">
            <div v-if="fourchette" class="form-text">Grille : {{ ariary(fourchette.min) }} à {{ ariary(fourchette.max) }} ({{ fourchette.categorie }}, {{ fourchette.echelon }})</div>
          </div>
        </div>
      </div>
    </div>
    <div class="panel-foot">
      <RouterLink to="/personnel" class="btn btn-light">Annuler</RouterLink>
      <button class="btn btn-primary">Enregistrer l'employé</button>
    </div>
  </form>
</template>
