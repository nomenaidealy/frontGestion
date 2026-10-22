<script setup>
import { onMounted } from 'vue'
import { usePostesProposes } from '@/composables/usePostesProposes'
import AlertMessage from '@/components/common/AlertMessage.vue'
import PosteTable from '@/components/postes/PosteTable.vue'

const { postes, chargement, enCours, erreur, succes, charger, valider, refuser } = usePostesProposes()

function confirmerRefus(poste) {
  if (confirm(`Refuser le poste « ${poste.libelle} » ?`)) refuser(poste)
}

onMounted(charger)
</script>

<template>
  <div class="page">
    <header class="entete">
      <div>
        <h1>Postes proposés</h1>
        <p>Postes en attente de validation</p>
      </div>
      <button class="btn-actualiser" :disabled="chargement" @click="charger">
        {{ chargement ? 'Chargement...' : 'Actualiser' }}
      </button>
    </header>

    <AlertMessage type="succes" :message="succes" />
    <AlertMessage type="erreur" :message="erreur" />

    <p v-if="chargement && !postes.length" class="vide">Chargement...</p>
    <p v-else-if="!postes.length" class="vide">Aucun poste en attente de validation.</p>

    <PosteTable
      v-else
      :postes="postes"
      :en-cours="enCours"
      @valider="valider"
      @refuser="confirmerRefus"
    />
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: #111827;
}

.entete {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

h1 {
  margin: 0 0 4px;
  font-size: 24px;
}

.entete p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.btn-actualiser {
  padding: 8px 14px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-actualiser:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.vide {
  text-align: center;
  color: #6b7280;
  padding: 40px 0;
}
</style>
