import axios from 'axios'

const http = axios.create({ baseURL: '/api/rh' })

export default {
  // listes (OptionDto : { id, libelle })
  metiers:     () => http.get('/metiers').then(r => r.data),
  categories:  () => http.get('/categories').then(r => r.data),
  echelons:    () => http.get('/echelons').then(r => r.data),
  unites:      () => http.get('/unites').then(r => r.data),
  superieurs:  () => http.get('/postes/superieurs').then(r => r.data),
  motifs:      () => http.get('/motifs').then(r => r.data),
  postesActifs: (idUnite) =>
    http.get('/postes/actifs', { params: { idUnite } }).then(r => r.data),

  // actions
  demanderPoste: (payload) => http.post('/postes/demande', payload).then(r => r.data),
  creerMotif:    (libelle) => http.post('/motifs', { libelle }).then(r => r.data),
  creerBesoin:   (payload) => http.post('/besoins', payload).then(r => r.data),
  besoins:       () => http.get('/besoins').then(r => r.data),
}