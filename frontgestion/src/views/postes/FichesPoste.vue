<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { fichesPosteApi } from '@/api/fichesPoste'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { dateFr } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Modal from '@/components/ui/Modal.vue'

const toast = useToast()
const { a } = useAuth()
const peutModifier = computed(() => a('RH'))
const lignes = ref(null)
const recherche = ref('')
const edition = ref(null)         // { idMetier, metier, nouveau }
const f = reactive({ mission: '', activites: '', formation: '', experience: '', competences: '', conditions: '' })
const enCours = ref(false)

const filtrees = computed(() => (lignes.value || []).filter((l) => l.metier.toLowerCase().includes(recherche.value.trim().toLowerCase())))
async function charger() { lignes.value = await fichesPosteApi.catalogue() }
onMounted(charger)

async function ouvrir(l) {
  const d = await fichesPosteApi.duMetier(l.idMetier)
  Object.assign(f, { mission: d.mission, activites: d.activites || '', formation: d.formation || '', experience: d.experience || '', competences: d.competences || '', conditions: d.conditions || '' })
  edition.value = { idMetier: l.idMetier, metier: l.metier, nouveau: !l.idFiche }
}
async function enregistrer() {
  enCours.value = true
  try {
    await fichesPosteApi.enregistrerMetier(edition.value.idMetier, { ...f })
    toast.ok('Fiche enregistrée')
    edition.value = null
    await charger()
  } catch (e) { toast.erreur(e) } finally { enCours.value = false }
}
</script>

<template>
  <PageHeader titre="Fiches de poste" sous-titre="Un modèle par métier, réutilisé pour tous les postes de ce métier et repris dans les offres d'emploi. Chaque employé voit la fiche de son poste dans « Ma fiche de poste ».">
    <input v-model="recherche" class="form-control" style="max-width: 16rem" placeholder="Rechercher un métier" />
  </PageHeader>
  <Chargement v-if="!lignes" />
  <section v-else class="panel">
    <table class="table">
      <thead><tr><th>Métier</th><th>Catégorie</th><th>Postes concernés</th><th>Fiche</th><th></th></tr></thead>
      <tbody>
        <tr v-for="l in filtrees" :key="l.idMetier">
          <td>{{ l.metier }}</td>
          <td>{{ l.categorie }}</td>
          <td>{{ l.nbPostes }}<span v-if="l.nbPostesPropres" class="text-muted small"> (dont {{ l.nbPostesPropres }} avec fiche propre)</span></td>
          <td>
            <span v-if="l.idFiche">Version {{ l.version }} · {{ dateFr(l.dateMaj) }}</span>
            <span v-else class="text-muted">Pas encore rédigée</span>
          </td>
          <td class="text-end">
            <button type="button" class="btn btn-outline-secondary btn-sm" @click="ouvrir(l)">{{ peutModifier ? (l.idFiche ? 'Modifier' : 'Rédiger') : 'Voir' }}</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <Modal v-if="edition" :titre="`Fiche de poste — ${edition.metier}`" large @fermer="edition = null">
    <p v-if="edition.nouveau && peutModifier" class="text-muted small">Texte standard proposé : adaptez-le au métier. Une ligne par activité, compétence ou condition.</p>
    <div class="mb-3"><label class="form-label">Mission *</label><textarea v-model="f.mission" class="form-control" rows="3" :disabled="!peutModifier" /></div>
    <div class="mb-3"><label class="form-label">Activités principales <span class="text-muted">(une par ligne)</span></label><textarea v-model="f.activites" class="form-control" rows="4" :disabled="!peutModifier" /></div>
    <div class="row">
      <div class="col-md-6 mb-3"><label class="form-label">Formation</label><textarea v-model="f.formation" class="form-control" rows="2" :disabled="!peutModifier" /></div>
      <div class="col-md-6 mb-3"><label class="form-label">Expérience</label><textarea v-model="f.experience" class="form-control" rows="2" :disabled="!peutModifier" /></div>
    </div>
    <div class="mb-3"><label class="form-label">Compétences et qualités <span class="text-muted">(une par ligne)</span></label><textarea v-model="f.competences" class="form-control" rows="3" :disabled="!peutModifier" /></div>
    <div class="mb-1"><label class="form-label">Conditions d'exercice <span class="text-muted">(une par ligne)</span></label><textarea v-model="f.conditions" class="form-control" rows="3" :disabled="!peutModifier" /></div>
    <template #pied>
      <button type="button" class="btn btn-light" @click="edition = null">Fermer</button>
      <button v-if="peutModifier" type="button" class="btn btn-primary" :disabled="enCours || !f.mission.trim()" @click="enregistrer">Enregistrer</button>
    </template>
  </Modal>
</template>
