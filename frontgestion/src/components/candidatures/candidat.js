export function age(iso) {
  if (!iso) return null
  const [a, m, j] = iso.split('-').map(Number)
  const auj = new Date()
  let ans = auj.getFullYear() - a
  if (auj.getMonth() + 1 < m || (auj.getMonth() + 1 === m && auj.getDate() < j)) ans -= 1
  return ans
}

export const nomComplet = (c) => [c.nom, c.prenom].filter(Boolean).join(' ')

/** « 2 candidatures », « 1 pièce »… */
export const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`

/** "2026-10-21T14:05:00" -> "21/10/2026 à 14:05" */
export function formatDateHeure(iso) {
  if (!iso) return '—'
  const [date, heure = ''] = String(iso).split('T')
  const [a, m, j] = date.split('-')
  return heure ? `${j}/${m}/${a} à ${heure.slice(0, 5)}` : `${j}/${m}/${a}`
}
