<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { reportingApi } from '@/api/reporting'
import { initiales } from '@/utils/format'
import Icon from '@/components/ui/Icon.vue'
import Cloche from '@/components/ui/Cloche.vue'

const route = useRoute()
const router = useRouter()
const { currentUser: user, a, logout } = useAuth()

const menuOuvert = ref(false)        // tiroir sur mobile
const menuUtilisateur = ref(false)
// barre latérale repliée (icônes seules) sur grand écran ; préférence gardée dans ce navigateur
const CLE_REPLIE = 'sirh.menuReplie'
const replie = ref(false)
try { replie.value = localStorage.getItem(CLE_REPLIE) === '1' } catch { /* stockage indisponible */ }
function basculerReplie() {
  replie.value = !replie.value
  try { localStorage.setItem(CLE_REPLIE, replie.value ? '1' : '0') } catch { /* sans effet */ }
}
function boutonMenu() {
  if (window.matchMedia('(max-width: 991.98px)').matches) menuOuvert.value = true
  else basculerReplie()
}
const compteurs = ref({})            // nombres affichés dans la barre latérale (ce qui attend l'utilisateur)

async function rafraichirCompteurs() {
  try { compteurs.value = await reportingApi.accueil() } catch { /* compteurs facultatifs */ }
}

// Menu organisé par domaine ; chaque entrée n'apparaît qu'aux rôles concernés.
const groupes = computed(() => [
  {
    titre: null,
    liens: [
      { to: '/', icone: 'home', libelle: 'Accueil', exact: true },
      user.value?.idEmploye && { to: '/mon-contrat', icone: 'file', libelle: 'Mon contrat' },
      user.value?.idEmploye && { to: '/ma-fiche-poste', icone: 'briefcase', libelle: 'Ma fiche de poste' },
      a('Manager', 'RH', 'DG', 'Finance', 'ADMIN') && { to: '/contrats/demandes', icone: 'route', libelle: 'Demandes de contrat', compte: compteurs.value.demandesContratATraiter },
      { to: '/mes-taches', icone: 'clipboard', libelle: 'Mes tâches', compte: compteurs.value.tachesOnboarding },
      { to: '/mes-evaluations', icone: 'calendar', libelle: 'Mes évaluations', compte: compteurs.value.evaluationsAVenir },
    ],
  },
  {
    titre: 'Besoins et postes',
    liens: [
      { to: '/besoins', icone: 'inbox', libelle: 'Besoins', compte: compteurs.value.validationsAFaire },
      a('Manager', 'RH', 'DG') && { to: '/besoins/nouveau', icone: 'plus', libelle: 'Exprimer un besoin' },
      { to: '/postes', icone: 'briefcase', libelle: 'Postes', compte: compteurs.value.postesAValider },
      { to: '/organigramme', icone: 'tree', libelle: 'Organigramme' },
      { to: '/delegations', icone: 'swap', libelle: 'Délégations' },
    ],
  },
  a('RH') && {
    titre: 'Recrutement',
    liens: [
      { to: '/offres', icone: 'flag', libelle: "Offres d'emploi" },
      { to: '/candidatures', icone: 'users', libelle: 'Candidatures' },
      { to: '/propositions', icone: 'send', libelle: 'Propositions' },
      { to: '/candidatures/niveaux', icone: 'route', libelle: 'Niveaux de sélection' },
    ],
  },
  a('RH', 'DG', 'ADMIN') && {
    titre: 'Personnel',
    liens: [
      { to: '/personnel', icone: 'user', libelle: 'Employés' },
      a('RH') && { to: '/contrats/echeances', icone: 'file', libelle: 'Contrats à échéance' },
      { to: '/onboarding', icone: 'check', libelle: 'Onboarding' },
    ],
  },
  a('RH', 'DG', 'Finance', 'ADMIN') && {
    titre: 'Pilotage',
    liens: [
      { to: '/tableau-de-bord', icone: 'chart', libelle: 'Tableau de bord' },
      { to: '/finance/budgets', icone: 'wallet', libelle: 'Budgets', compte: compteurs.value.budgetsAValider },
      { to: '/finance/grille', icone: 'list', libelle: 'Grille salariale', compte: compteurs.value.grillesAValider },
    ],
  },
  a('ADMIN', 'RH', 'DG') && {
    titre: 'Administration',
    liens: [
      { to: '/fiches-poste', icone: 'file', libelle: 'Fiches de poste' },
      a('ADMIN') && { to: '/admin/utilisateurs', icone: 'key', libelle: 'Utilisateurs', compte: compteurs.value.inscriptionsAValider },
      { to: '/admin/referentiels', icone: 'settings', libelle: 'Référentiels' },
      { to: '/admin/unites', icone: 'building', libelle: 'Unités' },
      { to: '/admin/circuit', icone: 'route', libelle: 'Circuit de validation' },
      a('ADMIN', 'RH') && { to: '/admin/onboarding', icone: 'clipboard', libelle: "Modèles d'onboarding" },
      a('ADMIN', 'DG') && { to: '/admin/audit', icone: 'shield', libelle: "Journal d'audit" },
    ],
  },
].filter(Boolean).map((g) => ({ ...g, liens: g.liens.filter(Boolean) })).filter((g) => g.liens.length))

