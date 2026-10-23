<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { onboardingApi } from '@/api/onboarding'
import { dateFr } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'

const router = useRouter()
const statut = ref('EN_COURS')
const liste = ref(null)
async function charger() { liste.value = null; liste.value = await onboardingApi.lister(statut.value) }
watch(statut, charger)
onMounted(charger)
</script>

<template>
  <PageHeader titre="Onboarding" sous-titre="L'intégration des nouveaux employés, démarrée à la signature de leur contrat.">
    <RouterLink to="/admin/onboarding" class="btn btn-light">Modèles de tâches</RouterLink>
  </PageHeader>
  <div class="filters">
    <div class="segment">
      <button type="button" :class="{ on: statut === 'EN_COURS' }" @click="statut = 'EN_COURS'">En cours</button>
      <button type="button" :class="{ on: statut === 'TERMINE' }" @click="statut = 'TERMINE'">Terminés</button>
      <button type="button" :class="{ on: statut === '' }" @click="statut = ''">Tous</button>
    </div>
  </div>
  <section class="panel">
    <Chargement v-if="liste === null" />
    <Vide v-else-if="!liste.length" titre="Aucun onboarding" texte="Un onboarding démarre automatiquement quand un contrat est signé." />
    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead><tr><th>Employé</th><th>Poste</th><th>Début</th><th style="width:220px">Avancement</th><th>Statut</th></tr></thead>
        <tbody>
          <tr v-for="o in liste" :key="o.id" class="cliquable" @click="router.push(`/onboarding/${o.id}`)">
            <td class="cell-main">{{ o.employe }}<span class="cell-sub">{{ o.matricule }}</span></td>
            <td>{{ o.poste }}<span class="cell-sub">{{ o.unite }}</span></td>
            <td>{{ dateFr(o.dateDebut) }}</td>
            <td>
              <div class="progress-line"><span :style="{ width: `${o.total ? (o.faites * 100) / o.total : 0}%` }"></span></div>
              <span class="cell-sub">{{ o.faites }}/{{ o.total }}<span v-if="o.enRetard" class="text-danger"> · {{ o.enRetard }} en retard</span></span>
            </td>
            <td><Statut type="onboarding" :valeur="o.statut" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
