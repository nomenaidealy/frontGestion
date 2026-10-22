<script setup>
import { computed } from 'vue'
import { candidaturesRhApi as api, ETATS_CANDIDATURE, TYPES_LIGNE_CV } from '@/api/candidatures'
import { formatDate } from '@/views/offres/format'
import BadgeEtat from './BadgeEtat.vue'
import { age, nomComplet } from './candidat'

const props = defineProps({ fiche: { type: Object, required: true } })
// ouvrirAutre(candidature) : afficher une autre candidature de la même personne
const emit = defineEmits(['ouvrirAutre'])

const candidat = computed(() => props.fiche.candidat)

/** Lignes du CV regroupées par type : expériences, formations, qualités. */
const lignesParType = computed(() =>
  Object.entries(TYPES_LIGNE_CV)
    .map(([code, titre]) => ({ code, titre, lignes: props.fiche.lignesCv.filter((l) => l.type === code) }))
    .filter((g) => g.lignes.length),
)

function periode(l) {
  if (l.dateDebut && l.dateFin) return `${formatDate(l.dateDebut)} – ${formatDate(l.dateFin)}`
  if (l.dateDebut) return `depuis ${formatDate(l.dateDebut)}`
  if (l.dateFin) return `jusqu'au ${formatDate(l.dateFin)}`
  return ''
}
</script>

<template>
  <div class="card shadow-sm">
    <div class="card-header d-flex justify-content-between align-items-start">
      <div>
        <h5 class="mb-0">{{ nomComplet(candidat) }}</h5>
        <div class="small text-muted">
          Candidature à {{ fiche.referenceOffre }} déposée le {{ formatDate(fiche.dateDepot) }}
        </div>
      </div>
      <BadgeEtat :etat="fiche.etat" />
    </div>
    <div class="card-body">
      <dl class="row mb-0">
        <dt class="col-sm-3">Email</dt>
        <dd class="col-sm-9"><a :href="`mailto:${candidat.email}`">{{ candidat.email }}</a></dd>
        <dt class="col-sm-3">Téléphone</dt>
        <dd class="col-sm-9">{{ candidat.telephone || '—' }}</dd>
        <dt class="col-sm-3">Date de naissance</dt>
        <dd class="col-sm-9">
          {{ formatDate(candidat.dateNaissance) }}
          <span v-if="age(candidat.dateNaissance) !== null" class="text-muted">({{ age(candidat.dateNaissance) }} ans)</span>
        </dd>
        <dt class="col-sm-3">Adresse</dt>
        <dd class="col-sm-9">{{ candidat.adresse || '—' }}</dd>
      </dl>

      <hr>
      <h6>Pièces jointes</h6>
      <p v-if="!fiche.pieces.length" class="text-muted small mb-0">Aucune pièce jointe.</p>
      <ul v-else class="mb-0">
        <li v-for="p in fiche.pieces" :key="p.idDocument">
          <a :href="api.urlPiece(fiche.id, p.idDocument)" target="_blank" rel="noopener">{{ p.nomFichier }}</a>
          <span class="text-muted small"> · {{ p.type }}</span>
        </li>
      </ul>

      <hr>
      <h6>Parcours</h6>
      <p v-if="!lignesParType.length" class="text-muted small mb-0">Le candidat n'a saisi aucune ligne de parcours.</p>
      <div v-for="g in lignesParType" :key="g.code" class="mb-2">
        <div class="small text-muted fw-semibold">{{ g.titre }}</div>
        <ul class="mb-0">
          <li v-for="(l, i) in g.lignes" :key="i">
            {{ l.libelle }}<span v-if="periode(l)" class="text-muted small"> · {{ periode(l) }}</span>
          </li>
        </ul>
      </div>

      <template v-if="fiche.autresCandidatures.length">
        <hr>
        <h6>Autres candidatures de cette personne</h6>
        <ul class="mb-0">
          <li v-for="a in fiche.autresCandidatures" :key="a.id">
            <button type="button" class="btn btn-link p-0 align-baseline" @click="emit('ouvrirAutre', a)">{{ a.referenceOffre }}</button>
            <span class="text-muted small"> · {{ formatDate(a.dateDepot) }} · {{ ETATS_CANDIDATURE[a.etat] ?? a.etat }}</span>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>
