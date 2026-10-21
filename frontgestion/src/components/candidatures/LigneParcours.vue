<script setup>
const ligne = defineModel({ type: Object, required: true })
const props = defineProps({
  index: { type: Number, required: true },
  types: { type: Array, required: true },
  erreurs: { type: Object, default: () => ({}) }, // toutes les erreurs du formulaire
  aujourdhui: { type: String, required: true },
})
// corrige(...champs) : erreurs à effacer côté parent ; retirer : supprimer la ligne
const emit = defineEmits(['corrige', 'retirer'])

const cle = (champ) => `details[${props.index}].${champ}`
const erreur = (champ) => props.erreurs[cle(champ)]
const invalide = (champ) => (erreur(champ) ? 'is-invalid' : '')
</script>

<template>
  <div class="row g-2 align-items-start border-top pt-2 mb-2">
    <div class="col-md-3">
      <label :for="`type-${index}`" class="form-label small mb-1">Type</label>
      <select :id="`type-${index}`" v-model="ligne.codeTypeInformation" class="form-select form-select-sm"
              :class="invalide('codeTypeInformation')">
        <option v-for="t in types" :key="t.code" :value="t.code">{{ t.libelle }}</option>
      </select>
      <div class="invalid-feedback">{{ erreur('codeTypeInformation') }}</div>
    </div>
    <div class="col-md-4">
      <label :for="`libelle-${index}`" class="form-label small mb-1">Libellé</label>
      <input :id="`libelle-${index}`" v-model="ligne.libelle" class="form-control form-control-sm" maxlength="255"
             :class="invalide('libelle')"
             :placeholder="ligne.codeTypeInformation === 'EXPERIENCE PRO' ? 'Poste et employeur' : ''"
             @input="emit('corrige', cle('libelle'))">
      <div class="invalid-feedback">{{ erreur('libelle') }}</div>
    </div>
    <div class="col-6 col-md-2">
      <label :for="`debut-${index}`" class="form-label small mb-1">Début</label>
      <input :id="`debut-${index}`" v-model="ligne.dateDebut" type="date" class="form-control form-control-sm"
             :max="aujourdhui" :class="invalide('dateDebut')"
             @input="emit('corrige', cle('dateDebut'), cle('dateFin'))">
      <div class="invalid-feedback">{{ erreur('dateDebut') }}</div>
    </div>
    <div class="col-6 col-md-2">
      <label :for="`fin-${index}`" class="form-label small mb-1">Fin</label>
      <input :id="`fin-${index}`" v-model="ligne.dateFin" type="date" class="form-control form-control-sm"
             :min="ligne.dateDebut || undefined" :class="invalide('dateFin')"
             @input="emit('corrige', cle('dateFin'))">
      <div class="invalid-feedback">{{ erreur('dateFin') }}</div>
    </div>
    <div class="col-md-1 d-flex align-items-end" style="min-height: 58px">
      <button type="button" class="btn btn-outline-danger btn-sm w-100" :aria-label="`Retirer la ligne ${index + 1}`"
              @click="emit('retirer')">✕</button>
    </div>
  </div>
</template>
