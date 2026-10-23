<script setup>
import { computed, nextTick, onMounted, provide, reactive, ref, watch } from 'vue'
import { organisationApi } from '@/api/organisation'
import { TYPES_UNITE } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Chargement from '@/components/ui/Chargement.vue'
import NoeudUnite from '@/components/postes/NoeudUnite.vue'
import OrgNoeud from '@/components/postes/OrgNoeud.vue'

const VUES = { unites: 'Unités', postes: 'Postes et personnes', liste: 'Liste' }
let vueMemo = 'unites'
try { vueMemo = localStorage.getItem('sirh.orgaVue') || 'unites' } catch { /* stockage indisponible */ }
const vue = ref(VUES[vueMemo] ? vueMemo : 'unites')
function choisirVue(v) {
  vue.value = v
  try { localStorage.setItem('sirh.orgaVue', v) } catch { /* sans effet */ }
}

const arbre = ref(null)
const postes = ref([])
const uniteFiltre = ref(null)    // vue postes : limiter à une unité et ses sous-unités
const zoom = ref(1)
const replies = reactive(new Set())
provide('orgReplies', replies)

onMounted(async () => {
  const [a, p] = await Promise.all([organisationApi.organigramme(), organisationApi.postes({ etat: 'ACTIF' })])
  arbre.value = a
  postes.value = p
})

// toutes les unités à plat, et les sous-unités d'une unité donnée
const unitesPlates = computed(() => {
  const r = []
  const parcourir = (l, niveau) => l.forEach((u) => { r.push({ ...u, niveau }); parcourir(u.enfants, niveau + 1) })
  parcourir(arbre.value || [], 0)
  return r
})
function descendance(id) {
  const ids = new Set([id])
  let ajout = true
  while (ajout) {
    ajout = false
    unitesPlates.value.forEach((u) => { if (ids.has(u.idUniteMere) && !ids.has(u.id)) { ids.add(u.id); ajout = true } })
  }
  return ids
}

// arbre des postes selon le supérieur direct
const arbrePostes = computed(() => {
  const unites = uniteFiltre.value ? descendance(uniteFiltre.value) : null
  const liste = postes.value.filter((p) => !unites || unites.has(p.idUnite))
  const parId = new Map(liste.map((p) => [p.id, { ...p, enfants: [] }]))
  const racines = []
  parId.forEach((p) => {
    const sup = p.idSuperieur && parId.get(p.idSuperieur)
    if (sup) sup.enfants.push(p)
    else racines.push(p)
  })
  const trier = (l) => { l.sort((x, y) => (y.enfants.length - x.enfants.length) || x.libelle.localeCompare(y.libelle)); l.forEach((x) => trier(x.enfants)) }
  trier(racines)
  return racines
})

const racines = computed(() => (vue.value === 'postes' ? arbrePostes.value : arbre.value || []))
function toutDeplier() { replies.clear() }
function toutReplier() {
  const r = vue.value === 'postes' ? arbrePostes.value : arbre.value || []
  // garde le premier niveau visible
  r.forEach((n) => (n.enfants || []).forEach(function marquer(e) { if (e.enfants?.length) { replies.add(e.id); e.enfants.forEach(marquer) } }))
}
// le dessin est plus large que l'écran : on centre la vue sur le sommet de l'arbre
const cadre = ref(null)
async function centrer() {
  await nextTick()
  const c = cadre.value
  if (c) c.scrollLeft = Math.max(0, (c.scrollWidth - c.clientWidth) / 2)
}
watch([vue, uniteFiltre, () => arbre.value], centrer)
const zoomer = (d) => { zoom.value = Math.min(1.2, Math.max(0.5, Math.round((zoom.value + d) * 10) / 10)) }
</script>

