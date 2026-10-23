<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { demandesContratApi } from '@/api/demandesContrat'
import { contratsApi } from '@/api/contrats'
import { ariary, MOTIFS_CONTRAT } from '@/utils/format'
import Modal from '@/components/ui/Modal.vue'

// Demande de nouveau contrat / avenant. contrat : un contrat éligible (salaire, grille…) ou null pour le choisir.
const props = defineProps({ contrat: { type: Object, default: null }, titre: { type: String, default: 'Nouvelle demande de contrat' } })
const emit = defineEmits(['fermer', 'creee'])

const liste = ref([])
const types = ref([])
const choix = ref(props.contrat?.idContrat ?? '')
const erreur = ref('')
const envoi = ref(false)
const f = reactive({ motifType: 'AUGMENTATION', idTypeContrat: '', dateEffet: '', dateFinPrevue: '', salaire: '', motif: '' })

onMounted(async () => {
  if (!props.contrat) liste.value = (await demandesContratApi.contrats()).filter((c) => !c.demandeEnCours)
  try { types.value = await contratsApi.types() } catch { /* types facultatifs */ }
})

const courant = computed(() => props.contrat || liste.value.find((c) => c.idContrat === Number(choix.value)) || null)
const estCdi = computed(() => courant.value?.type === 'CDI')
const motifs = computed(() => Object.entries(MOTIFS_CONTRAT).filter(([k]) => !estCdi.value || k === 'AUGMENTATION'))
const typesPossibles = computed(() => types.value.filter((t) => t.libelle !== courant.value?.type && t.libelle !== 'CE'))
const typeChoisi = computed(() => types.value.find((t) => t.id === Number(f.idTypeContrat)))
const finRequise = computed(() => f.motifType === 'RENOUVELLEMENT' || (f.motifType === 'TRANSFORMATION' && typeChoisi.value && typeChoisi.value.libelle !== 'CDI'))

watch(courant, (c) => {
  if (!c) return
  f.salaire = c.salaire
  if (!motifs.value.some(([k]) => k === f.motifType)) f.motifType = 'AUGMENTATION'
}, { immediate: true })

async function envoyer() {
  erreur.value = ''
  if (!courant.value) { erreur.value = 'Choisissez le contrat concerné.'; return }
  envoi.value = true
  try {
    const d = await demandesContratApi.creer({
      idContrat: courant.value.idContrat,
      motifType: f.motifType,
      idTypeContrat: f.motifType === 'TRANSFORMATION' && f.idTypeContrat ? Number(f.idTypeContrat) : null,
      dateEffet: f.dateEffet || null,
      dateFinPrevue: finRequise.value && f.dateFinPrevue ? f.dateFinPrevue : null,
      salaire: f.salaire === '' ? null : Number(f.salaire),
      motif: f.motif || null,
    })
    emit('creee', d)
  } catch (e) {
    erreur.value = e.message
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <Modal :titre="titre" large @fermer="emit('fermer')">
    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div class="form-grid">
      <div v-if="!contrat" class="full">
        <label class="form-label" for="dc-contrat">Contrat concerné *</label>
        <select id="dc-contrat" v-model="choix" class="form-select">
          <option value="">— choisir —</option>
          <option v-for="c in liste" :key="c.idContrat" :value="c.idContrat">{{ c.employe }} — {{ c.poste }} ({{ c.type }})</option>
        </select>
      </div>
      <p v-if="courant" class="full small muted mb-0">
        Contrat {{ courant.reference }} · {{ courant.type }} · salaire actuel <b>{{ ariary(courant.salaire) }}</b>
        <template v-if="courant.salaireMin != null"> · grille du poste : {{ ariary(courant.salaireMin) }} à {{ ariary(courant.salaireMax) }}</template>
      </p>
      <div>
        <label class="form-label" for="dc-motif">Objet de la demande *</label>
        <select id="dc-motif" v-model="f.motifType" class="form-select">
          <option v-for="[k, l] in motifs" :key="k" :value="k">{{ l }}</option>
        </select>
        <p v-if="estCdi" class="small muted mb-0 mt-1">Un CDI ne peut être ni renouvelé ni transformé : seule une augmentation est possible.</p>
      </div>
      <div v-if="f.motifType === 'TRANSFORMATION'">
        <label class="form-label" for="dc-type">Nouveau type de contrat *</label>
        <select id="dc-type" v-model="f.idTypeContrat" class="form-select">
          <option value="">— choisir —</option>
          <option v-for="t in typesPossibles" :key="t.id" :value="t.id">{{ t.libelle }}</option>
        </select>
      </div>
      <div>
        <label class="form-label" for="dc-salaire">Salaire mensuel brut demandé (Ar) *</label>
        <input id="dc-salaire" v-model="f.salaire" type="number" min="0" step="1000" class="form-control">
      </div>
      <div>
        <label class="form-label" for="dc-effet">Date d'effet <span class="muted">(par défaut : la plus proche possible)</span></label>
        <input id="dc-effet" v-model="f.dateEffet" type="date" class="form-control">
      </div>
      <div v-if="finRequise">
        <label class="form-label" for="dc-fin">Date de fin prévue *</label>
        <input id="dc-fin" v-model="f.dateFinPrevue" type="date" class="form-control">
      </div>
      <div class="full">
        <label class="form-label" for="dc-texte">Justification</label>
        <textarea id="dc-texte" v-model="f.motif" rows="3" class="form-control" placeholder="Pourquoi cette demande ?"></textarea>
      </div>
    </div>
    <template #pied>
      <button type="button" class="btn btn-light" @click="emit('fermer')">Annuler</button>
      <button type="button" class="btn btn-primary" :disabled="envoi" @click="envoyer">Envoyer la demande</button>
    </template>
  </Modal>
</template>
