import { http } from './http'

export const onboardingApi = {
  lister: (statut) => http.get(`/api/onboarding${statut ? `?statut=${statut}` : ''}`),
  fiche: (id) => http.get(`/api/onboarding/${id}`),
  mesTaches: () => http.get('/api/onboarding/mes-taches'),
  marquer: (idTache, statut, commentaire) => http.post(`/api/onboarding/taches/${idTache}`, { statut, commentaire }),
  modeles: () => http.get('/api/onboarding/modeles'),
  modele: (id) => http.get(`/api/onboarding/modeles/${id}`),
  creerModele: (m) => http.post('/api/onboarding/modeles', m),
  modifierModele: (id, m) => http.put(`/api/onboarding/modeles/${id}`, m),
}
