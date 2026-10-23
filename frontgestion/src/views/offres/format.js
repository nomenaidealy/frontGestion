// P4 – petits utilitaires d'affichage

/** "2026-10-21" -> "21/10/2026" */
export function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = String(iso).split('-')
  return `${d}/${m}/${y}`
}

/** 1500000 -> "1 500 000" */
export function formatMontant(n) {
  if (n === null || n === undefined) return null
  return Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 0 })
}
