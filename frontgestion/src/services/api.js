const baseUrl = import.meta.env.VITE_API_URL || ''
export const apiConfig = { baseUrl }
async function request(path, options = {}) {
    const response = await fetch(`${baseUrl}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options, body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body })
    if (!response.ok) { let message = `Erreur API (${response.status})`; try { message = (await response.json()).message || message } catch { /* réponse sans JSON */ } throw new Error(message) }
    if (response.status === 204) return null
    return response.json()
}
export const api = { get: (path) => request(path), post: (path, body) => request(path, { method: 'POST', body }), put: (path, body) => request(path, { method: 'PUT', body }), delete: (path) => request(path, { method: 'DELETE' }) }