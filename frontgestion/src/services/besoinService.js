import { api } from './api'

const collectionPath = '/api/besoin'

export const besoinService = {
  list() {
    return api.get(collectionPath)
  },
  getById(id) {
    return api.get(`${collectionPath}/${id}`)
  },
  validate(id) {
    return api.post(`/api/besoin/valider?idBesoin=${encodeURIComponent(id)}`)
  },
  refuse(id) {
    return api.post(`/api/besoin/refuser?idBesoin=${encodeURIComponent(id)}`)
  },
}
