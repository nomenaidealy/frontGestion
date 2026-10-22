// Petit client HTTP commun : envoie le cookie de session et transforme les erreurs du back en Error.
// Réutilisable par tous les modules.

export class NonConnecteError extends Error {
  constructor() {
    super('Vous n\'êtes pas connecté')
    this.name = 'NonConnecteError'
  }
}

async function request(method, url, body, { asText = false } = {}) {
  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Non connecté : l'AuthInterceptor du back redirige vers la page de login HTML
  if (res.redirected && res.url.includes('/auth/login')) throw new NonConnecteError()
  if (res.status === 401) throw new NonConnecteError()

  if (!res.ok) {
    let message = `Erreur ${res.status}`
    try {
      const data = await res.json()
      if (data.error) message = data.error
      else if (data.message) message = data.message
    } catch { /* corps non JSON */ }
    throw new Error(message)
  }

  if (asText) return res.text()
  if (res.status === 204) return null
  return res.json()
}

export const http = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  postText: (url, body) => request('POST', url, body, { asText: true }),
}

/** Utilisateur connecté (endpoint de P1), ou null. */
export async function getSession() {
  const res = await fetch('/auth/session', { credentials: 'same-origin' })
  if (!res.ok) return null
  const data = await res.json()
  return data.authenticated ? data.user : null
}

const estFormData = body instanceof FormData
const res = await fetch(url, {
  method,
  credentials: 'same-origin',
  headers: body !== undefined && !estFormData ? { 'Content-Type': 'application/json' } : {},
  body: body === undefined ? undefined : (estFormData ? body : JSON.stringify(body)),
})