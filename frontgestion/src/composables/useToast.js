import { ref } from 'vue'

// Messages éphémères en bas à droite : toast.ok('Besoin validé'), toast.erreur(e)
const messages = ref([])
let suivant = 1

function ajouter(texte, ton) {
  const id = suivant++
  messages.value.push({ id, texte, ton })
  setTimeout(() => fermer(id), ton === 'ko' ? 7000 : 4000)
}
function fermer(id) {
  messages.value = messages.value.filter((m) => m.id !== id)
}

export function useToast() {
  return {
    messages,
    fermer,
    ok: (texte) => ajouter(texte, 'ok'),
    erreur: (e) => ajouter(typeof e === 'string' ? e : e?.message || 'Action impossible', 'ko'),
  }
}
