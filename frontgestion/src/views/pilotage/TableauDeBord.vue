<script setup>
import { computed, onMounted, ref } from 'vue'
import { reportingApi } from '@/api/reporting'
import { ariaryCourt, nombre, TYPES_UNITE } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Icon from '@/components/ui/Icon.vue'

const t = ref(null)
onMounted(async () => { t.value = await reportingApi.tableauDeBord() })
const c = computed(() => t.value?.chiffres || {})
const max = (l) => Math.max(1, ...l.map((x) => Number(x.valeur)))
const pct = (v, l) => `${(Number(v) * 100) / max(l)}%`
const consommation = computed(() => {
  const b = Number(c.value.budgetAnnuel), m = Number(c.value.masseSalarialeAnnuelle)
  return b ? Math.round((m * 100) / b) : null
})
const moisCourt = (s) => new Date(s + '-01T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })
</script>

<template>
  <PageHeader titre="Tableau de bord RH" sous-titre="Effectifs, recrutement, contrats et masse salariale, calculés en direct.">
    <div class="d-flex gap-2 flex-wrap">
      <a v-for="[k, l] in [['personnel', 'Personnel'], ['besoins', 'Besoins'], ['candidatures', 'Candidatures'], ['contrats', 'Contrats']]" :key="k"
         :href="reportingApi.urlExport(k)" class="btn btn-light btn-sm"><Icon name="download" /> {{ l }}</a>
    </div>
  </PageHeader>
  <Chargement v-if="!t" />
  <template v-else>
    <div class="kpis">
      <div class="kpi"><div class="kpi-label">Effectif en poste</div><div class="kpi-value">{{ nombre(c.effectif) }}</div></div>
      <div class="kpi"><div class="kpi-label">Taux d'occupation des postes</div><div class="kpi-value">{{ nombre(c.tauxOccupation) }} %</div><div class="kpi-note">{{ c.postesVacants }} vacant(s) sur {{ c.postesActifs }}</div></div>
      <div class="kpi"><div class="kpi-label">Délai moyen de recrutement</div><div class="kpi-value">{{ c.delaiMoyenRecrutementJours == null ? '—' : `${nombre(c.delaiMoyenRecrutementJours)} j` }}</div><div class="kpi-note">de la demande à l'acceptation</div></div>
      <div class="kpi"><div class="kpi-label">Masse salariale annuelle</div><div class="kpi-value">{{ ariaryCourt(c.masseSalarialeAnnuelle) }}</div><div class="kpi-note">{{ consommation === null ? 'pas de budget' : `${consommation} % du budget ${ariaryCourt(c.budgetAnnuel)}` }}</div></div>
      <div class="kpi" :class="{ attention: c.propositionsEnAttente > 0 }"><div class="kpi-label">Propositions en attente</div><div class="kpi-value">{{ c.propositionsEnAttente }}</div></div>
      <div class="kpi" :class="{ attention: c.tachesOnboardingEnRetard > 0 }"><div class="kpi-label">Onboardings en cours</div><div class="kpi-value">{{ c.onboardingsEnCours }}</div><div class="kpi-note">{{ c.tachesOnboardingEnRetard }} tâche(s) en retard</div></div>
    </div>

    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><h2>Recrutement : de la candidature à l'embauche</h2></div>
        <div class="panel-body bars">
          <div v-for="x in t.entonnoir" :key="x.libelle" class="bar-row">
            <span>{{ x.libelle }}</span><span class="bar-track"><span class="bar-fill" :style="{ width: pct(x.valeur, t.entonnoir), display: 'block' }"></span></span><b>{{ nombre(x.valeur) }}</b>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Embauches sur 12 mois</h2></div>
        <div class="panel-body">
          <div class="cols">
            <div v-for="x in t.embauchesParMois" :key="x.libelle" class="col-bar" :title="`${x.libelle} : ${x.valeur}`">
              <b v-if="Number(x.valeur)" style="color:var(--sirh-ink)">{{ x.valeur }}</b>
              <span class="b" :style="{ height: pct(x.valeur, t.embauchesParMois) }"></span>
              <span>{{ moisCourt(x.libelle) }}</span>
            </div>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Besoins par état</h2></div>
        <div class="panel-body bars">
          <div v-for="x in t.besoinsParEtat" :key="x.libelle" class="bar-row">
            <span>{{ x.libelle }}</span><span class="bar-track"><span class="bar-fill" :style="{ width: pct(x.valeur, t.besoinsParEtat), display: 'block' }"></span></span><b>{{ nombre(x.valeur) }}</b>
          </div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Effectif par catégorie et contrats en cours</h2></div>
        <div class="panel-body bars">
          <div v-for="x in t.effectifParCategorie" :key="x.libelle" class="bar-row">
            <span>{{ x.libelle }}</span><span class="bar-track"><span class="bar-fill" :style="{ width: pct(x.valeur, t.effectifParCategorie), display: 'block' }"></span></span><b>{{ nombre(x.valeur) }}</b>
          </div>
          <hr style="margin:8px 0">
          <div v-for="x in t.contratsParType" :key="x.libelle" class="bar-row">
            <span>Contrats {{ x.libelle }}</span><span class="bar-track"><span class="bar-fill" :style="{ width: pct(x.valeur, t.contratsParType), display: 'block', background: '#e9c46a' }"></span></span><b>{{ nombre(x.valeur) }}</b>
          </div>
          <p v-if="!t.contratsParType.length" class="small muted mb-0">Aucun contrat en cours.</p>
        </div>
      </section>
    </div>

    <section class="panel" style="margin-top:18px">
      <div class="panel-head"><h2>Par unité</h2></div>
      <div class="table-responsive">
        <table class="table">
          <thead><tr><th>Unité</th><th class="num">En poste</th><th class="num">Postes</th><th class="num">Vacants</th><th class="num">Masse annuelle</th><th class="num">Besoins en cours</th><th class="num">Budget</th></tr></thead>
          <tbody>
            <tr v-for="u in t.unites" :key="u.id">
              <td><span class="cell-main">{{ u.libelle }}</span><span class="cell-sub">{{ TYPES_UNITE[u.type] }} · {{ u.code }}</span></td>
              <td class="num">{{ u.effectif }}</td><td class="num">{{ u.postes }}</td>
              <td class="num" :class="{ 'text-warning fw-semibold': u.vacants }">{{ u.vacants }}</td>
              <td class="num">{{ ariaryCourt(u.masseAnnuelle) }}</td><td class="num">{{ ariaryCourt(u.besoinsEnCours) }}</td>
              <td class="num">{{ u.budget ? ariaryCourt(u.budget) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </template>
</template>
