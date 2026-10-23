<script setup>
import { onMounted, reactive, ref } from 'vue'
import { delegationsApi } from '@/api/delegations'
import { adminApi } from '@/api/admin'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { aujourdhui, dateFr } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Modal from '@/components/ui/Modal.vue'
import Icon from '@/components/ui/Icon.vue'

const { currentUser, a } = useAuth()
const toast = useToast()
const toutes = ref(false)
const liste = ref(null)
const comptes = ref([])
const nouvelle = ref(false)
const form = reactive({ delegue: null, dateDebut: aujourdhui(), dateFin: '' })
const erreur = ref('')

async function charger() { liste.value = null; liste.value = toutes.value ? await delegationsApi.toutes() : await delegationsApi.mes() }
onMounted(async () => {
  charger()
  comptes.value = (await adminApi.comptesActifs()).filter((c) => c.id !== currentUser.value?.id)
})

async function creer() {
  erreur.value = ''
  if (!form.delegue || !form.dateDebut || !form.dateFin) { erreur.value = 'Choisissez le délégué et la période.'; return }
  try {
    await delegationsApi.creer(form.dateDebut, form.dateFin, form.delegue)
    toast.ok('Délégation enregistrée')
    nouvelle.value = false
    charger()
  } catch (e) { erreur.value = e.message }
}
async function arreter(d) {
  try { await delegationsApi.annuler(d.id); toast.ok('Délégation arrêtée'); charger() } catch (e) { toast.erreur(e) }
}
</script>

<template>
  <PageHeader titre="Délégations" sous-titre="Pendant une absence, confiez vos validations de besoins à un collègue. Il reçoit aussi vos notifications de validation.">
    <button type="button" class="btn btn-primary" @click="nouvelle = true"><Icon name="plus" /> Déléguer mes validations</button>
  </PageHeader>
  <div v-if="a('RH', 'ADMIN')" class="filters">
    <div class="segment">
      <button type="button" :class="{ on: !toutes }" @click="toutes = false; charger()">Les miennes</button>
      <button type="button" :class="{ on: toutes }" @click="toutes = true; charger()">Toutes</button>
    </div>
  </div>
  <section class="panel">
    <Chargement v-if="liste === null" />
    <Vide v-else-if="!liste.length" titre="Aucune délégation" texte="Vos délégations données ou reçues apparaîtront ici." />
    <div v-else class="table-responsive">
      <table class="table align-middle">
        <thead><tr><th>De</th><th>À</th><th>Période</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          <tr v-for="d in liste" :key="d.id">
            <td class="cell-main">{{ d.delegant }}</td><td>{{ d.delegue }}</td>
            <td>du {{ dateFr(d.dateDebut) }} au {{ dateFr(d.dateFin) }}</td>
            <td><Statut type="delegation" :valeur="d.statut" /></td>
            <td class="text-end">
              <button v-if="d.statut !== 'TERMINEE' && (d.idDelegant === currentUser?.id || a('RH', 'ADMIN'))" type="button" class="btn btn-sm btn-light" @click="arreter(d)">
                {{ d.statut === 'A_VENIR' ? 'Supprimer' : 'Arrêter' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <Modal v-if="nouvelle" titre="Déléguer mes validations" @fermer="nouvelle = false">
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div class="form-grid">
      <div class="full">
        <label class="form-label" for="dl">Délégué</label>
        <select id="dl" v-model="form.delegue" class="form-select">
          <option :value="null" disabled>Choisir un collègue…</option>
          <option v-for="c in comptes" :key="c.id" :value="c.id">{{ c.libelle }}</option>
        </select>
      </div>
      <div><label class="form-label" for="dd">Du</label><input id="dd" v-model="form.dateDebut" type="date" class="form-control"></div>
      <div><label class="form-label" for="df">Au</label><input id="df" v-model="form.dateFin" type="date" :min="form.dateDebut" class="form-control"></div>
    </div>
    <template #pied>
      <button type="button" class="btn btn-light" @click="nouvelle = false">Annuler</button>
      <button type="button" class="btn btn-primary" @click="creer">Déléguer</button>
    </template>
  </Modal>
</template>
