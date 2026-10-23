<script setup>
const valeur = defineModel({ type: String, default: '' })
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  erreur: { type: String, default: null },
  maxlength: { type: [Number, String], default: null },
  max: { type: String, default: null },
  autocomplete: { type: String, default: null },
})
// « corrige » : le champ a été modifié, le parent efface son erreur
const emit = defineEmits(['corrige'])
</script>

<template>
  <div>
    <label :for="id" class="form-label">{{ label }}</label>
    <input :id="id" v-model="valeur" :type="type" class="form-control" :class="{ 'is-invalid': erreur }"
           :maxlength="maxlength" :max="max" :autocomplete="autocomplete" @input="emit('corrige')">
    <div class="invalid-feedback">{{ erreur }}</div>
  </div>
</template>
