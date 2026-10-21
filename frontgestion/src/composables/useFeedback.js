import { ref } from 'vue'

// Messages de succès / d'erreur réutilisables dans n'importe quelle page
export function useFeedback() {
  const erreur = ref('')
  const succes = ref('')

  function effacer() {
    erreur.value = ''
    succes.value = ''
  }

  function afficherErreur(message) {
    succes.value = ''
    erreur.value = message
  }

  function afficherSucces(message) {
    erreur.value = ''
    succes.value = message
  }

  return { erreur, succes, effacer, afficherErreur, afficherSucces }
}
