<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { contratsApi } from '@/api/contrats'
import { useToast } from '@/composables/useToast'
import { dateFr, dateHeure, etat } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Rail from '@/components/ui/Rail.vue'
import Modal from '@/components/ui/Modal.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Icon from '@/components/ui/Icon.vue'
import DemandeContratForm from '@/components/contrat/DemandeContratForm.vue'
import { demandesContratApi } from '@/api/demandesContrat'

const props = defineProps({ id: { type: [String, Number], required: true } })
const router = useRouter()
const toast = useToast()
const c = ref(null)
const fichier = ref(null)
const enCours = ref(false)
const dialogue = ref(null)        // annuler | demande
const erreur = ref('')

const demandeContrat = ref(null)
async function charger() {
  c.value = await contratsApi.fiche(props.id)
  demandeContrat.value = null
  try { demandeContrat.value = (await demandesContratApi.contrats()).find((x) => x.idContrat === c.value.id) || null } catch { /* sans formulaire */ }
}
function demandeCreee(d) { dialogue.value = null; toast.ok('Demande enregistrée'); router.push(`/contrats/demandes/${d.id}`) }
onMounted(async () => {
  await charger()
})
watch(() => props.id, charger)

// Cycle de vie : créé (généré à l'embauche) → validé par la DRH → signé (copie déposée)
const rail = computed(() => {
  if (!c.value) return []
  const h = c.value.historique || []
  const quand = (s) => { const x = h.find((e) => e.statut === s); return x ? dateHeure(x.date) : null }
  const ordre = ['CREE', 'VALIDE', 'SIGNE']
  const pos = ordre.indexOf(c.value.statut)
  const fin = ['TERMINE', 'ANNULE'].includes(c.value.statut)
  const etapes = ordre.map((s, i) => ({
    titre: { CREE: 'Créé', VALIDE: 'Validé par la RH', SIGNE: 'Signé' }[s],
    meta: quand(s) || (i === pos + 1 && !fin ? 'Prochaine étape' : ''),
    statut: quand(s) ? 'fait' : i === pos + 1 && !fin ? 'en-cours' : 'a-venir',
  }))
  if (fin) etapes.push({ titre: etat('contrat', c.value.statut).libelle, meta: quand(c.value.statut), note: c.value.motifFin, statut: c.value.statut === 'ANNULE' ? 'refuse' : 'fait' })
  return etapes
})

async function agir(action, message) {
  erreur.value = ''
  enCours.value = true
  try {
    const r = await action()
    toast.ok(message)
    return r
  } catch (e) {
    erreur.value = e.message
    return null
  } finally {
    enCours.value = false
  }
}
const valider = async () => { if (await agir(() => contratsApi.valider(props.id), 'Contrat validé')) charger() }
const signer = async () => { if (await agir(() => contratsApi.signer(props.id), "Contrat signé : l'onboarding démarre")) charger() }
const annuler = async () => { dialogue.value = null; if (await agir(() => contratsApi.annuler(props.id), 'Contrat annulé')) charger() }
async function deposer() {
  if (!fichier.value) { erreur.value = 'Choisissez le PDF signé.'; return }
  if (await agir(() => contratsApi.deposer(props.id, fichier.value), 'Copie signée déposée')) { fichier.value = null; charger() }
}
</script>

<template>
  <Chargement v-if="!c" />
  <template v-else>
    <PageHeader :titre="`Contrat ${c.reference}`" :retour="c.idEmploye ? `/personnel/${c.idEmploye}` : '/contrats/echeances'" :retour-libelle="c.employe">
      <template #sous-titre>
        <p class="d-flex flex-wrap gap-2 align-items-center"><Statut type="contrat" :valeur="c.statut" /> {{ c.type }} — {{ c.employe }} ({{ c.matricule }}), {{ c.poste }}</p>
      </template>
      <a v-if="c.lienDocument" :href="c.lienDocument" target="_blank" rel="noopener" class="btn btn-light">
        <Icon name="file" /> {{ c.documentSigne ? 'Copie signée' : 'Contrat à imprimer' }}
      </a>
      <button v-if="c.statut === 'CREE'" type="button" class="btn btn-primary" :disabled="enCours" @click="valider">Valider le contrat</button>
      <button v-if="c.statut === 'SIGNE'" type="button" class="btn btn-primary" @click="dialogue = 'demande'">Proposer un renouvellement ou un avenant</button>
      <button v-if="['CREE', 'VALIDE'].includes(c.statut)" type="button" class="btn btn-outline-danger" @click="dialogue = 'annuler'">Annuler</button>
    </PageHeader>

    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>

    <section class="panel">
      <div class="panel-head"><h2>Cycle du contrat</h2></div>
      <div class="panel-body"><Rail :etapes="rail" /></div>
    </section>

    <section v-if="c.statut === 'VALIDE'" class="panel" style="border-color:#e9c98d">
      <div class="panel-head"><div><h2>Signature</h2><p>Imprimez le contrat, faites-le signer, déposez la copie signée puis confirmez la signature.</p></div></div>
      <div class="panel-body">
        <div class="form-grid">
          <div>
            <label class="form-label" for="pdf">Copie signée (PDF)</label>
            <input id="pdf" type="file" accept="application/pdf" class="form-control" @change="fichier = $event.target.files[0] || null">
          </div>
          <div class="d-flex align-items-end gap-2">
            <button type="button" class="btn btn-light" :disabled="enCours || !fichier" @click="deposer">Déposer</button>
            <button type="button" class="btn btn-primary" :disabled="enCours || !c.documentSigne" @click="signer"><Icon name="check" /> Confirmer la signature</button>
          </div>
        </div>
        <p v-if="c.documentSigne" class="small text-success mt-2 mb-0">Copie signée déposée : la signature peut être confirmée.</p>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head"><h2>Conditions</h2></div>
      <div class="panel-body">
        <dl class="facts">
          <div><dt>Type</dt><dd>{{ c.type }}</dd></div>
          <div><dt>Début</dt><dd>{{ dateFr(c.dateDebut) }}</dd></div>
          <div><dt>Fin prévue</dt><dd>{{ c.dateFinPrevue ? dateFr(c.dateFinPrevue) : 'Sans limite' }}</dd></div>
          <div><dt>Fin effective</dt><dd>{{ dateFr(c.dateFinEffective) }}</dd></div>
          <div><dt>Motif de fin</dt><dd>{{ c.motifFin || '—' }}</dd></div>
          <div><dt>Contrat précédent</dt><dd><RouterLink v-if="c.idPrecedent" :to="`/contrats/${c.idPrecedent}`">{{ c.referencePrecedent }}</RouterLink><template v-else>—</template></dd></div>
        </dl>
      </div>
    </section>

    <DemandeContratForm v-if="dialogue === 'demande'" :contrat="demandeContrat" titre="Proposer un renouvellement ou un avenant" @fermer="dialogue = null" @creee="demandeCreee" />
    <Modal v-if="dialogue === 'annuler'" titre="Annuler ce contrat ?" @fermer="dialogue = null">
      <p>Le contrat ne pourra plus être signé. L'historique est conservé.</p>
      <template #pied>
        <button type="button" class="btn btn-light" @click="dialogue = null">Garder le contrat</button>
        <button type="button" class="btn btn-danger" @click="annuler">Annuler le contrat</button>
      </template>
    </Modal>
  </template>
</template>
