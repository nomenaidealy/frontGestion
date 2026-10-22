<script setup>
import { formatDate } from '@/views/offres/format'

defineProps({
  confirmation: { type: Object, required: true }, // réponse du back
  offre: { type: Object, required: true },
  email: { type: String, required: true },
})
</script>

<template>
  <div class="card border-success shadow-sm">
    <div class="card-body">
      <h4 class="text-success">Candidature envoyée</h4>
      <p>{{ confirmation.message }}</p>
      <p class="mb-3">
        Offre <strong>{{ confirmation.referenceOffre ?? offre.reference }}</strong> — {{ offre.postes }},
        déposée le {{ formatDate(confirmation.dateDepot) }}.
        Le service RH étudiera votre dossier et vous contactera à l'adresse <strong>{{ email }}</strong>.
      </p>
      <RouterLink :to="{ name: 'emplois' }" class="btn btn-primary">Voir les autres offres</RouterLink>
    </div>
  </div>
</template>
