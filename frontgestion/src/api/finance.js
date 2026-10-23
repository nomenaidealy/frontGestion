import { http } from './http'

export const financeApi = {
  grilles: () => http.get('/api/finance/grilles'),
  grille: (id) => http.get(`/api/finance/grilles/${id}`),
  grilleEnVigueur: () => http.get('/api/finance/grilles/en-vigueur'),
  creerGrille: (g) => http.post('/api/finance/grilles', g),
  budgets: (exercice) => http.get(`/api/finance/budgets${exercice ? `?exercice=${exercice}` : ''}`),
  creerBudget: (b) => http.post('/api/finance/budgets', b),
  modifierBudget: (id, b) => http.put(`/api/finance/budgets/${id}`, b),
  validerGrille: (id) => http.post(`/api/finance/grilles/${id}/valider`, {}),
  refuserGrille: (id, commentaire) => http.post(`/api/finance/grilles/${id}/refuser`, { commentaire }),
  validerBudget: (id) => http.post(`/api/finance/budgets/${id}/valider`, {}),
  refuserBudget: (id, commentaire) => http.post(`/api/finance/budgets/${id}/refuser`, { commentaire }),
  supprimerBudget: (id) => http.del(`/api/finance/budgets/${id}`),
}
