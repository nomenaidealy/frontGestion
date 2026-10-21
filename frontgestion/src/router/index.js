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
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
