<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { demandesContratApi } from '@/api/demandesContrat'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { ariary, dateFr, MOTIFS_CONTRAT } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'
import DemandeContratForm from '@/components/contrat/DemandeContratForm.vue'

const { a } = useAuth()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const peutVoirTout = computed(() => a('RH', 'DG', 'Finance', 'ADMIN'))
const peutTraiter = computed(() => a('RH', 'DG', 'Finance'))
const vue = ref(route.query.vue || (peutTraiter.value ? 'a-traiter' : 'mes'))
const liste = ref(null)
const creation = ref(false)

async function charger() { liste.value = null; liste.value = await demandesContratApi.lister(vue.value) }
onMounted(charger)
watch(vue, () => { router.replace({ query: { vue: vue.value } }); charger() })

function creee(d) {
  creation.value = false
  toast.ok('Demande enregistrée')
  router.push(`/contrats/demandes/${d.id}`)
}
</script>

<template>
  <PageHeader titre="Demandes de contrat" sous-titre="Renouvellement, changement de type de contrat et augmentation de salaire : instruction par la RH, avis de la Finance si le budget est dépassé, décision du DG.">
    <button type="button" class="btn btn-primary" @click="creation = true">Nouvelle demande</button>
  </PageHeader>

  <div class="filters">
    <div class="segment">
      <button v-if="peutTraiter" type="button" :class="{ on: vue === 'a-traiter' }" @click="vue = 'a-traiter'">À traiter</button>
      <button type="button" :class="{ on: vue === 'mes' }" @click="vue = 'mes'">Mes demandes</button>
      <button v-if="peutVoirTout" type="button" :class="{ on: vue === 'toutes' }" @click="vue = 'toutes'">Toutes</button>
    </div>
  </div>

  <Chargement v-if="!liste" />
  <Vide v-else-if="!liste.length" titre="Aucune demande" texte="Les demandes de contrat apparaissent ici." />
  <section v-else class="panel">
    <div class="table-responsive">
      <table class="table align-middle">
        <thead><tr><th>Référence</th><th>Employé</th><th>Objet</th><th>Salaire demandé</th><th>Effet</th><th>État</th></tr></thead>
        <tbody>
          <tr v-for="d in liste" :key="d.id" class="cliquable" @click="router.push(`/contrats/demandes/${d.id}`)">
            <td class="cell-main">{{ d.reference }}<span class="cell-sub">{{ dateFr(d.dateDemande) }}</span></td>
            <td class="cell-main">{{ d.employe }}<span class="cell-sub">{{ d.poste }}</span></td>
            <td>{{ MOTIFS_CONTRAT[d.motifType] }}<span v-if="d.motifType === 'TRANSFORMATION'" class="cell-sub">{{ d.typeActuel }} → {{ d.typeDemande }}</span></td>
            <td>{{ ariary(d.salaire) }}<span class="cell-sub">actuel {{ ariary(d.salaireActuel) }}</span></td>
            <td>{{ dateFr(d.dateEffet) }}</td>
            <td><Statut type="demandeContrat" :valeur="d.etat" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <DemandeContratForm v-if="creation" @fermer="creation = false" @creee="creee" />
</template>
