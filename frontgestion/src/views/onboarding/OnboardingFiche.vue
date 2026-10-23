<script setup>
import { onMounted, ref } from 'vue'
import { onboardingApi } from '@/api/onboarding'
import { dateFr } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Chargement from '@/components/ui/Chargement.vue'
import TacheLigne from '@/components/onboarding/TacheLigne.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const o = ref(null)
const charger = async () => { o.value = await onboardingApi.fiche(props.id) }
onMounted(charger)
</script>

<template>
  <Chargement v-if="!o" />
  <template v-else>
    <PageHeader :titre="`Onboarding de ${o.employe}`" retour="/onboarding" retour-libelle="Onboarding">
      <template #sous-titre>
        <p class="d-flex flex-wrap gap-2 align-items-center"><Statut type="onboarding" :valeur="o.statut" /> {{ o.poste }}, {{ o.unite }} — modèle « {{ o.modele }} »</p>
      </template>
      <RouterLink :to="`/personnel/${o.idEmploye}`" class="btn btn-light">Dossier de l'employé</RouterLink>
      <RouterLink :to="`/contrats/${o.idContrat}`" class="btn btn-light">Contrat {{ o.contrat }}</RouterLink>
    </PageHeader>

    <div class="kpis">
      <div class="kpi"><div class="kpi-label">Avancement</div><div class="kpi-value">{{ o.faites }}/{{ o.total }}</div>
        <div class="progress-line mt-2"><span :style="{ width: `${o.total ? (o.faites * 100) / o.total : 0}%` }"></span></div></div>
      <div class="kpi"><div class="kpi-label">Début</div><div class="kpi-value" style="font-size:1.25rem">{{ dateFr(o.dateDebut) }}</div></div>
      <div class="kpi" :class="{ attention: o.enRetard }"><div class="kpi-label">Tâches en retard</div><div class="kpi-value">{{ o.enRetard }}</div></div>
      <div class="kpi"><div class="kpi-label">Fin</div><div class="kpi-value" style="font-size:1.25rem">{{ o.dateFin ? dateFr(o.dateFin) : '—' }}</div></div>
    </div>

    <section class="panel">
      <div class="panel-head"><div><h2>Tâches</h2><p>L'onboarding est terminé quand toutes les tâches obligatoires sont faites.</p></div></div>
      <TacheLigne v-for="t in o.taches" :key="t.id" :tache="t" @change="(n) => (o = n)" />
    </section>
  </template>
</template>
