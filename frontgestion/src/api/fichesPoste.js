// Fiches de poste (FichePosteController)
import { http } from './http'

const BASE = '/api/fiches-poste'

export const fichesPosteApi = {
  catalogue: () => http.get(BASE),
  modeleStandard: () => http.get(`${BASE}/modele-standard`),
  duMetier: (idMetier) => http.get(`${BASE}/metier/${idMetier}`),
  enregistrerMetier: (idMetier, payload) => http.put(`${BASE}/metier/${idMetier}`, payload),
  dePoste: (idPoste) => http.get(`${BASE}/poste/${idPoste}`),
  maFiche: () => http.get(`${BASE}/ma-fiche`),
  pdfPoste: (idPoste) => `${BASE}/poste/${idPoste}/pdf`,
  pdfMaFiche: `${BASE}/ma-fiche/pdf`,
}
