<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { personnelApi } from '@/api/personnel'
import { reportingApi } from '@/api/reporting'
import { useAuth } from '@/composables/useAuth'
import { dateFr } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Icon from '@/components/ui/Icon.vue'

const router = useRouter()
const { a } = useAuth()
const portee = ref('en-poste')
const q = ref('')
const liste = ref(null)

async function charger() {
  liste.value = null
  liste.value = portee.value === 'tous' ? await personnelApi.tous(q.value) : await personnelApi.enPoste(q.value)
}
let minuteur
watch(portee, charger)
watch(q, () => { clearTimeout(minuteur); minuteur = setTimeout(charger, 300) })
onMounted(charger)
</script>

<template>
  <PageHeader titre="Employés" sous-titre="Le personnel, son poste et son dossier (contrats, onboarding, coordonnées bancaires).">
    <a :href="reportingApi.urlExport('personnel')" class="btn btn-light"><Icon name="download" /> Exporter</a>
    <RouterLink v-if="a('RH')" to="/personnel/nouveau" class="btn btn-primary"><Icon name="plus" /> Saisir un employé</RouterLink>
  </PageHeader>

  <div class="filters">
    <div class="segment">
      <button type="button" :class="{ on: portee === 'en-poste' }" @click="portee = 'en-poste'">En poste</button>
      <button type="button" :class="{ on: portee === 'tous' }" @click="portee = 'tous'">Tout le personnel</button>
    </div>
    <input v-model="q" type="search" class="form-control form-control-sm search" placeholder="Nom, prénom ou matricule…" aria-label="Rechercher">
  </div>

  <section class="panel">
    <Chargement v-if="liste === null" />
    <Vide v-else-if="!liste.length" titre="Aucun employé trouvé" :texte="q ? 'Vérifiez l\'orthographe ou le matricule.' : ''" />
    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead><tr><th>Employé</th><th>Matricule</th><th>Poste</th><th>Unité</th><th>Depuis</th></tr></thead>
        <tbody>
          <tr v-for="e in liste" :key="e.id" class="cliquable" @click="router.push(`/personnel/${e.id}`)">
            <td class="cell-main">{{ e.nom }} {{ e.prenoms }}</td>
            <td>{{ e.matricule }}</td>
            <td>{{ e.poste }}</td>
            <td>{{ e.unite }}</td>
            <td class="nowrap">{{ dateFr(e.dateEntree) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="liste?.length" class="panel-foot" style="justify-content:flex-start"><span class="small muted">{{ liste.length }} employé(s)</span></div>
  </section>
</template>
