// P4 – Appels API des offres d'emploi (OffreEmploiApiController côté back)
import { http } from './http'

const BASE = '/api/rh/offres'

export const offresApi = {
  liste: () => http.get(BASE),
  besoinsOuverts: () => http.get(`${BASE}/besoins`),
  nouvelle: (idBesoin) => http.get(`${BASE}/nouvelle?idBesoin=${encodeURIComponent(idBesoin)}`),
  creer: (form) => http.post(BASE, nettoyer(form)),
  apercu: (form) => http.postText(`${BASE}/apercu`, nettoyer(form)),
  publier: (id) => http.post(`${BASE}/${id}/publier`),
  cloturer: (id) => http.post(`${BASE}/${id}/cloturer`),
}

// Les champs vides deviennent null (ex. type de contrat facultatif)
function nettoyer(form) {
  const f = { ...form }
  for (const k of Object.keys(f)) if (f[k] === '') f[k] = null
  return f
}
