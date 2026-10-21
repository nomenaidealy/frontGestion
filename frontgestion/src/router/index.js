// Le routeur associe une URL à une vue (un composant « page »).
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import LoginView from '../components/LoginView.vue'
import BesoinsView from '../views/besoins/BesoinsView.vue'
import PostesProposesView from '../views/PostesProposesView.vue'
import NotFoundView from '../views/NotFoundView.vue'

const routes = [
  // meta.public : accessible sans être connecté
  { path: '/login', name: 'login', component: LoginView, meta: { public: true } },

  { path: '/', name: 'besoins', component: BesoinsView },

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
