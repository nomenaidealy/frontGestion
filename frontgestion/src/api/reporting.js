import { http } from './http'

export const reportingApi = {
  accueil: () => http.get('/api/accueil'),
  tableauDeBord: () => http.get('/api/reporting/tableau-de-bord'),
  /** personnel | besoins | candidatures | contrats */
  urlExport: (quoi) => `/api/reporting/export/${quoi}`,
}
