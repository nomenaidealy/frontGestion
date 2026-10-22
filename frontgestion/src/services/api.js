const baseUrl = import.meta.env.VITE_API_URL || ''

export const apiConfig = { baseUrl }

// Erreur API : garde le code HTTP (401 = session expirée, 409 = poste déjà traité...)
export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, options = {}) {
  const { headers, body, ...reste } = options

  let response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      // Authentification par session : envoie et stocke le cookie
      credentials: 'include',
      ...reste,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body && typeof body !== 'string' ? JSON.stringify(body) : body,
    })
  } catch {
    throw new ApiError('Impossible de joindre le serveur.', 0)
  }

  // Sans session, le backend répond par une redirection vers /auth/login
  // (fetch la suit et renvoie la page de login : ce n'est pas du JSON)
  if (response.redirected && response.url.includes('/auth/login')) {
    throw new ApiError('Session expirée. Veuillez vous reconnecter.', 401)
  }

  if (!response.ok) {
    let message = `Erreur API (${response.status})`
    try {
      message = (await response.json()).message || message
    } catch {
      /* réponse sans JSON */
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return null
  return response.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