<template>
  <PageHeader titre="Organigramme" sous-titre="Structure de l'organisation : unités et responsables, ou chaîne hiérarchique des postes avec leurs occupants. Cliquez sur une case pour ouvrir le détail." />
  <Chargement v-if="!arbre" />
  <template v-else>
    <div class="filters">
      <div class="segment" role="tablist" aria-label="Affichage">
        <button v-for="(l, k) in VUES" :key="k" type="button" role="tab" :aria-selected="vue === k" :class="{ on: vue === k }" @click="choisirVue(k)">{{ l }}</button>
      </div>
      <select v-if="vue === 'postes'" v-model="uniteFiltre" class="form-select" style="width:auto;min-width:240px" aria-label="Limiter à une unité">
        <option :value="null">Toute l'organisation</option>
        <option v-for="u in unitesPlates" :key="u.id" :value="u.id">{{ '  '.repeat(u.niveau) }}{{ u.libelle }}</option>
      </select>
      <div v-if="vue !== 'liste'" class="d-flex gap-1 align-items-center" style="margin-left:auto">
        <button type="button" class="btn btn-sm btn-light" @click="toutDeplier">Tout déplier</button>
        <button type="button" class="btn btn-sm btn-light" @click="toutReplier">Replier</button>
        <span class="oc-zoom">
          <button type="button" aria-label="Dézoomer" @click="zoomer(-0.1)">−</button>
          <span>{{ Math.round(zoom * 100) }} %</span>
          <button type="button" aria-label="Zoomer" @click="zoomer(0.1)">+</button>
        </span>
      </div>
    </div>

    <section class="panel">
      <div v-if="vue === 'liste'" class="panel-body">
        <div class="d-flex flex-wrap gap-3 small muted mb-3">
          <span v-for="(l, k) in TYPES_UNITE" :key="k"><span class="type-pastille" :class="k"></span>{{ l }}</span>
        </div>
        <ul class="orga"><NoeudUnite v-for="u in arbre" :key="u.id" :unite="u" /></ul>
      </div>
      <template v-else>
        <div v-if="vue === 'unites'" class="oc-legende">
          <span v-for="(l, k) in TYPES_UNITE" :key="k"><span class="type-pastille" :class="k"></span>{{ l }}</span>
        </div>
        <div v-else class="oc-legende">
          <span><span class="type-pastille" style="background:var(--sirh-primary)"></span>Poste occupé</span>
          <span><span class="type-pastille" style="background:#e9c46a"></span>Poste vacant</span>
          <span>{{ postes.length }} postes actifs, rattachés à leur supérieur direct</span>
        </div>
        <div ref="cadre" class="oc-cadre">
          <div class="oc" :style="{ zoom }">
            <ul v-if="racines.length"><OrgNoeud v-for="r in racines" :key="`${vue}-${r.id}`" :noeud="r" :mode="vue === 'postes' ? 'poste' : 'unite'" /></ul>
            <p v-else class="muted p-4">Aucun poste actif dans cette unité.</p>
          </div>
        </div>
      </template>
    </section>
  </template>
</template>

