<script setup>
const TAILLE_MAX_CV = 5 * 1024 * 1024 // = app.candidature.cv-max-bytes côté back

defineProps({ erreur: { type: String, default: null } })
// choisi(fichier, erreur) : erreur = null si le fichier convient
const emit = defineEmits(['choisi'])

function choisir(ev) {
  const f = ev.target.files?.[0] ?? null
  let erreur = null
  if (f && !f.name.toLowerCase().endsWith('.pdf')) erreur = 'Le CV doit être un fichier PDF.'
  else if (f && f.size > TAILLE_MAX_CV) erreur = 'Le CV ne doit pas dépasser 5 Mo.'
  emit('choisi', f, erreur)
}
</script>

<template>
  <div class="card shadow-sm mb-3">
    <div class="card-header">Votre CV *</div>
    <div class="card-body">
      <label for="cv" class="form-label">Fichier PDF, 5 Mo maximum</label>
      <input id="cv" type="file" accept="application/pdf,.pdf" class="form-control" :class="{ 'is-invalid': erreur }"
             @change="choisir">
      <div class="invalid-feedback">{{ erreur }}</div>
    </div>
  </div>
</template>
