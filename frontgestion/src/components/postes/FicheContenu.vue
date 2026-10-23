<script setup>
// Contenu d'une fiche de poste (mission, activités, profil, conditions), en lecture.
defineProps({ fiche: { type: Object, required: true } })
const lignes = (t) => (t || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
</script>

<template>
  <div class="fiche">
    <h3>Mission</h3>
    <p class="texte">{{ fiche.mission }}</p>
    <template v-if="lignes(fiche.activites).length">
      <h3>Activités principales</h3>
      <ul><li v-for="(l, i) in lignes(fiche.activites)" :key="i">{{ l }}</li></ul>
    </template>
    <template v-if="fiche.formation || fiche.experience || lignes(fiche.competences).length">
      <h3>Profil requis</h3>
      <dl class="facts">
        <div v-if="fiche.formation"><dt>Formation</dt><dd>{{ fiche.formation }}</dd></div>
        <div v-if="fiche.experience"><dt>Expérience</dt><dd>{{ fiche.experience }}</dd></div>
      </dl>
      <ul v-if="lignes(fiche.competences).length"><li v-for="(l, i) in lignes(fiche.competences)" :key="i">{{ l }}</li></ul>
    </template>
    <template v-if="lignes(fiche.conditions).length">
      <h3>Conditions d'exercice</h3>
      <ul><li v-for="(l, i) in lignes(fiche.conditions)" :key="i">{{ l }}</li></ul>
    </template>
  </div>
</template>

<style scoped>
.fiche h3 { font-size: 0.95rem; margin: 1rem 0 0.35rem; }
.fiche h3:first-child { margin-top: 0; }
.fiche ul { margin: 0.25rem 0; padding-left: 1.2rem; }
.texte { white-space: pre-line; margin: 0; }
</style>
