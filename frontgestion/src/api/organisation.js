// Bloc 0 : unités, organigramme, postes, circuit de validation
import { http } from './http'
import { query } from './besoins'

export const organisationApi = {
  unites: () => http.get('/api/organisation/unites'),
  organigramme: () => http.get('/api/organisation/organigramme'),
  creerUnite: (u) => http.post('/api/organisation/unites', u),
  modifierUnite: (id, u) => http.put(`/api/organisation/unites/${id}`, u),
  supprimerUnite: (id) => http.del(`/api/organisation/unites/${id}`),

  /** filtres : etat, occupation, idUnite, q */
  postes: (filtres) => http.get(`/api/organisation/postes${query(filtres)}`),
  poste: (id) => http.get(`/api/organisation/postes/${id}`),
  creerPoste: (p) => http.post('/api/organisation/postes', p),
  modifierPoste: (id, p) => http.put(`/api/organisation/postes/${id}`, p),
  supprimerPoste: (id) => http.del(`/api/organisation/postes/${id}`),
  /** Demande de poste hors besoin (état PROPOSE), validée ensuite par le DG. */
  demanderPoste: (p) => http.post('/api/rh/postes/demande', p),
  /** Décision du DG sur un poste proposé : ACTIF ou REFUSE. */
  deciderPoste: (id, etat) => http.put(`/api/postes/${id}/etat`, { etat }),

  circuit: () => http.get('/api/organisation/circuit-validation'),
  ajouterEtape: (e) => http.post('/api/organisation/circuit-validation', e),
  modifierEtape: (id, e) => http.put(`/api/organisation/circuit-validation/${id}`, e),
  supprimerEtape: (id) => http.del(`/api/organisation/circuit-validation/${id}`),
}
