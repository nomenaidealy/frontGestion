// Connexion, inscription, profil (AuthController, hors /api)
import { http } from './http'

export const authApi = {
  login: (login, password) => http.post('/auth/login', { login, password }),
  logout: () => http.post('/auth/logout'),
  /** Utilisateur connecté ou null (401 = pas de session). */
  session: async () => {
    const res = await fetch('/auth/session', { credentials: 'same-origin' })
    if (!res.ok) return null
    const data = await res.json()
    return data.authenticated ? data.user : null
  },
  inscription: (form) => http.post('/auth/inscription', form),
  profil: () => http.get('/auth/profil'),
  modifierProfil: (form) => http.put('/auth/profil', form),
  motDePasse: (form) => http.post('/auth/mot-de-passe', form),
}
