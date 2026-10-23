import { http } from './http'
import { query } from './besoins'

export const adminApi = {
  utilisateurs: (filtres) => http.get(`/api/admin/utilisateurs${query(filtres)}`),
  utilisateur: (id) => http.get(`/api/admin/utilisateurs/${id}`),
  roles: () => http.get('/api/admin/utilisateurs/roles'),
  creer: (u) => http.post('/api/admin/utilisateurs', u),
  modifier: (id, u) => http.put(`/api/admin/utilisateurs/${id}`, u),
  activer: (id) => http.post(`/api/admin/utilisateurs/${id}/activer`),
  desactiver: (id) => http.post(`/api/admin/utilisateurs/${id}/desactiver`),
  reinitialiser: (id) => http.post(`/api/admin/utilisateurs/${id}/reinitialiser`),
  supprimer: (id) => http.del(`/api/admin/utilisateurs/${id}`),
  audit: (filtres) => http.get(`/api/admin/audit${query(filtres)}`),
  comptesActifs: () => http.get('/api/utilisateurs/actifs'),
}
