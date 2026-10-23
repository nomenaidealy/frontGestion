<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { besoinsApi } from '@/api/besoins'
import { referentielsApi } from '@/api/referentiels'

// Champs d'un poste (création directe ou modification). v-model : { libelle, idMetier, idEchelon, idUniteOrga, idSuperieurDirect }
const modele = defineModel({ type: Object, required: true })
defineProps({ uniteFixe: { type: Boolean, default: false } })

const listes = reactive({ metiers: [], echelons: [], unites: [], superieurs: [] })
const pret = ref(false)
onMounted(async () => {
  const [m, e, u, s] = await Promise.all([
    referentielsApi.lister('metiers'), besoinsApi.echelons(), besoinsApi.unites(), besoinsApi.superieurs(modele.value.idUniteOrga),
  ])
  Object.assign(listes, { metiers: m, echelons: e, unites: u, superieurs: s })
  pret.value = true
})
// supérieur direct : un poste de l'unité ou d'une unité dont elle dépend
watch(() => modele.value.idUniteOrga, async (id, avant) => {
  if (!pret.value || id === avant) return
  listes.superieurs = await besoinsApi.superieurs(id)
  if (!listes.superieurs.some((x) => x.id === modele.value.idSuperieurDirect)) modele.value.idSuperieurDirect = null
})
</script>

<template>
  <div class="form-grid">
    <div class="full">
      <label class="form-label" for="pf-lib">Intitulé du poste</label>
      <input id="pf-lib" v-model="modele.libelle" class="form-control">
    </div>
    <div>
      <label class="form-label" for="pf-met">Métier</label>
      <select id="pf-met" v-model="modele.idMetier" class="form-select">
        <option :value="null" disabled>Choisir…</option>
        <option v-for="m in listes.metiers" :key="m.id" :value="m.id">{{ m.libelle }} ({{ m.parent }})</option>
      </select>
    </div>
    <div>
      <label class="form-label" for="pf-ech">Échelon</label>
      <select id="pf-ech" v-model="modele.idEchelon" class="form-select">
        <option :value="null" disabled>Choisir…</option>
        <option v-for="e in listes.echelons" :key="e.id" :value="e.id">{{ e.libelle }}</option>
      </select>
    </div>
    <div>
      <label class="form-label" for="pf-uni">Unité</label>
      <select id="pf-uni" v-model="modele.idUniteOrga" class="form-select" :disabled="uniteFixe">
        <option :value="null" disabled>Choisir…</option>
        <option v-for="u in listes.unites" :key="u.id" :value="u.id">{{ u.libelle }}</option>
      </select>
    </div>
    <div>
      <label class="form-label" for="pf-sup">Supérieur direct <span class="opt">(facultatif)</span></label>
      <select id="pf-sup" v-model="modele.idSuperieurDirect" class="form-select">
        <option :value="null">Aucun</option>
        <option v-for="s in listes.superieurs" :key="s.id" :value="s.id">{{ s.libelle }}</option>
      </select>
    </div>
  </div>
</template>