<style>
/* --- vue liste */
.orga, .orga ul { list-style: none; margin: 0; padding: 0; }
.orga ul { margin-left: 22px; padding-left: 18px; border-left: 1px solid var(--sirh-line); }
.orga-noeud { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; padding: 10px 12px; margin: 6px 0; border: 1px solid var(--sirh-line); border-radius: 8px; background: #fff; text-decoration: none; color: inherit; }
.orga-noeud:hover { border-color: var(--sirh-primary); }
.orga-noeud .t { min-width: 220px; }
.orga-noeud .t b { display: block; }
.orga-noeud .t small { color: var(--sirh-muted); }
.orga-stats { display: flex; gap: 16px; font-size: var(--fs-sm); color: var(--sirh-muted); margin-left: auto; }
.orga-stats b { color: var(--sirh-ink); }
.type-pastille { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }
.type-pastille.DIRECTION { background: #14322c; } .type-pastille.DEPARTEMENT { background: #13715f; }
.type-pastille.SERVICE { background: #7fb3a6; } .type-pastille.SECTION { background: #e9c46a; }

/* --- organigramme dessiné (arbre de haut en bas, traits de liaison en CSS) */
.oc-legende { display: flex; flex-wrap: wrap; gap: 8px 18px; padding: 12px 18px; border-bottom: 1px solid var(--sirh-line-2); font-size: var(--fs-xs); color: var(--sirh-muted); }
.oc-cadre { overflow: auto; padding: 28px 20px 36px; background:
  radial-gradient(circle, #dfe7e4 1px, transparent 1px) 0 0 / 18px 18px, #fbfcfc; min-height: 360px; max-height: calc(100vh - 250px); }
.oc { width: max-content; min-width: 100%; }
.oc ul { display: flex; justify-content: center; margin: 0; padding: 22px 0 0; position: relative; }
.oc > ul { padding-top: 0; }
.oc li { list-style: none; position: relative; padding: 22px 7px 0; display: flex; flex-direction: column; align-items: center; }
.oc > ul > li { padding-top: 0; }
.oc li::before, .oc li::after { content: ''; position: absolute; top: 0; right: 50%; width: 50%; height: 22px; border-top: 1.5px solid #b9c9c4; }
.oc li::after { right: auto; left: 50%; border-left: 1.5px solid #b9c9c4; }
.oc li:only-child::before, .oc li:only-child::after { display: none; }
.oc li:only-child { padding-top: 0; }
.oc li:first-child::before, .oc li:last-child::after { border: 0 none; }
.oc li:last-child::before { border-right: 1.5px solid #b9c9c4; border-radius: 0 6px 0 0; }
.oc li:first-child::after { border-radius: 6px 0 0 0; }
.oc ul ul::before { content: ''; position: absolute; top: 0; left: 50%; height: 22px; border-left: 1.5px solid #b9c9c4; }
.oc > ul > li::before, .oc > ul > li::after { display: none; }

/* enfants sans descendance : empilés en colonne */
.oc ul.pile { flex-direction: column; align-items: center; gap: 0; }
.oc ul.pile > li { padding: 10px 0 0; }
.oc ul.pile > li:first-child { padding-top: 0; }
.oc ul.pile > li::after { display: none; }
.oc ul.pile > li::before { display: block; border: 0; border-left: 1.5px solid #b9c9c4; border-radius: 0; width: 0; height: 10px; right: auto; left: 50%; }
.oc ul.pile > li:first-child::before { display: none; }

.oc-carte { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 1px; width: 210px; padding: 10px 12px 10px; text-align: left;
  background: #fff; border: 1px solid var(--sirh-line); border-radius: 8px; box-shadow: 0 1px 2px rgba(20, 50, 44, .06);
  color: var(--sirh-ink); text-decoration: none; transition: border-color .12s, box-shadow .12s; }
.oc-carte:hover { border-color: var(--sirh-primary); box-shadow: 0 4px 14px rgba(20, 50, 44, .12); color: var(--sirh-ink); }
.oc-carte.u { border-top: 4px solid #7fb3a6; }
.oc-carte.u.DIRECTION { border-top-color: #14322c; } .oc-carte.u.DEPARTEMENT { border-top-color: #13715f; }
.oc-carte.u.SECTION { border-top-color: #e9c46a; }
.oc-type { font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; color: var(--sirh-muted); }
.oc-titre { font-size: var(--fs-sm); font-weight: 650; line-height: 1.25; }
.oc-ligne { font-size: var(--fs-xs); line-height: 1.35; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.oc-chiffres { display: flex; gap: 10px; margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--sirh-line-2); font-size: var(--fs-xs); color: var(--sirh-muted); }
.oc-chiffres b { color: var(--sirh-ink); }
.oc-vac, .oc-vac b { color: #a5670f !important; font-weight: 600; }
.oc-carte.p { flex-direction: row; align-items: center; gap: 10px; width: 230px; border-left: 4px solid var(--sirh-primary); }
.oc-carte.p.vacant { border-left-color: #e9c46a; border-style: dashed solid dashed solid; background: #fffdf7; }
.oc-txt { display: flex; flex-direction: column; min-width: 0; }
.oc-avatar { flex: none; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; background: var(--sirh-primary-soft);
  color: var(--sirh-primary-strong); font-size: 11px; font-weight: 700; }
.oc-carte.vacant .oc-avatar { background: #fbefd5; color: #a5670f; }
.oc-pli { position: relative; z-index: 2; margin-top: -9px; min-width: 22px; height: 18px; padding: 0 6px; border-radius: 9px; border: 1px solid #b9c9c4;
  background: #fff; color: var(--sirh-ink-2); font-size: 11px; font-weight: 700; line-height: 1; cursor: pointer; }
.oc-pli:hover { border-color: var(--sirh-primary); color: var(--sirh-primary); }
.oc li:has(> .oc-pli) > ul { padding-top: 13px; }
.oc li:has(> .oc-pli) > ul::before { height: 13px; }
.oc li:has(> .oc-pli) > ul > li { padding-top: 22px; }
.oc li:has(> .oc-pli) > ul > li:only-child { padding-top: 0; }
.oc li:has(> .oc-pli) > ul.pile > li { padding-top: 10px; }
.oc li:has(> .oc-pli) > ul.pile > li:first-child { padding-top: 0; }
.oc-zoom { display: inline-flex; align-items: center; border: 1px solid var(--sirh-line); border-radius: 8px; background: #fff; margin-left: 4px; }
.oc-zoom button { border: 0; background: transparent; width: 30px; height: 30px; font-size: 16px; cursor: pointer; color: var(--sirh-ink-2); }
.oc-zoom span { min-width: 48px; text-align: center; font-size: var(--fs-xs); font-variant-numeric: tabular-nums; }
</style>
