// P5 – Sprint 2 : sélection des candidats (présélection, niveaux, évaluations)
import { http } from './http'

const id = encodeURIComponent

export const selectionApi = {
  /** Évaluations, historique et actions possibles d'une candidature. */
  dossier: (idCandidature) => http.get(`/api/rh/candidatures/${id(idCandidature)}/selection`),
  preselectionner: (idCandidature, commentaire) =>
    http.post(`/api/rh/candidatures/${id(idCandidature)}/preselection`, { commentaire: commentaire || null }),
  /** Le motif est obligatoire. */
  refuser: (idCandidature, commentaire) =>
    http.post(`/api/rh/candidatures/${id(idCandidature)}/refus`, { commentaire }),
}
