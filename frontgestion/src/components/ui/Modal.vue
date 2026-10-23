<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

// Boîte de dialogue : <Modal titre="…" @fermer="…"> contenu <template #pied>boutons</template></Modal>
defineProps({ titre: { type: String, required: true }, large: { type: Boolean, default: false } })
const emit = defineEmits(['fermer'])
const echap = (e) => { if (e.key === 'Escape') emit('fermer') }
onMounted(() => document.addEventListener('keydown', echap))
onBeforeUnmount(() => document.removeEventListener('keydown', echap))
</script>

<template>
  <Teleport to="body">
    <div class="modal-back" @mousedown.self="emit('fermer')">
      <div class="modal-box" :class="{ large }" role="dialog" aria-modal="true" :aria-label="titre">
        <div class="modal-head">
          <h2>{{ titre }}</h2>
          <button type="button" class="btn-close" aria-label="Fermer" @click="emit('fermer')"></button>
        </div>
        <div class="modal-body"><slot /></div>
        <div v-if="$slots.pied" class="modal-foot"><slot name="pied" /></div>
      </div>
    </div>
  </Teleport>
</template>
