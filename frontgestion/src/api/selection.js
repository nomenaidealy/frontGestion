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

// --- Évaluations (étape 9) ---
Object.assign(selectionApi, {
  /** Postes actifs, proposés comme responsables d'une évaluation. */
  postes: () => http.get('/api/rh/selection/postes'),
  /** { datePrevue, idPosteResponsable, libelle } */
  planifier: (idEvaluation, planification) =>
    http.put(`/api/rh/evaluations/${id(idEvaluation)}/planification`, planification),
  /** { dateRealisee, score, decision, commentaire } — RH ou titulaire du poste responsable. */
  resultat: (idEvaluation, resultat) => http.post(`/api/selection/evaluations/${id(idEvaluation)}/resultat`, resultat),
})

export const TYPES_EVALUATION = {
  TEST: 'Test',
  ENTRETIEN_RH: 'Entretien RH',
  ENTRETIEN_CHEF_DEPARTEMENT: 'Entretien chef de département',
  ENTRETIEN_DIRECTION: 'Entretien direction',
}

export const DECISIONS = { ADMIS: 'Admis', NON_ADMIS: 'Non admis', ABSENT: 'Absent' }
export const BADGE_DECISION = { ADMIS: 'bg-success', NON_ADMIS: 'bg-danger', ABSENT: 'bg-secondary' }

/** Statut calculé par le back pour chaque évaluation d'une candidature. */
export const STATUTS_EVALUATION = {
  A_FAIRE: { libelle: 'En cours', badge: 'bg-primary' },
  EN_ATTENTE: { libelle: 'À venir', badge: 'bg-light text-dark border' },
  FAITE: { libelle: 'Faite', badge: 'bg-dark' },
  ANNULEE: { libelle: 'Sans objet', badge: 'bg-light text-muted border' },
}

/** 12.5 -> "12,5" */
export const formatScore = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('fr-FR'))
