import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { posteService } from '@/services/posteService'
import { ETAT_POSTE } from '@/constants/postes'
import { useAuth } from './useAuth'
import { useFeedback } from './useFeedback'

export function usePostesProposes() {
  const route = useRoute()
  const router = useRouter()
  const { currentUser } = useAuth()

  const postes = ref([])
  const chargement = ref(false)
  const enCours = ref(null) // id du poste en cours de traitement

  const { erreur, succes, effacer, afficherErreur, afficherSucces } = useFeedback()

  // Session expirée : retour à la page de connexion, puis retour ici après login
  function sessionExpiree() {
    currentUser.value = null
    router.push({ name: 'login', query: { redirect: route.fullPath } })
  }

  async function charger() {
    chargement.value = true
    effacer()
    try {
      postes.value = await posteService.listerParEtat(ETAT_POSTE.PROPOSE)
    } catch (e) {
      if (e.status === 401) return sessionExpiree()
      afficherErreur(e.message || 'Impossible de charger la liste des postes.')
    } finally {
      chargement.value = false
    }
  }

  async function traiter(poste, action, messageSucces) {
    enCours.value = poste.id
    effacer()
    try {
      await action(poste.id)
      // Le poste n'est plus PROPOSE : on le retire de la liste
      postes.value = postes.value.filter((p) => p.id !== poste.id)
      afficherSucces(messageSucces)
    } catch (e) {
      if (e.status === 401) {
        sessionExpiree()
      } else if (e.status === 409) {
        // Déjà traité par quelqu'un d'autre : on rafraîchit la liste
        afficherErreur('Ce poste a déjà été traité.')
        await charger()
      } else {
        afficherErreur(e.message || "L'opération a échoué. Réessayez.")
      }
    } finally {
      enCours.value = null
    }
  }

  const valider = (poste) =>
    traiter(poste, posteService.valider.bind(posteService), `Le poste « ${poste.libelle} » a été validé.`)

  const refuser = (poste) =>
    traiter(poste, posteService.refuser.bind(posteService), `Le poste « ${poste.libelle} » a été refusé.`)

  return { postes, chargement, enCours, erreur, succes, charger, valider, refuser }
}
