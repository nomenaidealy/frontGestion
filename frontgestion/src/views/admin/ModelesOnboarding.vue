<script setup>
import { onMounted, ref } from 'vue'
import { onboardingApi } from '@/api/onboarding'
import { organisationApi } from '@/api/organisation'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import PageHeader from '@/components/ui/PageHeader.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Icon from '@/components/ui/Icon.vue'

const { a } = useAuth()
const toast = useToast()
const modeles = ref(null)
const postes = ref([])
const edition = ref(null)
const erreur = ref('')

const charger = async () => { modeles.value = await onboardingApi.modeles() }
onMounted(async () => { charger(); postes.value = await organisationApi.postes({ etat: 'ACTIF' }) })

function ouvrir(m) {
  erreur.value = ''
  edition.value = m
    ? { id: m.id, libelle: m.libelle, statut: m.statut, taches: m.taches.map((t) => ({ ...t })) }
    : { libelle: '', statut: 'ACTIF', taches: [{ libelle: '', idPosteResponsable: null, delaiJours: 0, obligatoire: true }] }
}
function deplacer(i, d) {
  const t = edition.value.taches
  const j = i + d
  if (j < 0 || j >= t.length) return
  ;[t[i], t[j]] = [t[j], t[i]]
}
async function enregistrer() {
  erreur.value = ''
  const corps = { libelle: edition.value.libelle, statut: edition.value.statut,
    taches: edition.value.taches.map((t) => ({ id: t.id ?? null, typeTache: t.typeTache ?? null, libelle: t.libelle, idPosteResponsable: t.idPosteResponsable, delaiJours: Number(t.delaiJours) || 0, obligatoire: t.obligatoire })) }
  try {
    if (edition.value.id) await onboardingApi.modifierModele(edition.value.id, corps)
    else await onboardingApi.creerModele(corps)
    toast.ok('Modèle enregistré')
    edition.value = null
    charger()
  } catch (e) { erreur.value = e.message }
}
</script>

<template>
  <PageHeader titre="Modèles d'onboarding" sous-titre="La liste des tâches créée pour chaque nouvel employé à la signature de son contrat. Le premier modèle actif est utilisé.">
    <button v-if="a('RH', 'ADMIN') && !edition" type="button" class="btn btn-primary" @click="ouvrir(null)"><Icon name="plus" /> Nouveau modèle</button>
  </PageHeader>
  <Chargement v-if="modeles === null" />

  <form v-else-if="edition" class="panel" @submit.prevent="enregistrer">
    <div class="panel-head"><h2>{{ edition.id ? 'Modifier le modèle' : 'Nouveau modèle' }}</h2></div>
    <div class="panel-body">
      <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
      <div class="form-grid mb-4">
        <div><label class="form-label" for="ml">Nom du modèle</label><input id="ml" v-model="edition.libelle" class="form-control"></div>
        <div>
          <label class="form-label" for="ms">Statut</label>
          <select id="ms" v-model="edition.statut" class="form-select"><option value="ACTIF">Actif</option><option value="INACTIF">Inactif</option></select>
        </div>
      </div>
      <div v-for="(t, i) in edition.taches" :key="t.id ?? `n${i}`" class="repeat">
        <div class="repeat-head">
          <b>Tâche {{ i + 1 }}</b>
          <div class="d-flex gap-1">
            <button type="button" class="btn btn-sm btn-light" :disabled="i === 0" aria-label="Monter" @click="deplacer(i, -1)">↑</button>
            <button type="button" class="btn btn-sm btn-light" :disabled="i === edition.taches.length - 1" aria-label="Descendre" @click="deplacer(i, 1)">↓</button>
            <button type="button" class="btn btn-sm btn-outline-danger" :disabled="edition.taches.length === 1" @click="edition.taches.splice(i, 1)">Retirer</button>
          </div>
        </div>
        <div class="form-grid">
          <div class="full"><label class="form-label">Intitulé</label><input v-model="t.libelle" class="form-control"></div>
          <div>
            <label class="form-label">Responsable</label>
            <select v-model="t.idPosteResponsable" class="form-select">
              <option :value="null">Supérieur direct du nouvel employé</option>
              <option v-for="p in postes" :key="p.id" :value="p.id">{{ p.libelle }}</option>
            </select>
          </div>
          <div class="d-flex gap-3 align-items-end">
            <div><label class="form-label">Délai (jours)</label><input v-model.number="t.delaiJours" type="number" min="0" class="form-control" style="width:100px"></div>
            <label class="form-check" style="padding-bottom:8px"><input v-model="t.obligatoire" type="checkbox" class="form-check-input"> <span class="form-check-label">Obligatoire</span></label>
          </div>
        </div>
      </div>
      <button type="button" class="btn btn-light mt-3" @click="edition.taches.push({ libelle: '', idPosteResponsable: null, delaiJours: 0, obligatoire: true })"><Icon name="plus" /> Ajouter une tâche</button>
    </div>
    <div class="panel-foot">
      <button type="button" class="btn btn-light" @click="edition = null">Annuler</button>
      <button class="btn btn-primary">Enregistrer le modèle</button>
    </div>
  </form>

  <div v-else class="stack">
    <section v-for="m in modeles" :key="m.id" class="panel">
      <div class="panel-head">
        <div><h2>{{ m.libelle }}</h2><p>{{ m.taches.length }} tâche(s) — utilisé {{ m.utilisations }} fois</p></div>
        <div class="d-flex gap-2 align-items-center">
          <span class="status" :class="m.statut === 'ACTIF' ? 'ok' : ''">{{ m.statut === 'ACTIF' ? 'Actif' : 'Inactif' }}</span>
          <button v-if="a('RH', 'ADMIN')" type="button" class="btn btn-sm btn-light" @click="ouvrir(m)">Modifier</button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table">
          <thead><tr><th class="num" style="width:50px">#</th><th>Tâche</th><th>Responsable</th><th class="num">Délai</th><th></th></tr></thead>
          <tbody>
            <tr v-for="t in m.taches" :key="t.id">
              <td class="num">{{ t.ordre }}</td><td class="cell-main">{{ t.libelle }}</td><td>{{ t.posteResponsable }}</td>
              <td class="num">J+{{ t.delaiJours }}</td><td><span v-if="!t.obligatoire" class="badge">facultative</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
