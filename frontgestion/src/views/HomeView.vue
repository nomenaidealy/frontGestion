<script setup>
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { currentUser: user } = useAuth()
const aRole = (r) => user.value?.roles?.includes(r)

// Raccourcis selon le rôle : ce que chacun a à faire dans le circuit de recrutement
const raccourcis = computed(() => {
  const l = []
  if (aRole('Manager')) {
    l.push({ to: '/besoins/nouveau', titre: 'Exprimer un besoin', texte: 'Demander un recrutement pour votre unité.' })
    l.push({ to: '/postes/demande', titre: 'Demander un poste', texte: 'Créer un poste qui n\'existe pas encore.' })
  }
  if (aRole('RH') || aRole('Finance') || aRole('DG') || aRole('Manager')) {
    l.push({ to: '/besoins', titre: 'Fiches de besoin', texte: 'Suivre et valider les demandes à votre étape.' })
  }
  if (aRole('RH')) {
    l.push({ to: '/offres', titre: 'Offres d\'emploi', texte: 'Créer, publier, clôturer les offres.' })
    l.push({ to: '/candidatures', titre: 'Candidatures', texte: 'Présélectionner et suivre les évaluations.' })
    l.push({ to: '/propositions', titre: 'Propositions d\'embauche', texte: 'Faire une proposition aux candidats retenus.' })
    l.push({ to: '/personnel', titre: 'Personnel', texte: 'Fiches employés et contrats.' })
    l.push({ to: '/contrats/echeances', titre: 'Échéances de contrat', texte: 'Contrats qui arrivent à terme.' })
  }
  l.push({ to: '/mes-evaluations', titre: 'Mes évaluations', texte: 'Entretiens et tests qui vous sont confiés.' })
  return l
})
</script>

<template>
  <div class="container">
    <div v-if="user" class="mb-4">
      <h4 class="mb-1">Bonjour {{ user.login }}</h4>
      <p class="text-muted mb-0">Rôles : {{ user.roles?.join(', ') || 'aucun' }}</p>
    </div>
    <div class="row g-3">
      <div v-for="r in raccourcis" :key="r.to" class="col-sm-6 col-lg-4">
        <RouterLink :to="r.to" class="card h-100 shadow-sm text-decoration-none text-reset">
          <div class="card-body">
            <h6 class="card-title mb-1">{{ r.titre }}</h6>
            <p class="card-text small text-muted mb-0">{{ r.texte }}</p>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
