import { createRouter, createWebHistory } from 'vue-router'

// Chaque membre ajoute ses routes ici.
// ⚠ Ne pas utiliser de chemins qui commencent par /api, /auth, /uploads : ils partent vers le back (vite.config.js).
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
  { path: '/candidatures/niveaux', name: 'niveaux-selection', component: () => import('@/views/candidatures/NiveauxSelection.vue') },
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
