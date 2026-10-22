import { api } from './api'
import { ETAT_POSTE } from '@/constants/postes'

export const posteService = {
  listerParEtat(etat) {
    return api.get(`/api/postes?etat=${encodeURIComponent(etat)}`)
  },

  changerEtat(id, etat) {
    return api.put(`/api/postes/${id}/etat`, { etat })
  },

  // Validation : PROPOSE -> ACTIF
  valider(id) {
    return this.changerEtat(id, ETAT_POSTE.ACTIF)
  },

  // Refus : PROPOSE -> REFUSE (SUPPRIME est un autre cas)
  refuser(id) {
    return this.changerEtat(id, ETAT_POSTE.REFUSE)
  },
}
