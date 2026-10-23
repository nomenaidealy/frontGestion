import { http } from './http'

export const referentielsApi = {
  liste: () => http.get('/api/referentiels'),
  /** Référentiels que l'utilisateur peut modifier (organisation : DG ; recrutement : RH, DG, administrateur) */
  modifiables: () => http.get('/api/referentiels/modifiables'),
  lister: (ref) => http.get(`/api/referentiels/${ref}`),
  creer: (ref, v) => http.post(`/api/referentiels/${ref}`, v),
  modifier: (ref, id, v) => http.put(`/api/referentiels/${ref}/${id}`, v),
  supprimer: (ref, id) => http.del(`/api/referentiels/${ref}/${id}`),
}
