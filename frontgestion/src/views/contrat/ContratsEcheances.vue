<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { contratsApi } from '@/api/contrats'
import { reportingApi } from '@/api/reporting'
import { dateFr } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Icon from '@/components/ui/Icon.vue'

const router = useRouter()
const jours = ref(30)
const contrats = ref(null)
const restants = (d) => Math.ceil((new Date(d + 'T00:00:00') - new Date(new Date().toDateString())) / 86400000)

async function charger() { contrats.value = null; contrats.value = await contratsApi.echeances(jours.value) }
watch(jours, charger)
onMounted(charger)
</script>

<template>
  <PageHeader titre="Contrats à échéance" sous-titre="Contrats validés ou signés dont la fin approche : renouvelez-les, changez leur type ou préparez le départ.">
    <a :href="reportingApi.urlExport('contrats')" class="btn btn-light"><Icon name="download" /> Exporter tous les contrats</a>
  </PageHeader>
  <div class="filters">
    <div class="segment">
      <button v-for="j in [30, 60, 90]" :key="j" type="button" :class="{ on: jours === j }" @click="jours = j">{{ j }} jours</button>
    </div>
  </div>
  <section class="panel">
    <Chargement v-if="contrats === null" />
    <Vide v-else-if="!contrats.length" :titre="`Aucun contrat ne se termine dans les ${jours} jours`" />
    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead><tr><th>Employé</th><th>Contrat</th><th>Poste</th><th>Fin prévue</th><th class="num">Jours restants</th><th>Statut</th></tr></thead>
        <tbody>
          <tr v-for="c in contrats" :key="c.id" class="cliquable" @click="router.push(`/contrats/${c.id}`)">
            <td class="cell-main">{{ c.employe }}<span class="cell-sub">{{ c.matricule }}</span></td>
            <td>{{ c.reference }}<span class="cell-sub">{{ c.type }}</span></td>
            <td>{{ c.poste }}</td>
            <td>{{ dateFr(c.dateFinPrevue) }}</td>
            <td class="num"><span class="status" :class="restants(c.dateFinPrevue) <= 7 ? 'ko' : restants(c.dateFinPrevue) <= 15 ? 'wait' : 'info'">{{ restants(c.dateFinPrevue) }} j</span></td>
            <td><Statut type="contrat" :valeur="c.statut" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
