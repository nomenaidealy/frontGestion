<script setup>
import { ref } from 'vue'
import { onboardingApi } from '@/api/onboarding'
import { useToast } from '@/composables/useToast'
import { dateFr } from '@/utils/format'
import Statut from '@/components/ui/Statut.vue'

// Une tâche d'onboarding avec ses actions (fait, non applicable, rouvrir).
const props = defineProps({ tache: { type: Object, required: true }, avecEmploye: { type: Boolean, default: false } })
const emit = defineEmits(['change'])
const toast = useToast()
const commentaire = ref('')
const saisie = ref(false)

async function marquer(statut) {
  try {
    const o = await onboardingApi.marquer(props.tache.id, statut, commentaire.value.trim() || null)
    toast.ok(statut === 'FAIT' ? 'Tâche faite' : statut === 'A_FAIRE' ? 'Tâche rouverte' : 'Tâche marquée non applicable')
    if (o.statut === 'TERMINE' && statut !== 'A_FAIRE') toast.ok(`Onboarding de ${o.employe} terminé`)
    saisie.value = false
    commentaire.value = ''
    emit('change', o)
  } catch (e) { toast.erreur(e) }
}
</script>

<template>
  <div class="tache" :class="{ faite: tache.statut !== 'A_FAIRE', retard: tache.enRetard }">
    <div class="tache-main">
      <div class="tache-titre">
        {{ tache.libelle }}
        <span v-if="!tache.obligatoire" class="badge">facultative</span>
      </div>
      <div class="tache-meta">
        <template v-if="avecEmploye"><b>{{ tache.employe }}</b> ({{ tache.posteEmploye }}) — </template>
        {{ tache.posteResponsable }} —
        <span :class="{ 'text-danger fw-semibold': tache.enRetard }">échéance {{ dateFr(tache.dateEcheance) }}<template v-if="tache.enRetard"> (en retard)</template></span>
      </div>
      <div v-if="tache.statut !== 'A_FAIRE'" class="tache-meta">
        {{ tache.realisateur }} le {{ dateFr(tache.dateRealisation) }}<template v-if="tache.commentaire"> : « {{ tache.commentaire }} »</template>
      </div>
      <div v-if="saisie" class="input-group mt-2" style="max-width:520px">
        <input v-model="commentaire" class="form-control form-control-sm" placeholder="Commentaire (facultatif)" @keydown.enter.prevent="marquer('FAIT')">
        <button type="button" class="btn btn-sm btn-primary" @click="marquer('FAIT')">Confirmer</button>
      </div>
    </div>
    <div class="tache-actions">
      <Statut type="tache" :valeur="tache.statut" />
      <template v-if="tache.modifiable">
        <template v-if="tache.statut === 'A_FAIRE'">
          <button v-if="!saisie" type="button" class="btn btn-sm btn-primary" @click="saisie = true">Fait</button>
          <button v-if="!tache.obligatoire" type="button" class="btn btn-sm btn-light" @click="marquer('NON_APPLICABLE')">Non applicable</button>
        </template>
        <button v-else type="button" class="btn btn-sm btn-link" @click="marquer('A_FAIRE')">Rouvrir</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tache { display: flex; gap: 16px; align-items: flex-start; padding: 12px 18px; border-bottom: 1px solid var(--sirh-line-2); }
.tache:last-child { border-bottom: 0; }
.tache.retard { box-shadow: inset 3px 0 0 var(--sirh-danger); }
.tache.faite .tache-titre { color: var(--sirh-muted); }
.tache-main { flex: 1; min-width: 0; }
.tache-titre { font-weight: 600; }
.tache-meta { font-size: var(--fs-sm); color: var(--sirh-muted); margin-top: 2px; }
.tache-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
</style>
