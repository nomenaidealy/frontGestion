// Routes du SIRH.
// meta.public : accessible sans connexion ; meta.layout : 'auth' ou 'public' (sinon : application avec menu) ;
// meta.roles : rôles autorisés (sinon : tout utilisateur connecté).
// ⚠ Pas de chemin commençant par /api, /auth ou /uploads : ils partent vers le back (vite.config.js).
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const vues = import.meta.glob('../views/**/*.vue')
const v = (chemin) => {
  const vue = vues[`../views/${chemin}.vue`]
  if (!vue) throw new Error(`Vue introuvable : ${chemin}`)
  return vue
}
const RH = ['RH']

const routes = [
  // ------------------------------------------------ connexion, inscription
  { path: '/login', name: 'login', component: v('auth/Connexion'), meta: { public: true, layout: 'auth' } },
  { path: '/inscription', name: 'inscription', component: v('auth/Inscription'), meta: { public: true, layout: 'auth' } },

  // ------------------------------------------------ espace public (candidats)
  { path: '/emplois', name: 'emplois', component: v('candidatures/OffresPubliques'), meta: { public: true, layout: 'public' } },
  { path: '/emplois/:id/candidater', name: 'candidater', component: v('candidatures/CandidatureForm'), props: true, meta: { public: true, layout: 'public' } },
  { path: '/proposition/:jeton', name: 'proposition-reponse', component: v('embauche/PropositionReponse'), props: true, meta: { public: true, layout: 'public' } },

  // ------------------------------------------------ espace personnel
  { path: '/', name: 'home', component: v('Accueil') },
  { path: '/profil', name: 'profil', component: v('auth/Profil'), meta: { etroit: true } },
  { path: '/mes-taches', name: 'mes-taches', component: v('onboarding/MesTaches') },
  { path: '/mes-evaluations', name: 'mes-evaluations', component: v('candidatures/MesEvaluations') },
  { path: '/delegations', name: 'delegations', component: v('Delegations') },

  // ------------------------------------------------ besoins et postes
  { path: '/besoins', name: 'besoins', component: v('besoins/BesoinsListe') },
  { path: '/besoins/nouveau', name: 'besoin-nouveau', component: v('besoins/BesoinNouveau'), meta: { roles: ['Manager', 'RH', 'DG'] } },
  { path: '/besoins/:id(\\d+)', name: 'besoin-fiche', component: v('besoins/BesoinFiche'), props: true },
  { path: '/postes', name: 'postes', component: v('postes/PostesListe') },
  { path: '/postes/demande', name: 'poste-demande', component: v('postes/PosteDemande'), meta: { etroit: true, roles: ['Manager', 'RH', 'DG'] } },
  { path: '/postes/:id(\\d+)', name: 'poste-fiche', component: v('postes/PosteFiche'), props: true },
  { path: '/organigramme', name: 'organigramme', component: v('postes/Organigramme') },

  // ------------------------------------------------ recrutement (RH)
  { path: '/offres', name: 'offres', component: v('offres/OffresList'), meta: { roles: RH } },
  { path: '/offres/besoins', name: 'offres-besoins', component: v('offres/BesoinsOuverts'), meta: { roles: RH } },
  { path: '/offres/nouvelle', name: 'offre-nouvelle', component: v('offres/OffreForm'), meta: { roles: RH, etroit: true } },
  { path: '/candidatures', name: 'candidatures', component: v('candidatures/CandidaturesRecues'), meta: { roles: RH } },
  { path: '/candidatures/niveaux', name: 'niveaux-selection', component: v('candidatures/NiveauxSelection'), meta: { roles: RH, etroit: true } },
  { path: '/propositions', name: 'propositions', component: v('embauche/PropositionsRh'), meta: { roles: RH } },
  { path: '/propositions/nouvelle', name: 'proposition-nouvelle', component: v('embauche/PropositionNouvelle'), meta: { roles: RH, etroit: true } },
  { path: '/propositions/:id(\\d+)', name: 'proposition-fiche', component: v('embauche/PropositionFiche'), props: true, meta: { roles: RH } },

  // ------------------------------------------------ personnel
  { path: '/personnel', name: 'personnel', component: v('personnel/PersonnelListe'), meta: { roles: ['RH', 'DG', 'ADMIN'] } },
  { path: '/personnel/nouveau', name: 'employe-nouveau', component: v('personnel/EmployeNouveau'), meta: { roles: RH, etroit: true } },
  { path: '/personnel/:id(\\d+)', name: 'employe-fiche', component: v('personnel/EmployeDossier'), props: true, meta: { roles: ['RH', 'DG', 'ADMIN'] } },
  { path: '/contrats/echeances', name: 'contrats-echeances', component: v('contrat/ContratsEcheances'), meta: { roles: RH } },
  { path: '/contrats/demandes', name: 'demandes-contrat', component: v('contrat/DemandesContrat'), meta: { roles: ['RH', 'DG', 'Finance', 'ADMIN', 'Manager'] } },
  { path: '/contrats/demandes/:id(\\d+)', name: 'demande-contrat-fiche', component: v('contrat/DemandeContratFiche'), props: true },
  { path: '/mon-contrat', name: 'mon-contrat', component: v('contrat/MonContrat') },
  { path: '/contrats/:id(\\d+)', name: 'contrat-fiche', component: v('contrat/ContratFiche'), props: true, meta: { roles: ['RH', 'DG'] } },
  { path: '/onboarding', name: 'onboarding', component: v('onboarding/OnboardingListe'), meta: { roles: ['RH', 'DG', 'ADMIN', 'Manager'] } },
  { path: '/onboarding/:id(\\d+)', name: 'onboarding-fiche', component: v('onboarding/OnboardingFiche'), props: true },

  // ------------------------------------------------ pilotage
  { path: '/tableau-de-bord', name: 'tableau-de-bord', component: v('pilotage/TableauDeBord'), meta: { roles: ['RH', 'DG', 'Finance', 'ADMIN'] } },
  { path: '/finance/budgets', name: 'budgets', component: v('pilotage/Budgets'), meta: { roles: ['RH', 'DG', 'Finance', 'ADMIN'] } },
  { path: '/finance/grille', name: 'grille', component: v('pilotage/GrilleSalariale'), meta: { roles: ['RH', 'DG', 'Finance', 'ADMIN'] } },

  // ------------------------------------------------ administration
  { path: '/admin/utilisateurs', name: 'utilisateurs', component: v('admin/Utilisateurs'), meta: { roles: ['ADMIN'] } },
  { path: '/admin/referentiels', name: 'referentiels', component: v('admin/Referentiels'), meta: { roles: ['ADMIN', 'RH', 'DG'] } },
  { path: '/admin/unites', name: 'unites', component: v('admin/Unites'), meta: { roles: ['ADMIN', 'RH', 'DG'] } },
  { path: '/admin/circuit', name: 'circuit', component: v('admin/CircuitValidation'), meta: { roles: ['ADMIN', 'RH', 'DG'] } },
  { path: '/admin/onboarding', name: 'modeles-onboarding', component: v('admin/ModelesOnboarding'), meta: { roles: ['ADMIN', 'RH'] } },
  { path: '/admin/audit', name: 'audit', component: v('admin/JournalAudit'), meta: { roles: ['ADMIN', 'DG'] } },

  // anciens liens (notifications, favoris)
  { path: '/rh/propositions/:id(\\d+)', redirect: (to) => `/propositions/${to.params.id}` },
  { path: '/validations/:id(\\d+)', redirect: (to) => `/besoins/${to.params.id}` },
  { path: '/postes/proposes', redirect: { path: '/postes', query: { etat: 'PROPOSE' } } },
  { path: '/onboarding/mes-taches', redirect: '/mes-taches' },
  { path: '/contrats/employe/:idEmploye(\\d+)', redirect: (to) => `/personnel/${to.params.idEmploye}` },

  { path: '/:pathMatch(.*)*', name: 'introuvable', component: v('Introuvable') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const { isAuthenticated, initialized, loadSession, a } = useAuth()
  if (!initialized.value) await loadSession()

  if (!to.meta.public && !isAuthenticated.value) {
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }
  if ((to.name === 'login' || to.name === 'inscription') && isAuthenticated.value) return { path: '/' }
  if (to.meta.roles && !a(...to.meta.roles)) return { name: 'home', query: { refus: to.fullPath } }
})

export default router
