
// Chaque membre ajoute ses routes ici.
// ⚠ Ne pas utiliser de chemins qui commencent par /api, /auth, /uploads : ils partent vers le back (vite.config.js).
// Le routeur associe une URL à une vue (un composant « page »).
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import LoginView from '../components/LoginView.vue'
import BesoinsView from '../views/besoins/BesoinsView.vue'
import PostesProposesView from '../views/PostesProposesView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },

  // P4 – Offres d'emploi (RH)
  { path: '/offres', name: 'offres', component: () => import('@/views/offres/OffresList.vue') },
  { path: '/offres/besoins', name: 'offres-besoins', component: () => import('@/views/offres/BesoinsOuverts.vue') },
  // Cible du bouton « Ouvrir Recrutement » (P3) : /offres/nouvelle?idBesoin=ID
  { path: '/offres/nouvelle', name: 'offre-nouvelle', component: () => import('@/views/offres/OffreForm.vue') },

  // P5 – Candidatures, côté public (sans connexion). /offres est déjà pris par P4 (offres côté RH).
  // meta.public : pages sans connexion, à laisser passer par la garde du routeur prévue par P1.
  { path: '/emplois', name: 'emplois', component: () => import('@/views/candidatures/OffresPubliques.vue'), meta: { public: true } },
  { path: '/emplois/:id/candidater', name: 'candidater', component: () => import('@/views/candidatures/CandidatureForm.vue'), props: true, meta: { public: true } },

  // P5 – Candidatures reçues (RH)
  { path: '/candidatures', name: 'candidatures', component: () => import('@/views/candidatures/CandidaturesRecues.vue') },

  // P2 – Besoins et postes
{ path: '/besoins/nouveau', name: 'besoin-nouveau', component: () => import('@/views/besoins/BesoinFormView.vue') },
{ path: '/postes/demande', name: 'poste-demande', component: () => import('@/views/besoins/PosteDemandeView.vue') },
  { path: '/candidatures/niveaux', name: 'niveaux-selection', component: () => import('@/views/candidatures/NiveauxSelection.vue') },

  // P5 – Espace évaluateur (tout utilisateur connecté)
  { path: '/mes-evaluations', name: 'mes-evaluations', component: () => import('@/views/candidatures/MesEvaluations.vue') },
  // meta.public : accessible sans être connecté
  { path: '/login', name: 'login', component: LoginView, meta: { public: true } },

  { path: '/besoins', name: 'besoins', component: BesoinsView },

  { path: '/postes/proposes', name: 'postes-proposes', component: PostesProposesView },

  // Toute autre URL → page 404 (à mettre en dernier)
  { path: '/:pathMatch(.*)*', name: 'introuvable', component: NotFoundView }

]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const { isAuthenticated, initialized, loadSession } = useAuth()

  if (!initialized.value) await loadSession()

  if (!to.meta.public && !isAuthenticated.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && isAuthenticated.value) {
    return { path: '/' }
  }
})

export default router
