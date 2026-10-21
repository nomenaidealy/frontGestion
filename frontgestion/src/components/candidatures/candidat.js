// P5 – Petites fonctions d'affichage communes aux composants RH des candidatures

/** Âge en années à partir d'une date ISO (AAAA-MM-JJ), ou null. */
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
