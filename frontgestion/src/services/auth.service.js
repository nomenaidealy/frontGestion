const API = '/api'   // passe par le proxy Vite

export async function login(login, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',                  // ← envoie/stocke les cookies de session
    body: JSON.stringify({ login, password }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || 'Identifiants incorrects')
  }
  return res.json()                          // { id, login, idEmploye, roles }
}

export async function logout() {
  await fetch(`${API}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}

/** Renvoie l'utilisateur courant ou null s'il n'y a pas de session. */
export async function getSession() {
  const res = await fetch(`${API}/auth/session`, { credentials: 'include' })
  if (!res.ok) return null
  const data = await res.json()
  return data.authenticated ? data.user : null
}