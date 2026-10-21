import { ref, computed } from 'vue'
import * as authService from '@/services/auth.service'

const currentUser  = ref(null)
const initialized  = ref(false)

export function useAuth() {
  const isAuthenticated = computed(() => currentUser.value !== null)

  async function login(login, password) {
    const user = await authService.login(login, password)
    currentUser.value = user
    return user
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