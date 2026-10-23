// Demandes de nouveau contrat / avenant (DemandeContratController)
import { http } from './http'

const BASE = '/api/contrats'

export const demandesContratApi = {
  lister: (vue = 'mes', idEmploye) => http.get(`${BASE}/demandes?vue=${vue}${idEmploye ? `&idEmploye=${idEmploye}` : ''}`),
  fiche: (id) => http.get(`${BASE}/demandes/${id}`),
  contrats: () => http.get(`${BASE}/demandes/contrats`),
  monContrat: () => http.get(`${BASE}/mon-contrat`),
  creer: (payload) => http.post(`${BASE}/demandes`, payload),
  instruire: (id, payload) => http.post(`${BASE}/demandes/${id}/instruire`, payload),
  finance: (id, payload) => http.post(`${BASE}/demandes/${id}/finance`, payload),
  decider: (id, payload) => http.post(`${BASE}/demandes/${id}/decider`, payload),
  annuler: (id) => http.post(`${BASE}/demandes/${id}/annuler`),
}
