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
  /** Postes au nom desquels l'utilisateur peut saisir un résultat (occupés ou délégués) */
  mesPostes: () => http.get('/api/selection/mes-postes'),
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

// --- Niveaux de sélection (étape 10) ---
Object.assign(selectionApi, {
  /** idOffre facultatif : sans lui, niveaux communs. Réponse : { idOffreEmploi, personnalises, niveaux } */
  niveaux: (idOffre) => http.get(`/api/rh/niveaux-selection${idOffre ? `?idOffre=${id(idOffre)}` : ''}`),
  /** { ordre, typeEvaluation, scoreMin, idOffreEmploi } */
  creerNiveau: (niveau) => http.post('/api/rh/niveaux-selection', niveau),
  modifierNiveau: (idNiveau, niveau) => http.put(`/api/rh/niveaux-selection/${id(idNiveau)}`, niveau),
  supprimerNiveau: (idNiveau) => http.del(`/api/rh/niveaux-selection/${id(idNiveau)}`),
  /** Copie les niveaux communs dans l'offre, pour les adapter. */
  personnaliser: (idOffre) => http.post(`/api/rh/offres/${id(idOffre)}/niveaux-selection`),
  /** Supprime les niveaux propres à l'offre : elle reprend les niveaux communs. */
  reprendreCommuns: (idOffre) => http.del(`/api/rh/offres/${id(idOffre)}/niveaux-selection`),
})

// --- Espace évaluateur (étape 11) ---
Object.assign(selectionApi, {
  /** { relieAEmploye, evaluations: [{ id, ordre, typeEvaluation, scoreMin, datePrevue, libelle, posteResponsable, idCandidature, candidat, referenceOffre, aSaisir }] } */
  mesEvaluations: () => http.get('/api/selection/mes-evaluations'),
})
