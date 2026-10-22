// P5 – Appels API des candidatures
// Lecture : client commun http.js. Dépôt : requête multipart (JSON + PDF) avec erreurs par champ.
import { http } from './http'

/** Erreur du formulaire de candidature : message général + erreurs par champ ({ email: '…' }). */
export class ErreurFormulaire extends Error {
  constructor(message, champs = {}, status = 0) {
    super(message)
    this.name = 'ErreurFormulaire'
    this.champs = champs
    this.status = status
  }
}

export const candidaturesPubliquesApi = {
  /** Offres ouvertes ; idUnite = une direction ou un département (sous-unités comprises). */
  offres: (idUnite) => http.get(`/api/public/offres${idUnite ? `?idUnite=${encodeURIComponent(idUnite)}` : ''}`),
  offre: (id) => http.get(`/api/public/offres/${encodeURIComponent(id)}`),
  unites: () => http.get('/api/public/unites-filtre'),
  typesInformation: () => http.get('/api/public/types-information'),
  urlFiche: (id) => `/api/public/offres/${encodeURIComponent(id)}/fiche`,
  deposer,
}

/**
 * Dépose une candidature : partie « candidature » en JSON + partie « cv » (PDF).
 * Le Content-Type multipart est posé par le navigateur : ne pas le forcer.
 */
async function deposer(candidature, fichierCv) {
  const formulaire = new FormData()
  formulaire.append('candidature', new Blob([JSON.stringify(candidature)], { type: 'application/json' }))
  if (fichierCv) formulaire.append('cv', fichierCv)

  let res
  try {
    res = await fetch('/api/public/candidatures', { method: 'POST', body: formulaire, credentials: 'same-origin' })
  } catch {
    throw new ErreurFormulaire('Impossible de joindre le serveur. Vérifiez votre connexion.')
  }
  let data = null
  try { data = await res.json() } catch { /* corps non JSON */ }
  if (res.ok) return data
  if (res.status === 413) throw new ErreurFormulaire('Le fichier est trop volumineux.', { cv: 'Le CV est trop volumineux.' }, 413)
  throw new ErreurFormulaire(data?.message ?? data?.error ?? `Erreur ${res.status}`, data?.champs ?? {}, res.status)
}

// ---------------------------------------------------------------------------
// Côté RH (connexion + rôle RH) : consultation des candidatures reçues
// ---------------------------------------------------------------------------

export const candidaturesRhApi = {
  /** Offres avec le nombre de candidatures (et de nouvelles). */
  offres: () => http.get('/api/rh/offres-candidatures'),
  /** Candidatures d'une offre ; etat facultatif (DEPOSEE, PRESELECTIONNER, REFUSE, DESISTE, RETENUE). */
  candidatures: (idOffre, etat) =>
    http.get(`/api/rh/offres/${encodeURIComponent(idOffre)}/candidatures${etat ? `?etat=${encodeURIComponent(etat)}` : ''}`),
  fiche: (id) => http.get(`/api/rh/candidatures/${encodeURIComponent(id)}`),
  urlPiece: (id, idDocument) => `/api/rh/candidatures/${encodeURIComponent(id)}/pieces/${encodeURIComponent(idDocument)}`,
}

/** Valeurs de candidatures.etat et leur libellé affiché. */
export const ETATS_CANDIDATURE = {
  DEPOSEE: 'Nouvelle',
  PRESELECTIONNER: 'Présélectionnée',
  REFUSE: 'Refusée',
  DESISTE: 'Désistée',
  RETENUE: 'Retenue',
}

/** Couleur Bootstrap du badge de chaque état. */
export const BADGE_ETAT = {
  DEPOSEE: 'bg-primary',
  PRESELECTIONNER: 'bg-info text-dark',
  REFUSE: 'bg-danger',
  DESISTE: 'bg-secondary',
  RETENUE: 'bg-success',
}

export const TYPES_LIGNE_CV = {
  'EXPERIENCE PRO': 'Expériences professionnelles',
  EDUCATION: 'Formations',
  QUALITE: 'Qualités',
}
