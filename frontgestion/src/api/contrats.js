// Contrats (ContratController)
import { http } from './http'

const BASE = '/api/rh/contrats'
const nettoyer = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === '' ? null : v]))

export const contratsApi = {
  employe: (idEmploye) => http.get(`${BASE}/employe/${idEmploye}`),
  fiche: (id) => http.get(`${BASE}/${id}`),
  types: () => http.get(`${BASE}/types`),
  echeances: (jours = 30) => http.get(`${BASE}/echeances?jours=${jours}`),
  valider: (id) => http.post(`${BASE}/${id}/valider`),
  signer: (id) => http.post(`${BASE}/${id}/signer`),
  annuler: (id) => http.post(`${BASE}/${id}/annuler`),
  renouveler: (id, payload) => http.post(`${BASE}/${id}/renouveler`, nettoyer(payload)),
  deposer: (id, fichier) => {
    const fd = new FormData()
    fd.append('fichier', fichier)
    return http.post(`${BASE}/${id}/document`, fd)
  },
}
