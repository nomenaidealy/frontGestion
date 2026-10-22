// P2 – Appels API des besoins, postes et contrats
import { http } from './http'

const BASE = '/api/rh'

export const besoinApi = {
  // ---------- Listes (OptionDto : { id, libelle }) ----------
  metiers:       () => http.get(`${BASE}/metiers`),
  categories:    () => http.get(`${BASE}/categories`),
  echelons:      () => http.get(`${BASE}/echelons`),
  unites:        () => http.get(`${BASE}/unites`),
  superieurs:    () => http.get(`${BASE}/postes/superieurs`),
  motifs:        () => http.get(`${BASE}/motifs`),
  postesActifs:  (idUnite) => http.get(`${BASE}/postes/actifs?idUnite=${encodeURIComponent(idUnite)}`),
  postesOccupes: (idUnite) => http.get(`${BASE}/postes/occupes?idUnite=${encodeURIComponent(idUnite)}`),

  // ---------- Postes et besoins ----------
  demanderPoste: (payload) => http.post(`${BASE}/postes/demande`, nettoyer(payload)),
  creerMotif:    (libelle) => http.post(`${BASE}/motifs`, { libelle }),
  creerBesoin:   (payload) => http.post(`${BASE}/besoins`, nettoyer(payload)),
  besoins:       () => http.get(`${BASE}/besoins`),

  // ---------- Contrats ----------
  contratsEmploye: (idEmploye) => http.get(`${BASE}/contrats/employe/${idEmploye}`),
  contrat:         (id) => http.get(`${BASE}/contrats/${id}`),
  echeances:       (jours = 30) => http.get(`${BASE}/contrats/echeances?jours=${encodeURIComponent(jours)}`),
  validerContrat:  (id) => http.post(`${BASE}/contrats/${id}/valider`),
  signerContrat:   (id) => http.post(`${BASE}/contrats/${id}/signer`),
  annulerContrat:  (id) => http.post(`${BASE}/contrats/${id}/annuler`),
  renouveler:      (id, payload) => http.post(`${BASE}/contrats/${id}/renouveler`, nettoyer(payload)),
}
deposerContrat: (id, fichier) => {
  const fd = new FormData()
  fd.append('fichier', fichier)
  return http.post(`${BASE}/contrats/${id}/document`, fd)
},

// Les champs vides ('') deviennent null (les tableaux et objets sont gardés tels quels)
function nettoyer(form) {
  const f = { ...form }
  for (const k of Object.keys(f)) if (f[k] === '') f[k] = null
  return f
}