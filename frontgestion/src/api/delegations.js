import { http } from './http'

export const delegationsApi = {
  mes: () => http.get('/api/delegations'),
  toutes: () => http.get('/api/delegations?toutes=true'),
  creer: (dateDebut, dateFin, delegue) =>
    http.post(`/api/delegations?dateDebut=${dateDebut}&dateFin=${dateFin}&delegue=${delegue}`),
  annuler: (id) => http.post(`/api/delegations/${id}/annuler`),
}
