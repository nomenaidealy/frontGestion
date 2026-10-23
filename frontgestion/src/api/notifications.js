import { http } from './http'

export const notificationsApi = {
  lister: (nonLues = false, limite = 20) => http.get(`/api/notifications?nonLues=${nonLues}&limite=${limite}`),
  compteur: () => http.get('/api/notifications/compteur'),
  marquerLue: (id) => http.post(`/api/notifications/${id}/lue`),
  toutLire: () => http.post('/api/notifications/tout-lire'),
}
