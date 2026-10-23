<script setup>
// Identité d'un employé (création et modification).
const f = defineModel({ type: Object, required: true })
</script>

<template>
  <div class="form-grid">
    <div><label class="form-label" for="ef-nom">Nom</label><input id="ef-nom" v-model="f.nom" class="form-control" autocomplete="family-name"></div>
    <div><label class="form-label" for="ef-pre">Prénoms</label><input id="ef-pre" v-model="f.prenoms" class="form-control" autocomplete="given-name"></div>
    <div><label class="form-label" for="ef-nai">Date de naissance</label><input id="ef-nai" v-model="f.dateNaissance" type="date" class="form-control"></div>
    <div><label class="form-label" for="ef-cin">CIN</label><input id="ef-cin" v-model="f.cin" class="form-control"></div>
    <div><label class="form-label" for="ef-tel">Téléphone</label><input id="ef-tel" v-model="f.telephone" class="form-control" autocomplete="tel"></div>
    <div><label class="form-label" for="ef-mail">Email</label><input id="ef-mail" v-model="f.email" type="email" class="form-control" autocomplete="email"></div>
    <div class="full"><label class="form-label" for="ef-adr">Adresse</label><input id="ef-adr" v-model="f.adresse" class="form-control" autocomplete="street-address"></div>
  </div>
</template>
