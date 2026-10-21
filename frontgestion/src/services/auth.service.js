import { api, ApiError } from './api'

export async function login(identifiant, motDePasse) {
  try {
    return await api.post('/auth/login', { login: identifiant, password: motDePasse })
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      throw new Error('Identifiants incorrects')
    }
    throw e
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout')
  } catch {
  }
}

export async function getSession() {
  try {
    const data = await api.get('/auth/session')
    return data?.authenticated ? data.user : null
  } catch {
    return null
  }
}