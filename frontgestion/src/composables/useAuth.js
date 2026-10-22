import { ref, computed } from 'vue'
import * as authService from '@/services/auth.service'

const currentUser  = ref(null)
const initialized  = ref(false)

export function useAuth() {
  const isAuthenticated = computed(() => currentUser.value !== null)

  async function login(login, password) {
    // le back répond { authenticated, user } : on ne garde que l'utilisateur (login, roles…)
    const res = await authService.login(login, password)
    currentUser.value = res?.user ?? res
    return currentUser.value
  }

  async function logout() {
    try { await authService.logout() }
    finally { currentUser.value = null }
  }

  async function loadSession() {
    try {
      currentUser.value = await authService.getSession()
    } catch {
      currentUser.value = null
    } finally {
      initialized.value = true
    }
  }

  return { currentUser, isAuthenticated, initialized, login, logout, loadSession }
}