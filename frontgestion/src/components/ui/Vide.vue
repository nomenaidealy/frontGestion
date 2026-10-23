<script setup>
// État vide : ce qu'il n'y a pas, et quoi faire.
defineProps({ titre: { type: String, required: true }, texte: { type: String, default: '' } })
</script>

<template>
  <div class="empty">
    <b>{{ titre }}</b>
    <span v-if="texte">{{ texte }}</span>
    <div v-if="$slots.default"><slot /></div>
  </div>
</template>
