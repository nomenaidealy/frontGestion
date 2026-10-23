// Mise en forme commune : dates, montants, libellés et couleurs des états.

const optsDate = { day: '2-digit', month: '2-digit', year: 'numeric' }

/** '2026-10-23' -> '23/10/2026' */
export function dateFr(v) {
  if (!v) return '—'
  const d = typeof v === 'string' && v.length === 10 ? new Date(v + 'T00:00:00') : new Date(v)
  return isNaN(d) ? String(v) : d.toLocaleDateString('fr-FR', optsDate)
}

/** '2026-10-23T09:12:00' -> '23/10/2026 09:12' */
export function dateHeure(v) {
  if (!v) return '—'
  const d = new Date(v)
  return isNaN(d) ? String(v) : `${d.toLocaleDateString('fr-FR', optsDate)} ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

/** Il y a 5 min, hier, le 12/10… */
export function depuis(v) {
  if (!v) return ''
  const d = new Date(v)
  const s = (Date.now() - d.getTime()) / 1000
  if (s < 60) return "à l'instant"
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  if (s < 172800) return 'hier'
  return `le ${dateFr(v)}`
}

/** 3200000 -> '3 200 000 Ar' */
export function ariary(v) {
  if (v === null || v === undefined || v === '') return '—'
  return Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 0 }).replace(/[  ]/g, ' ') + ' Ar'
}

/** 3200000 -> '3,2 M Ar' (indicateurs) */
export function ariaryCourt(v) {
  if (v === null || v === undefined) return '—'
  const n = Number(v)
  if (Math.abs(n) >= 1e9) return (n / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' Md Ar'
  if (Math.abs(n) >= 1e6) return (n / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' M Ar'
  return ariary(n)
}

export const nombre = (v) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('fr-FR'))

export function initiales(nom) {
  if (!nom) return '?'
  const p = String(nom).replace(/\(.*\)/, '').trim().split(/[\s._-]+/).filter(Boolean)
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() || '?'
}

export const aujourdhui = () => new Date().toISOString().slice(0, 10)

/**
 * États de chaque objet métier : libellé lisible + ton de la pastille (ok, wait, ko, info, brand, '').
 * Utilisé par <Statut type="besoin" :valeur="b.etat" />.
 */
export const ETATS = {
  besoin: {
    EN_ATTENTE: ['En validation', 'wait'], OUVERT: ['Recrutement ouvert', 'info'], POURVU: ['Pourvu', 'ok'], ANNULE: ['Annulé', 'ko'],
  },
  siege: {
    EN_ATTENTE: ['En attente', 'wait'], OUVERT: ['À pourvoir', 'info'], POURVU: ['Pourvu', 'ok'], ANNULE: ['Annulé', 'ko'],
  },
  poste: { PROPOSE: ['Proposé', 'wait'], ACTIF: ['Actif', 'ok'], REFUSE: ['Refusé', 'ko'], SUPPRIME: ['Supprimé', ''] },
  occupation: { LIBRE: ['Vacant', 'info'], OCCUPE: ['Occupé', 'brand'] },
  offre: { BROUILLON: ['Brouillon', ''], PUBLIEE: ['Publiée', 'ok'], CLOTUREE: ['Clôturée', 'ko'] },
  candidature: {
    DEPOSEE: ['Nouvelle', 'info'], PRESELECTIONNER: ['En sélection', 'wait'], RETENUE: ['Retenue', 'ok'], REFUSE: ['Refusée', 'ko'], DESISTE: ['Désistée', ''],
  },
  contrat: { CREE: ['Créé', 'info'], VALIDE: ['Validé', 'wait'], SIGNE: ['Signé', 'ok'], TERMINE: ['Terminé', ''], ANNULE: ['Annulé', 'ko'] },
  onboarding: { EN_COURS: ['En cours', 'wait'], TERMINE: ['Terminé', 'ok'] },
  tache: { A_FAIRE: ['À faire', 'wait'], FAIT: ['Fait', 'ok'], NON_APPLICABLE: ['Non applicable', ''] },
  compte: { ACTIF: ['Actif', 'ok'], EN_ATTENTE: ['À valider', 'wait'], DESACTIVE: ['Désactivé', 'ko'] },
  delegation: { A_VENIR: ['À venir', 'info'], EN_COURS: ['En cours', 'ok'], TERMINEE: ['Terminée', ''] },
  grille: { EN_VIGUEUR: ['En vigueur', 'ok'], A_VENIR: ['À venir', 'info'], ECHUE: ['Échue', ''], A_VALIDER: ['À valider (DG)', 'wait'], REFUSEE: ['Refusée', 'ko'] },
  budget: { A_VALIDER: ['À valider (DG)', 'wait'], VALIDE: ['Validé', 'ok'], REFUSE: ['Refusé', 'ko'] },
  employe: { ACTIF: ['En poste', 'ok'], PARTI: ['Parti', ''] },
}

export function etat(type, valeur) {
  const e = ETATS[type]?.[valeur]
  return e ? { libelle: e[0], ton: e[1] } : { libelle: valeur ?? '—', ton: '' }
}

export const TYPES_BESOIN = { CREATION: 'Création de poste', REMPLACEMENT: 'Remplacement' }
export const TYPES_UNITE = { DIRECTION: 'Direction', DEPARTEMENT: 'Département', SERVICE: 'Service', SECTION: 'Section' }
export const MOTIFS_DEPART = {
  DEMISSION: 'Démission', LICENCIEMENT: 'Licenciement', FIN_CONTRAT: 'Fin de contrat', RETRAITE: 'Retraite', AUTRE: 'Autre',
}
