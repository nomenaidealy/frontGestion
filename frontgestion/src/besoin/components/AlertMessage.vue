<script setup>
defineProps({
  type: { type: String, default: 'erreur' },   // 'erreur' ou 'succes'
  message: String,
})
</script>

<template>
  <div v-if="message" :class="['alerte', type]">{{ message }}</div>
</template>

<style scoped>
.alerte { padding: 10px 14px; border-radius: 6px; margin-bottom: 14px; }
.erreur { background: #fee2e2; color: #991b1b; }
.succes { background: #dcfce7; color: #166534; }
</style>