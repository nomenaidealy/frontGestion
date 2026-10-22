<script setup>
defineProps({ disabled: Boolean, loading: Boolean })
defineEmits(['validate'])
</script>

<template>
  <button class="validate-button" :disabled="disabled || loading" @click="$emit('validate')">
    <span v-if="loading" class="button-loader"></span>
    <span v-else>✓</span>
    {{ loading ? 'Validation en cours...' : 'Valider le besoin' }}
  </button>
</template>
