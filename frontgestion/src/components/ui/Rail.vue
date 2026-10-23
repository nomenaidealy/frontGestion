<script setup>
import Icon from './Icon.vue'

// Rail d'étapes (circuit de validation, cycle d'un contrat…).
// etapes : [{ titre, meta, note, statut: 'fait' | 'en-cours' | 'a-venir' | 'refuse' | 'non-atteinte' }]
defineProps({ etapes: { type: Array, required: true } })
</script>

<template>
  <ol class="rail">
    <li v-for="(e, i) in etapes" :key="i" :class="e.statut">
      <span class="pin">
        <Icon v-if="e.statut === 'fait'" name="check" />
        <Icon v-else-if="e.statut === 'refuse'" name="x" />
        <template v-else>{{ i + 1 }}</template>
      </span>
      <div>
        <div class="rail-title">{{ e.titre }}</div>
        <div v-if="e.meta" class="rail-meta">{{ e.meta }}</div>
        <div v-if="e.note" class="rail-note">« {{ e.note }} »</div>
      </div>
    </li>
  </ol>
</template>
