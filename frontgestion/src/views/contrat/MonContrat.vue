<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { demandesContratApi } from '@/api/demandesContrat'
import { useToast } from '@/composables/useToast'
import { ariary, dateFr, MOTIFS_CONTRAT } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'
import DemandeContratForm from '@/components/contrat/DemandeContratForm.vue'

const router = useRouter()
const toast = useToast()
const m = ref(undefined)          // undefined = chargement, null = pas de contrat signé
const demandes = ref([])
const creation = ref(false)

async function charger() {
  m.value = (await demandesContratApi.monContrat()) || null
  demandes.value = await demandesContratApi.lister('mes')
}
onMounted(charger)
function creee(d) { creation.value = false; toast.ok('Demande envoyée à la RH'); router.push(`/contrats/demandes/${d.id}`) }
const eligible = () => ({ idContrat: m.value.contrat.id, reference: m.value.contrat.reference, type: m.value.contrat.type, salaire: m.value.salaire, salaireMin: m.value.salaireMin, salaireMax: m.value.salaireMax })
</script>

<template>
  <PageHeader titre="Mon contrat" sous-titre="Votre contrat en cours. Vous pouvez demander une augmentation, un renouvellement ou un changement de type de contrat : la RH instruit la demande puis le DG décide.">
    <button v-if="m && !m.demandeEnCours" type="button" class="btn btn-primary" @click="creation = true">Faire une demande</button>
  </PageHeader>
  <Chargement v-if="m === undefined" />
  <Vide v-else-if="m === null" titre="Aucun contrat signé" texte="Votre contrat apparaîtra ici une fois signé." />
  <template v-else>
    <div v-if="m.demandeEnCours" class="alert alert-info">Une demande est en cours sur votre contrat : vous pourrez en faire une autre quand elle sera traitée.</div>
    <section class="panel">
      <div class="panel-head"><h2>{{ m.contrat.reference }}</h2></div>
      <div class="panel-body">
        <dl class="facts">
          <div><dt>Poste</dt><dd>{{ m.contrat.poste }}</dd></div>
          <div><dt>Type</dt><dd>{{ m.contrat.type }}</dd></div>
          <div><dt>Début</dt><dd>{{ dateFr(m.contrat.dateDebut) }}</dd></div>
          <div><dt>Fin prévue</dt><dd>{{ m.contrat.dateFinPrevue ? dateFr(m.contrat.dateFinPrevue) : 'Sans limite' }}</dd></div>
          <div><dt>Salaire mensuel brut</dt><dd>{{ ariary(m.salaire) }}</dd></div>
        </dl>
      </div>
    </section>
  </template>

  <section v-if="demandes.length" class="panel">
    <div class="panel-head"><h2>Mes demandes</h2></div>
    <div class="table-responsive">
      <table class="table align-middle">
        <thead><tr><th>Référence</th><th>Objet</th><th>Salaire demandé</th><th>État</th></tr></thead>
        <tbody>
          <tr v-for="d in demandes" :key="d.id" class="cliquable" @click="router.push(`/contrats/demandes/${d.id}`)">
            <td class="cell-main">{{ d.reference }}<span class="cell-sub">{{ dateFr(d.dateDemande) }}</span></td>
            <td>{{ MOTIFS_CONTRAT[d.motifType] }}</td><td>{{ ariary(d.salaire) }}</td>
            <td><Statut type="demandeContrat" :valeur="d.etat" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <DemandeContratForm v-if="creation && m" :contrat="eligible()" titre="Demande sur mon contrat" @fermer="creation = false" @creee="creee" />
</template>
