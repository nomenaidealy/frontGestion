<script setup>
import BesoinDetails from '../../components/besoins/BesoinDetails.vue'
import BesoinList from '../../components/besoins/BesoinList.vue'
import { useBesoins } from '../../composables/useBesoins'

const { besoins, selectedBesoin, loading, validating, error, success, hasBesoins, canValidate, loadBesoins, selectBesoin, validateSelected, refuseSelected } = useBesoins()
</script>

<template>
  <main class="besoins-page container py-4 py-lg-5">
    <header class="page-heading mb-4">
      <div>
        <span class="eyebrow">ADMINISTRATION RH</span>
        <h1 class="mb-2">Fiches de besoin</h1>
        <p class="text-muted mb-0">Consultez les demandes de recrutement et validez leur prochaine étape.</p>
      </div>
      <button class="btn btn-outline-secondary" :disabled="loading" @click="loadBesoins">
        {{ loading ? 'Actualisation...' : 'Actualiser' }}
      </button>
    </header>

    <div v-if="success" class="alert alert-success" role="status">{{ success }}</div>
    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

    <div class="besoins-layout">
      <BesoinList :besoins="besoins" :selected-id="selectedBesoin?.id" @select="selectBesoin" />
      <BesoinDetails :besoin="selectedBesoin" :can-validate="canValidate" :validating="validating"
        @validate="validateSelected" @refuse="refuseSelected" />
    </div>

    <div v-if="loading && !hasBesoins" class="text-center text-muted py-4">
      Chargement des fiches...
    </div>
  </main>
</template>

<style scoped>
.besoins-page {
  max-width: 1400px;
}

.page-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1.5rem;
}

.page-heading h1 {
  color: inherit;
  font-family: inherit;
  font-size: 1.75rem;
  font-weight: 600;
}

.page-heading .eyebrow {
  color: #6c757d;
}

@media (max-width: 575.98px) {
  .page-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .page-heading .btn {
    align-self: flex-start;
  }
}
</style>
