<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { besoinsApi } from '@/api/besoins'
import { organisationApi } from '@/api/organisation'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'

const router = useRouter()
const toast = useToast()
const listes = reactive({ metiers: [], categories: [], echelons: [], unites: [], superieurs: [] })
const modeMetier = ref('existant')
const form = reactive({ libelle: '', idMetier: null, nouveauMetierLibelle: '', idCategorie: null, idEchelon: null, idUniteOrga: null, idSuperieurDirect: null })
const erreur = ref('')

onMounted(async () => {
  const [m, c, e, u, s] = await Promise.all([besoinsApi.metiers(), besoinsApi.categories(), besoinsApi.echelons(), besoinsApi.unites(), besoinsApi.superieurs()])
  Object.assign(listes, { metiers: m, categories: c, echelons: e, unites: u, superieurs: s })
})

async function envoyer() {
  erreur.value = ''
  const corps = { ...form, libelle: form.libelle.trim() }
  if (modeMetier.value === 'existant') { corps.nouveauMetierLibelle = null; corps.idCategorie = null } else corps.idMetier = null
  try {
    const p = await organisationApi.demanderPoste(corps)
    toast.ok(`Poste ${p.code} proposé au DG`)
    router.push(`/postes/${p.id}`)
  } catch (e) { erreur.value = e.message }
}
</script>

<template>
  <PageHeader titre="Demander un poste" sous-titre="Proposez un nouveau poste sans recrutement immédiat. Pour recruter, exprimez plutôt un besoin : le poste y est créé en même temps." retour="/postes" retour-libelle="Postes" />
  <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
  <form class="panel" @submit.prevent="envoyer">
    <div class="panel-body form-grid">
      <div class="full">
        <label class="form-label" for="lib">Intitulé du poste</label>
        <input id="lib" v-model="form.libelle" class="form-control">
      </div>
      <div class="full">
        <label class="form-label">Métier</label>
        <div class="d-flex gap-3 mb-2">
          <label class="form-check"><input v-model="modeMetier" type="radio" value="existant" class="form-check-input"> <span class="form-check-label">Métier existant</span></label>
          <label class="form-check"><input v-model="modeMetier" type="radio" value="nouveau" class="form-check-input"> <span class="form-check-label">Nouveau métier</span></label>
        </div>
        <select v-if="modeMetier === 'existant'" v-model="form.idMetier" class="form-select">
          <option :value="null" disabled>Choisir…</option>
          <option v-for="m in listes.metiers" :key="m.id" :value="m.id">{{ m.libelle }}</option>
        </select>
        <div v-else class="form-grid">
          <input v-model="form.nouveauMetierLibelle" class="form-control" placeholder="Libellé du métier">
          <select v-model="form.idCategorie" class="form-select">
            <option :value="null" disabled>Catégorie…</option>
            <option v-for="c in listes.categories" :key="c.id" :value="c.id">{{ c.libelle }}</option>
          </select>
        </div>
      </div>
      <div>
        <label class="form-label" for="ech">Échelon</label>
        <select id="ech" v-model="form.idEchelon" class="form-select">
          <option :value="null" disabled>Choisir…</option>
          <option v-for="e in listes.echelons" :key="e.id" :value="e.id">{{ e.libelle }}</option>
        </select>
      </div>
      <div>
        <label class="form-label" for="uni">Unité</label>
        <select id="uni" v-model="form.idUniteOrga" class="form-select">
          <option :value="null" disabled>Choisir…</option>
          <option v-for="u in listes.unites" :key="u.id" :value="u.id">{{ u.libelle }}</option>
        </select>
      </div>
      <div class="full">
        <label class="form-label" for="sup">Supérieur direct <span class="opt">(facultatif)</span></label>
        <select id="sup" v-model="form.idSuperieurDirect" class="form-select">
          <option :value="null">Aucun</option>
          <option v-for="s in listes.superieurs" :key="s.id" :value="s.id">{{ s.libelle }}</option>
        </select>
      </div>
    </div>
    <div class="panel-foot">
      <RouterLink to="/postes" class="btn btn-light">Annuler</RouterLink>
      <button class="btn btn-primary">Proposer le poste</button>
    </div>
  </form>
</template>
