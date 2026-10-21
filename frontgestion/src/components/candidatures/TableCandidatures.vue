<script setup>
import { formatDate } from '@/views/offres/format'
import BadgeEtat from './BadgeEtat.vue'
import { age, nomComplet, pluriel } from './candidat'

defineProps({
  candidatures: { type: Array, required: true },
  chargement: { type: Boolean, default: false },
  filtre: { type: Boolean, default: false },    // un filtre d'état est actif (pour le message « aucune »)
  selection: { type: Number, default: null },   // id de la candidature ouverte
})
const emit = defineEmits(['ouvrir'])
</script>

<template>
  <div class="card shadow-sm mb-4">
    <div class="table-responsive">
      <table class="table table-hover mb-0 align-middle">
        <thead class="table-light">
          <tr><th>Candidat</th><th>Contact</th><th>Dépôt</th><th>CV</th><th>État</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-if="chargement"><td colspan="6" class="text-center text-muted py-4">Chargement…</td></tr>
          <tr v-else-if="!candidatures.length">
            <td colspan="6" class="text-center text-muted py-4">
              Aucune candidature{{ filtre ? ' dans cet état' : ' pour cette offre' }}.
            </td>
          </tr>
          <template v-else>
            <tr v-for="c in candidatures" :key="c.id" :class="{ 'table-primary': c.id === selection }">
              <td>
                <strong>{{ nomComplet(c) }}</strong>
                <span v-if="age(c.dateNaissance) !== null" class="text-muted small"> · {{ age(c.dateNaissance) }} ans</span>
              </td>
              <td class="small">
                <a :href="`mailto:${c.email}`">{{ c.email }}</a><br>
                <span class="text-muted">{{ c.telephone }}</span>
              </td>
              <td>{{ formatDate(c.dateDepot) }}</td>
              <td class="small text-muted text-nowrap">
                {{ pluriel(c.nbLignesCv, 'ligne') }} · {{ pluriel(c.nbPieces, 'pièce') }}
              </td>
              <td><BadgeEtat :etat="c.etat" /></td>
              <td class="text-end">
                <button type="button" class="btn btn-outline-primary btn-sm text-nowrap" @click="emit('ouvrir', c.id)">
                  Voir le dossier
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
