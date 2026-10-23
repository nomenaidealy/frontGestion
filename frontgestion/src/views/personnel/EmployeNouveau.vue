<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { personnelApi } from '@/api/personnel'
import { organisationApi } from '@/api/organisation'
import { useToast } from '@/composables/useToast'
import { aujourdhui } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import EmployeFormulaire from './EmployeFormulaire.vue'

const router = useRouter()
const toast = useToast()
const postes = ref([])
const form = reactive({ nom: '', prenoms: '', dateNaissance: '', cin: '', telephone: '', email: '', adresse: '', idPoste: null, dateEntree: aujourdhui() })
const erreur = ref('')

onMounted(async () => { postes.value = await organisationApi.postes({ etat: 'ACTIF', occupation: 'LIBRE' }) })

async function enregistrer() {
  erreur.value = ''
  try {
    const d = await personnelApi.creer({ ...form, dateNaissance: form.dateNaissance || null })
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
    </div>
    <div class="panel-foot">
      <RouterLink to="/personnel" class="btn btn-light">Annuler</RouterLink>
      <button class="btn btn-primary">Enregistrer l'employé</button>
    </div>
  </form>
</template>
