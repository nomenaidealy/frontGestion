<script setup>
import BadgeEtat from './BadgeEtat.vue'
import { formatDateHeure } from './candidat'

defineProps({ historique: { type: Array, required: true } })
</script>

<template>
  <div>
    <h6>Historique</h6>
    <ul class="list-unstyled mb-0 small">
      <li v-for="(h, i) in historique" :key="i" class="d-flex flex-wrap gap-2 align-items-baseline py-1 border-bottom">
        <span class="text-muted text-nowrap">{{ formatDateHeure(h.date) }}</span>
        <span>
          <template v-if="h.etatAvant"><BadgeEtat :etat="h.etatAvant" /> → </template>
          <BadgeEtat :etat="h.etatApres" />
        </span>
        <span class="text-muted">{{ h.utilisateur ? `par ${h.utilisateur}` : (h.etatAvant ? 'automatique' : 'site public') }}</span>
        <span v-if="h.commentaire" class="w-100 ps-1 fst-italic">« {{ h.commentaire }} »</span>
      </li>
    </ul>
  </div>
</template>
