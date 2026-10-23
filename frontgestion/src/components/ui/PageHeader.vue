<script setup>
import Icon from './Icon.vue'

// En-tête de page : titre, phrase d'explication, lien de retour, actions (slot).
defineProps({
  titre: { type: String, required: true },
  sousTitre: { type: String, default: '' },
  retour: { type: [String, Object], default: null },
  retourLibelle: { type: String, default: 'Retour' },
})
</script>

<template>
  <header class="page-head">
    <div>
      <RouterLink v-if="retour" :to="retour" class="back-link"><Icon name="back" style="width:14px;height:14px" /> {{ retourLibelle }}</RouterLink>
      <h1>{{ titre }}</h1>
      <p v-if="sousTitre">{{ sousTitre }}</p>
      <slot name="sous-titre" />
    </div>
    <div v-if="$slots.default" class="page-head-actions"><slot /></div>
  </header>
</template>
