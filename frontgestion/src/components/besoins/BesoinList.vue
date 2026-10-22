<script setup>
defineProps({
  besoins: { type: Array, required: true },
  selectedId: { type: [Number, String], default: null },
})

defineEmits(['select'])
</script>

<template>
  <section class="besoin-list panel">
    <div class="panel-heading">
      <div><span class="eyebrow">SUIVI DES DEMANDES</span><h2>Fiches de besoin</h2></div>
      <span class="count-badge">{{ besoins.length }}</span>
    </div>
    <div v-if="!besoins.length" class="list-empty">Aucun besoin disponible.</div>
    <button v-for="besoin in besoins" :key="besoin.id" class="besoin-list-item" :class="{ selected: selectedId === besoin.id }" @click="$emit('select', besoin)">
      <span class="item-reference">{{ besoin.reference || `Besoin #${besoin.id}` }}</span>
      <strong>{{ besoin.typeBesoin || 'Type non renseigne' }}</strong>
      <span class="item-meta">{{ besoin.uniteOrgaLibelle || 'Unite non renseignee' }}</span>
      <span class="state-pill" :class="String(besoin.etatActuel || '').toLowerCase()">{{ besoin.etatActuel || 'En attente' }}</span>
    </button>
  </section>
</template>
