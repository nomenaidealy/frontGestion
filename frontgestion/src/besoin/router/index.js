import { createRouter, createWebHistory } from 'vue-router'
import PosteDemandeView from '../views/PosteDemandeView.vue'
import BesoinFormView from '../views/BesoinFormView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/besoins' },
    { path: '/besoins/nouveau', component: BesoinFormView },
    { path: '/postes/demande', component: PosteDemandeView },
  ]
})