<script setup>
import { onMounted, ref } from 'vue'
import { onboardingApi } from '@/api/onboarding'
import PageHeader from '@/components/ui/PageHeader.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'
import TacheLigne from '@/components/onboarding/TacheLigne.vue'

const taches = ref(null)
const charger = async () => { taches.value = await onboardingApi.mesTaches() }
onMounted(charger)
</script>

<template>
  <PageHeader titre="Mes tâches d'onboarding" sous-titre="Les tâches d'accueil des nouveaux employés confiées à votre poste, de la plus urgente à la moins urgente." />
  <section class="panel">
    <Chargement v-if="taches === null" />
    <Vide v-else-if="!taches.length" titre="Aucune tâche en attente" texte="Quand un contrat est signé, les tâches qui reviennent à votre poste apparaissent ici." />
    <TacheLigne v-for="t in taches" v-else :key="t.id" :tache="t" avec-employe @change="charger" />
  </section>
</template>
