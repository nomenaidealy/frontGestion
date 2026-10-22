// P3 – Personnel : liste et fiche employé (EmployeController)
import { http } from './http'

export const employesApi = {
  liste: (q) => http.get(q ? `/api/rh/employes?q=${encodeURIComponent(q)}` : '/api/rh/employes'),
  fiche: (id) => http.get(`/api/rh/employes/${id}`),
}
