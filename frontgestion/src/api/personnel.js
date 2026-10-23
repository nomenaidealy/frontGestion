// Personnel : liste, dossier, saisie, mutation, départ, coordonnées bancaires
import { http } from './http'

export const personnelApi = {
  enPoste: (q) => http.get(`/api/rh/employes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  tous: (q) => http.get(`/api/rh/employes/tous${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  dossier: (id) => http.get(`/api/rh/employes/${id}/dossier`),
  creer: (e) => http.post('/api/rh/employes', e),
  modifier: (id, e) => http.put(`/api/rh/employes/${id}`, e),
  muter: (id, m) => http.post(`/api/rh/employes/${id}/mutation`, m),
  depart: (id, m) => http.post(`/api/rh/employes/${id}/depart`, m),
  enregistrerBanque: (id, b) => http.post(`/api/rh/employes/${id}/banque`, b),
}