const roleAffiche = computed(() => (user.value?.roles || []).filter((r) => r !== 'Employe').join(', ') || 'Employé')

watch(() => route.fullPath, () => {
  menuOuvert.value = false
  menuUtilisateur.value = false
  rafraichirCompteurs()
})

const fermerMenu = (e) => { if (!e.target.closest('.user-zone')) menuUtilisateur.value = false }
onMounted(() => { rafraichirCompteurs(); document.addEventListener('click', fermerMenu) })
onBeforeUnmount(() => document.removeEventListener('click', fermerMenu))

async function deconnecter() {
  await logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="shell" :class="{ 'menu-ouvert': menuOuvert, replie }">
    <aside class="shell-side" aria-label="Menu principal">
      <RouterLink to="/" class="side-brand">
        <span class="side-brand-mark">RH</span>
        <span><b>SIRH</b><small>Gestion des ressources humaines</small></span>
      </RouterLink>

      <nav>
        <div v-for="(g, i) in groupes" :key="i" class="side-group">
          <div v-if="g.titre" class="side-group-title">{{ g.titre }}</div>
          <RouterLink v-for="l in g.liens" :key="l.to" :to="l.to" class="side-link" :title="replie ? l.libelle : null">
            <Icon :name="l.icone" />
            <span>{{ l.libelle }}</span>
            <span v-if="l.compte" class="side-count" :aria-label="`${l.compte} en attente`">{{ l.compte }}</span>
          </RouterLink>
        </div>
      </nav>

      <div class="side-foot">
        <a href="/emplois" target="_blank" rel="noopener" class="side-link" :title="replie ? 'Site carrières' : null">
          <Icon name="globe" /> <span>Site carrières</span>
        </a>
        <button type="button" class="side-toggle" :aria-label="replie ? 'Déplier le menu' : 'Replier le menu'" @click="basculerReplie">
          <Icon name="back" /> <span>Replier le menu</span>
        </button>
      </div>
    </aside>
    <div class="scrim" @click="menuOuvert = false"></div>

    <div class="shell-main">
      <header class="topbar">
        <button type="button" class="icon-btn topbar-burger" aria-label="Afficher ou replier le menu" @click="boutonMenu">
          <Icon name="menu" />
        </button>
        <div class="topbar-crumbs">
          <template v-if="compteurs.unite">{{ compteurs.unite }} · </template><b>{{ compteurs.poste || roleAffiche }}</b>
        </div>
        <div class="topbar-actions">
          <Cloche @lu="rafraichirCompteurs" />
          <div class="user-zone" style="position:relative">
            <button type="button" class="user-chip" :aria-expanded="menuUtilisateur" @click="menuUtilisateur = !menuUtilisateur">
              <span class="avatar">{{ initiales(user?.nomComplet || user?.login) }}</span>
              <span class="user-txt"><b>{{ user?.nomComplet || user?.login }}</b><small>{{ roleAffiche }}</small></span>
            </button>
            <div v-if="menuUtilisateur" class="menu">
              <RouterLink to="/profil">Mon profil et mot de passe</RouterLink>
              <RouterLink to="/delegations">Mes délégations</RouterLink>
              <hr>
              <button type="button" @click="deconnecter">Se déconnecter</button>
            </div>
          </div>
        </div>
      </header>

      <main class="page" :class="route.meta.etroit ? 'page-narrow' : ''">
        <RouterView />
      </main>
    </div>
  </div>
</template>
