<script setup>
defineProps({
  label: String,
  options: { type: Array, default: () => [] },
  modelValue: [Number, String, null],
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue'])

function onChange(e) {
  const v = e.target.value
  emit('update:modelValue', v === '' ? null : (isNaN(v) ? v : Number(v)))
}
</script>

<template>
  <div class="champ">
    <label>{{ label }}</label>
    <select :value="modelValue" :disabled="disabled" @change="onChange">
      <option value="">-- Choisir --</option>
      <option v-for="o in options" :key="o.id" :value="o.id">{{ o.libelle }}</option>
    </select>
  </div>
</template>

<style scoped>
.champ { display: flex; flex-direction: column; margin-bottom: 12px; }
select { padding: 6px; }
</style>