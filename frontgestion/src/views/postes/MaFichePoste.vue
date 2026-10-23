<script setup>
import { onMounted, ref } from 'vue'
import { fichesPosteApi } from '@/api/fichesPoste'
import { dateFr } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'
import FicheContenu from '@/components/postes/FicheContenu.vue'

const fiche = ref(undefined)   // undefined = chargement, null = pas de fiche
onMounted(async () => { fiche.value = (await fichesPosteApi.maFiche()) || null })
</script>

<template>
  <PageHeader titre="Ma fiche de poste" sous-titre="Les missions, le profil et les conditions d'exercice de votre poste actuel.">
    <a v-if="fiche" :href="fichesPosteApi.pdfMaFiche" target="_blank" rel="noopener" class="btn btn-primary">Télécharger le PDF</a>
  </PageHeader>
  <Chargement v-if="fiche === undefined" />
  <Vide v-else-if="fiche === null" titre="Pas de fiche de poste" texte="Vous n'occupez pas de poste, ou la RH n'a pas encore rédigé la fiche de votre métier." />
  <section v-else class="panel">
    <div class="panel-head">
      <h2>{{ fiche.poste }}</h2>
      <span class="text-muted small">Version {{ fiche.version }} du {{ dateFr(fiche.dateMaj) }}</span>
    </div>
    <div class="panel-body"><FicheContenu :fiche="fiche" /></div>
  </section>
</template>
