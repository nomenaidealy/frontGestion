<script setup>
defineProps({
  type: { type: String, default: 'erreur', validator: (v) => ['erreur', 'succes'].includes(v) },
  message: { type: String, default: '' },
})
</script>

<template>
  <div v-if="message" class="alert" :class="`alert-${type}`" :role="type === 'erreur' ? 'alert' : 'status'">
    {{ message }}
  </div>
</template>

<style scoped>
.alert {
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 12px;
}

.alert-succes {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.alert-erreur {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}
</style>
