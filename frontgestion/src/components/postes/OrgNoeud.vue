<script setup>
import { computed, inject } from 'vue'
import { TYPES_UNITE } from '@/utils/format'

// Un nœud de l'organigramme dessiné (unité ou poste) et ses enfants, récursivement.
// Les enfants sans descendance sont empilés verticalement pour garder un dessin compact.
const props = defineProps({
  noeud: { type: Object, required: true },
  mode: { type: String, default: 'unite' },      // 'unite' | 'poste'
})
const replies = inject('orgReplies')
const enfants = computed(() => props.noeud.enfants || [])
const ouvert = computed(() => !replies.has(props.noeud.id))
const pile = computed(() => enfants.value.length >= 3 && enfants.value.every((e) => !e.enfants?.length))
function basculer() {
  if (replies.has(props.noeud.id)) replies.delete(props.noeud.id)
  else replies.add(props.noeud.id)
}
const lien = computed(() => (props.mode === 'unite'
  ? { path: '/postes', query: { idUnite: props.noeud.id, etat: 'ACTIF' } }
  : `/postes/${props.noeud.id}`))
</script>

<template>
  <li>
    <RouterLink :to="lien" class="oc-carte" :class="mode === 'unite' ? `u ${noeud.type}` : ['p', noeud.statutOccupation === 'LIBRE' ? 'vacant' : '']">
      <template v-if="mode === 'unite'">
        <span class="oc-type">{{ TYPES_UNITE[noeud.type] || noeud.type }}</span>
        <b class="oc-titre">{{ noeud.libelle }}</b>
        <span class="oc-ligne">{{ noeud.responsable || 'Responsable non désigné' }}</span>
        <span class="oc-ligne muted">{{ noeud.posteResponsable }}</span>
        <span class="oc-chiffres">
          <span title="Employés en poste"><b>{{ noeud.effectif }}</b> en poste</span>
          <span v-if="noeud.vacants" class="oc-vac" title="Postes vacants"><b>{{ noeud.vacants }}</b> vacant{{ noeud.vacants > 1 ? 's' : '' }}</span>
        </span>
      </template>
      <template v-else>
        <span class="oc-avatar">{{ noeud.occupant ? noeud.occupant.split(' ').map((m) => m[0]).slice(0, 2).join('') : '?' }}</span>
        <span class="oc-txt">
          <b class="oc-titre">{{ noeud.libelle }}</b>
          <span class="oc-ligne" :class="{ 'oc-vac': !noeud.occupant }">{{ noeud.occupant || 'Poste vacant' }}</span>
          <span class="oc-ligne muted">{{ noeud.unite }}</span>
        </span>
      </template>
    </RouterLink>
    <button v-if="enfants.length" type="button" class="oc-pli" :aria-expanded="ouvert"
            :aria-label="ouvert ? 'Replier' : `Déplier (${enfants.length})`" @click="basculer">
      {{ ouvert ? '−' : `+${enfants.length}` }}
    </button>
    <ul v-if="enfants.length && ouvert" :class="{ pile }">
      <OrgNoeud v-for="e in enfants" :key="e.id" :noeud="e" :mode="mode" />
    </ul>
  </li>
</template>
