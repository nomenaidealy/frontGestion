// Besoins en personnel : expression, circuit de validation, suivi
import { http } from './http'

const q = (o) => {
  const p = new URLSearchParams()
  Object.entries(o || {}).forEach(([k, v]) => { if (v !== null && v !== undefined && v !== '') p.set(k, v) })
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const besoinsApi = {
  /** vue : tous | mes-demandes | a-valider */
  lister: (filtres) => http.get(`/api/besoins${q(filtres)}`),
  fiche: (id) => http.get(`/api/besoins/${id}`),
  annuler: (id, motif) => http.post(`/api/besoins/${id}/annuler`, { motif }),
  creer: (payload) => http.post('/api/rh/besoins', payload),
  valider: (id, commentaire) => http.post(`/api/besoin/valider${q({ idBesoin: id, commentaire })}`),
  refuser: (id, commentaire) => http.post(`/api/besoin/refuser${q({ idBesoin: id, commentaire })}`),

  // listes du formulaire
  unites: () => http.get('/api/rh/unites'),
  motifs: () => http.get('/api/rh/motifs'),
  creerMotif: (libelle) => http.post('/api/rh/motifs', { libelle }),
  postesActifs: (idUnite) => http.get(`/api/rh/postes/actifs?idUnite=${idUnite}`),
  postesOccupes: (idUnite) => http.get(`/api/rh/postes/occupes?idUnite=${idUnite}`),
  metiers: () => http.get('/api/rh/metiers'),
  categories: () => http.get('/api/rh/categories'),
  echelons: () => http.get('/api/rh/echelons'),
  superieurs: () => http.get('/api/rh/postes/superieurs'),
}
export { q as query }
