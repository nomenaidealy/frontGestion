import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'

// Utilisateur connecté, partagé par toute l'application.
const currentUser = ref(null)
const initialized = ref(false)

export function useAuth() {
  const isAuthenticated = computed(() => currentUser.value !== null)
  const roles = computed(() => currentUser.value?.roles ?? [])
  /** a('RH', 'DG') : l'utilisateur a au moins un de ces rôles */
  const a = (...r) => r.some((x) => roles.value.includes(x))

  async function login(identifiant, motDePasse) {
    const res = await authApi.login(identifiant, motDePasse)
    currentUser.value = res?.user ?? res
    return currentUser.value
  }

  async function logout() {
    try { await authApi.logout() } catch { /* session déjà close */ }
    currentUser.value = null
  }

  async function loadSession() {
    try {
      currentUser.value = await authApi.session()
    } catch {
      currentUser.value = null
    } finally {
      initialized.value = true
    }
  }

  return { currentUser, isAuthenticated, initialized, roles, a, login, logout, loadSession }
}
