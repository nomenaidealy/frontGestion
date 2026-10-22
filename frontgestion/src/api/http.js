// Petit client HTTP commun : envoie le cookie de session et transforme les erreurs du back en Error.
// Réutilisable par tous les modules.

export class NonConnecteError extends Error {
  constructor() {
    super("Vous n'êtes pas connecté")
    this.name = 'NonConnecteError'
  }
}

async function request(method, url, body, { asText = false } = {}) {
  // Un FormData (upload de fichier) part tel quel : le navigateur ajoute lui-même
  // "multipart/form-data; boundary=...". Le reste est envoyé en JSON.
  const estFormData = body instanceof FormData

  const res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: body !== undefined && !estFormData ? { 'Content-Type': 'application/json' } : {},
    body: body === undefined ? undefined : (estFormData ? body : JSON.stringify(body)),
  })

  // Non connecté : l'AuthInterceptor du back redirige vers la page de login HTML
  if (res.redirected && res.url.includes('/auth/login')) throw new NonConnecteError()
  if (res.status === 401) throw new NonConnecteError()

  if (!res.ok) {
    let message = `Erreur ${res.status}`
    let champs = {}
    try {
      const data = await res.json()
      if (data.error) message = data.error
      else if (data.message) message = data.message
      if (data.champs) champs = data.champs
    } catch { /* corps non JSON */ }
    const erreur = new Error(message)
    erreur.status = res.status // ex. 403 (droits), 409 (action impossible dans l'état actuel)
    erreur.champs = champs     // erreurs par champ renvoyées par le back, ex. { commentaire: '…' }
    throw erreur
  }

  if (asText) return res.text()
  if (res.status === 204) return null
  return res.json()
}

export const http = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  postText: (url, body) => request('POST', url, body, { asText: true }),
  put: (url, body) => request('PUT', url, body),
  del: (url) => request('DELETE', url),
}

/** Utilisateur connecté (endpoint de P1), ou null. */
export async function getSession() {
  const res = await fetch('/auth/session', { credentials: 'same-origin' })
  if (!res.ok) return null
  const data = await res.json()
  return data.authenticated ? data.user : null
}