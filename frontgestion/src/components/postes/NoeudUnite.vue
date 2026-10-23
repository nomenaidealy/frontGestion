<script setup>
import { ref } from 'vue'
import { TYPES_UNITE } from '@/utils/format'

// Une unité de l'organigramme et ses sous-unités (récursif).
defineProps({ unite: { type: Object, required: true } })
const ouvert = ref(true)
</script>

<template>
  <li>
    <div class="d-flex align-items-center gap-2">
      <button v-if="unite.enfants.length" type="button" class="btn btn-sm btn-link" style="width:22px;padding:0" :aria-expanded="ouvert"
              :aria-label="ouvert ? 'Replier' : 'Déplier'" @click="ouvert = !ouvert">{{ ouvert ? '−' : '+' }}</button>
      <span v-else style="width:22px"></span>
      <RouterLink :to="{ path: '/postes', query: { idUnite: unite.id, etat: 'ACTIF' } }" class="orga-noeud flex-grow-1">
        <span class="t">
          <b><span class="type-pastille" :class="unite.type" :title="TYPES_UNITE[unite.type]"></span>{{ unite.libelle }}</b>
          <small>{{ unite.posteResponsable || 'Sans responsable désigné' }}<template v-if="unite.responsable"> — {{ unite.responsable }}</template></small>
        </span>
        <span class="orga-stats">
          <span><b>{{ unite.effectif }}</b> en poste</span>
          <span><b>{{ unite.postes }}</b> postes</span>
          <span :style="unite.vacants ? 'color:var(--sirh-amber)' : ''"><b :style="unite.vacants ? 'color:inherit' : ''">{{ unite.vacants }}</b> vacant(s)</span>
        </span>
      </RouterLink>
    </div>
    <ul v-if="unite.enfants.length && ouvert">
      <NoeudUnite v-for="e in unite.enfants" :key="e.id" :unite="e" />
    </ul>
  </li>
</template>
