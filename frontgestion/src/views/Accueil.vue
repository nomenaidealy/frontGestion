<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { reportingApi } from '@/api/reporting'
import { besoinsApi } from '@/api/besoins'
import { notificationsApi } from '@/api/notifications'
import { dateFr, depuis, nombre } from '@/utils/format'
import Statut from '@/components/ui/Statut.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Icon from '@/components/ui/Icon.vue'

const route = useRoute()
const { a } = useAuth()
const acc = ref(null)
const kpi = ref(null)
const aValider = ref([])
const notifs = ref([])

const moment = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
})

// Ce qui attend l'utilisateur, dans l'ordre d'urgence
const aFaire = computed(() => {
  if (!acc.value) return []
  const l = [
    { n: acc.value.validationsAFaire, texte: 'besoin(s) attendent votre validation', to: { path: '/besoins', query: { vue: 'a-valider' } }, icone: 'inbox' },
    { n: acc.value.tachesOnboarding, texte: "tâche(s) d'onboarding vous sont confiées", to: '/mes-taches', icone: 'clipboard' },
    { n: acc.value.evaluationsAVenir, texte: 'évaluation(s) de candidats à mener', to: '/mes-evaluations', icone: 'calendar' },
    { n: acc.value.inscriptionsAValider, texte: 'inscription(s) à valider', to: { path: '/admin/utilisateurs', query: { statut: 'EN_ATTENTE' } }, icone: 'key' },
    { n: acc.value.postesAValider, texte: 'création(s) de poste à valider', to: { path: '/postes', query: { etat: 'PROPOSE' } }, icone: 'briefcase' },
    { n: acc.value.demandesContratATraiter, texte: 'demande(s) de contrat à traiter', to: { path: '/contrats/demandes', query: { vue: 'a-traiter' } }, icone: 'file' },
    { n: acc.value.budgetsAValider, texte: 'proposition(s) de budget à valider', to: '/finance/budgets', icone: 'wallet' },
    { n: acc.value.grillesAValider, texte: 'grille salariale à valider', to: '/finance/grille', icone: 'list' },
    { n: acc.value.mesBesoinsEnCours, texte: 'de vos besoins sont en cours', to: { path: '/besoins', query: { vue: 'mes-demandes' } }, icone: 'list' },
  ]
  return l.filter((x) => x.n > 0)
})

onMounted(async () => {
  acc.value = await reportingApi.accueil()
  const taches = [
    besoinsApi.lister({ vue: 'a-valider' }).then((l) => { aValider.value = l.slice(0, 5) }).catch(() => {}),
    notificationsApi.lister(false, 6).then((l) => { notifs.value = l }).catch(() => {}),
  ]
  if (a('RH', 'DG', 'Finance', 'ADMIN')) taches.push(reportingApi.tableauDeBord().then((t) => { kpi.value = t.chiffres }).catch(() => {}))
  await Promise.all(taches)
})
</script>

<template>
  <Chargement v-if="!acc" />
  <template v-else>
    <header class="page-head">
      <div>
        <h1>{{ moment }}, {{ acc.nom }}</h1>
        <p>{{ acc.poste ? `${acc.poste} — ${acc.unite}` : 'Votre compte n\'est rattaché à aucun poste.' }}</p>
      </div>
      <div class="page-head-actions">
        <RouterLink v-if="a('Manager', 'RH', 'DG')" to="/besoins/nouveau" class="btn btn-primary"><Icon name="plus" /> Exprimer un besoin</RouterLink>
        <RouterLink v-if="a('RH')" to="/offres/besoins" class="btn btn-light">Publier une offre</RouterLink>
      </div>
    </header>

    <div v-if="route.query.refus" class="alert alert-warning">Vous n'avez pas accès à la page demandée ({{ route.query.refus }}).</div>
    <div v-for="d in acc.delegationsRecues" :key="d" class="alert alert-info">Vous validez actuellement par délégation pour {{ d }}.</div>

    <div v-if="kpi" class="kpis">
      <RouterLink to="/personnel" class="kpi"><div class="kpi-label">Effectif en poste</div><div class="kpi-value">{{ nombre(kpi.effectif) }}</div></RouterLink>
      <RouterLink :to="{ path: '/postes', query: { occupation: 'LIBRE', etat: 'ACTIF' } }" class="kpi"><div class="kpi-label">Postes vacants</div><div class="kpi-value">{{ nombre(kpi.postesVacants) }}</div><div class="kpi-note">sur {{ nombre(kpi.postesActifs) }} postes actifs</div></RouterLink>
      <RouterLink to="/offres" class="kpi"><div class="kpi-label">Offres publiées</div><div class="kpi-value">{{ nombre(kpi.offresPubliees) }}</div></RouterLink>
      <RouterLink to="/candidatures" class="kpi"><div class="kpi-label">Candidatures sur 30 jours</div><div class="kpi-value">{{ nombre(kpi.candidatures30j) }}</div></RouterLink>
      <RouterLink to="/contrats/echeances" class="kpi" :class="{ attention: kpi.contratsEcheance30j > 0 }"><div class="kpi-label">Contrats à échéance</div><div class="kpi-value">{{ nombre(kpi.contratsEcheance30j) }}</div><div class="kpi-note">dans les 30 jours</div></RouterLink>
    </div>

    <div class="split">
      <div class="stack">
        <section class="panel">
          <div class="panel-head"><h2>À faire</h2></div>
          <div v-if="!aFaire.length" class="panel-body muted">Rien ne vous attend pour le moment.</div>
          <div v-else class="list-group list-group-flush">
            <RouterLink v-for="x in aFaire" :key="x.texte" :to="x.to" class="list-group-item list-group-item-action d-flex align-items-center gap-3 text-decoration-none">
              <span class="avatar" style="border-radius:8px"><Icon :name="x.icone" style="width:16px;height:16px" /></span>
              <span><b style="font-size:1.0625rem">{{ x.n }}</b> {{ x.texte }}</span>
            </RouterLink>
          </div>
        </section>

        <section v-if="aValider.length" class="panel">
          <div class="panel-head"><h2>Besoins à valider</h2><RouterLink :to="{ path: '/besoins', query: { vue: 'a-valider' } }" class="small">Tout voir</RouterLink></div>
          <div class="table-responsive">
            <table class="table">
              <thead><tr><th>Référence</th><th>Unité</th><th>Postes</th><th>Souhaité le</th></tr></thead>
              <tbody>
                <tr v-for="b in aValider" :key="b.id" class="cliquable" @click="$router.push(`/besoins/${b.id}`)">
                  <td class="cell-main">{{ b.reference }}</td><td>{{ b.unite }}</td>
                  <td>{{ b.postes }} <span class="cell-sub">{{ b.effectif }} personne(s)</span></td>
                  <td>{{ dateFr(b.dateSouhaitee) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section class="panel">
        <div class="panel-head"><h2>Dernières nouvelles</h2></div>
        <div class="panel-body" style="padding-top:8px">
          <p v-if="!notifs.length" class="muted small mb-0">Aucune notification.</p>
          <ul v-else class="timeline">
            <li v-for="n in notifs" :key="n.id" :class="{ muted: n.lu }">
              <RouterLink v-if="n.lien" :to="n.lien" class="tl-body text-reset text-decoration-none">{{ n.message }}</RouterLink>
              <div v-else class="tl-body">{{ n.message }}</div>
              <div class="tl-meta">{{ depuis(n.dateCreation) }}</div>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </template>
</template>
