// P4 – Propositions d'embauche : côté RH (PropositionRhController) et côté candidat (lien personnel)
import { http } from './http'

const BASE = '/api/rh/propositions'

export const propositionsApi = {
  liste: (statut) => http.get(statut ? `${BASE}?statut=${encodeURIComponent(statut)}` : BASE),
  retenues: () => http.get('/api/rh/candidatures-retenues'),           // candidats retenus par la sélection (P5)
  formulaire: (idCandidature) => http.get(`${BASE}/formulaire?idCandidature=${encodeURIComponent(idCandidature)}`),
  creer: (req) => http.post(BASE, req),
  /** Fourchette de la grille validée pour un poste à une date : { min, max, categorie, echelon } */
  fourchette: (idPoste, date) => http.get(`${BASE}/fourchette?idPoste=${encodeURIComponent(idPoste)}${date ? `&date=${date}` : ''}`),
  fiche: (id) => http.get(`${BASE}/${id}`),
  contreProposer: (id, req) => http.post(`${BASE}/${id}/contre-proposition`, req),
  retirer: (id, commentaire) => http.post(`${BASE}/${id}/retrait`, { commentaire }),
}

const PUB = (jeton) => `/api/public/propositions/${encodeURIComponent(jeton)}`

export const propositionPubliqueApi = {
  voir: (jeton) => http.get(PUB(jeton)),
  repondre: (jeton, reponses) => http.post(`${PUB(jeton)}/reponse`, { reponses }),
  decliner: (jeton, commentaire) => http.post(`${PUB(jeton)}/declin`, { commentaire }),
}

export const ETAPES_PROPOSITION = {
  ATTENTE_CANDIDAT: { libelle: 'En attente du candidat', classe: 'bg-info text-dark' },
  ATTENTE_RH: { libelle: 'À traiter par la RH', classe: 'bg-warning text-dark' },
  ACCEPTEE: { libelle: 'Acceptée', classe: 'bg-success' },
  REFUSEE: { libelle: 'Refusée', classe: 'bg-danger' },
  EXPIREE: { libelle: 'Expirée', classe: 'bg-secondary' },
}

/** 3200000 -> "3 200 000" */
export const montant = (v) => (v == null || v === '' ? '—' : Number(v).toLocaleString('fr-FR').replace(/ | /g, ' '))
