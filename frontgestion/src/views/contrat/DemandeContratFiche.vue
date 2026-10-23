<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { demandesContratApi } from '@/api/demandesContrat'
import { useToast } from '@/composables/useToast'
import { ariary, dateFr, dateHeure, MOTIFS_CONTRAT, ORIGINES_DEMANDE } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Rail from '@/components/ui/Rail.vue'
import Chargement from '@/components/ui/Chargement.vue'
import Icon from '@/components/ui/Icon.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const toast = useToast()
const d = ref(null)
const erreur = ref('')
const enCours = ref(false)
const commentaire = ref('')
const aj = reactive({ salaire: '', dateEffet: '', dateFinPrevue: '' })   // ajustements de la RH

async function charger() {
  d.value = await demandesContratApi.fiche(props.id)
  Object.assign(aj, { salaire: d.value.salaire, dateEffet: d.value.dateEffet, dateFinPrevue: d.value.dateFinPrevue || '' })
}
onMounted(charger)
watch(() => props.id, charger)

// Rail : demande → instruction RH → (avis Finance) → décision DG
const rail = computed(() => {
  if (!d.value) return []
  const x = d.value
  const ordre = ['A_INSTRUIRE', 'A_VALIDER_FINANCE', 'A_VALIDER_DG']
  const pos = ordre.indexOf(x.etat)
  const clos = pos < 0
  const par = (nom) => x.etapes.find((e) => e.etape.startsWith(nom))
  const ligne = (titre, nom, i, doit = true) => {
    const e = par(nom)
    return doit && {
      titre, statut: e ? 'fait' : !clos && i === pos ? 'en-cours' : 'a-venir',
      meta: e ? `${e.par} — ${dateHeure(e.date)}` : !clos && i === pos ? 'Étape en cours' : '',
      note: e?.commentaire,
    }
  }
  const out = [
    { titre: `${ORIGINES_DEMANDE[x.origine]}`, statut: 'fait', meta: `${x.demandeur} — ${dateHeure(x.dateDemande)}`, note: x.motif },
    ['RH', 'DG'].includes(x.origine) ? null : ligne('Instruction RH', 'Instruction', 0),
    x.depassementBudget || par('Avis') ? ligne('Avis de la Finance (budget dépassé)', 'Avis', 1) : null,
    ligne('Décision du DG', 'Décision', 2),
  ].filter(Boolean)
  if (x.etat === 'REFUSEE') {
    const dernier = out.findLast((e) => e.statut !== 'fait') || out[out.length - 1]
    dernier.statut = 'refuse'
    out.forEach((e) => { if (e.statut === 'a-venir' && e !== dernier) e.statut = 'non-atteinte' })
  }
  if (x.etat === 'ANNULEE') out.push({ titre: 'Demande annulée', statut: 'refuse' })
  return out
})

async function agir(action, message) {
  erreur.value = ''
  enCours.value = true
  try {
    await action()
    toast.ok(message)
    commentaire.value = ''
    await charger()
  } catch (e) {
    erreur.value = e.message
  } finally {
    enCours.value = false
  }
}
const decision = (accepter) => ({ accepter, commentaire: commentaire.value || null })
const instruire = (accepter) => agir(() => demandesContratApi.instruire(props.id, {
  ...decision(accepter),
  ...(accepter ? { salaire: Number(aj.salaire), dateEffet: aj.dateEffet || null, dateFinPrevue: aj.dateFinPrevue || null } : {}),
}), accepter ? 'Demande transmise' : 'Demande refusée')
const financer = (accepter) => agir(() => demandesContratApi.finance(props.id, decision(accepter)), accepter ? 'Avis favorable enregistré' : 'Demande refusée')
const decider = (accepter) => agir(() => demandesContratApi.decider(props.id, decision(accepter)), accepter ? 'Demande validée' : 'Demande refusée')
const annuler = () => agir(() => demandesContratApi.annuler(props.id), 'Demande annulée')
</script>

<template>
  <Chargement v-if="!d" />
  <template v-else>
    <PageHeader :titre="`Demande ${d.reference}`" retour="/contrats/demandes" retour-libelle="Demandes de contrat">
      <template #sous-titre>
        <p class="d-flex flex-wrap gap-2 align-items-center">
          <Statut type="demandeContrat" :valeur="d.etat" /> {{ MOTIFS_CONTRAT[d.motifType] }} — {{ d.employe }} ({{ d.matricule }}), {{ d.poste }}
        </p>
      </template>
      <button v-if="d.peutAnnuler" type="button" class="btn btn-outline-danger" :disabled="enCours" @click="annuler">Annuler la demande</button>
    </PageHeader>

    <div v-if="erreur" class="alert alert-danger">{{ erreur }}</div>
    <div v-if="d.depassementBudget" class="alert alert-warning">
      Le surcoût annuel ({{ ariary(d.surcoutAnnuel) }}) dépasse le disponible du budget de l'unité
      <template v-if="d.disponible != null">({{ ariary(d.disponible) }})</template> : l'avis de la Finance précède la décision du DG.
    </div>

    <div class="row g-3">
      <div class="col-lg-7">
        <section class="panel">
          <div class="panel-head"><h2>Contrat actuel et demande</h2></div>
          <div class="table-responsive">
            <table class="table">
              <thead><tr><th></th><th>Actuel</th><th>Demandé</th></tr></thead>
              <tbody>
                <tr><th>Contrat</th><td><RouterLink :to="`/contrats/${d.idContrat}`">{{ d.contratRef }}</RouterLink></td>
                  <td><RouterLink v-if="d.idContratResultat && d.idContratResultat !== d.idContrat" :to="`/contrats/${d.idContratResultat}`">{{ d.contratResultatRef }}</RouterLink><template v-else>—</template></td></tr>
                <tr><th>Type</th><td>{{ d.typeActuel }}</td><td>{{ d.typeDemande }}</td></tr>
                <tr><th>Salaire mensuel brut</th><td>{{ ariary(d.salaireActuel) }}</td><td><b>{{ ariary(d.salaire) }}</b></td></tr>
                <tr><th>Début / effet</th><td>{{ dateFr(d.debutActuel) }}</td><td>{{ dateFr(d.dateEffet) }}</td></tr>
                <tr><th>Fin prévue</th><td>{{ d.finActuelle ? dateFr(d.finActuelle) : 'Sans limite' }}</td><td>{{ d.motifType === 'AUGMENTATION' ? 'inchangée' : d.dateFinPrevue ? dateFr(d.dateFinPrevue) : 'Sans limite' }}</td></tr>
                <tr v-if="d.salaireMin != null"><th>Grille du poste</th><td colspan="2">{{ ariary(d.salaireMin) }} à {{ ariary(d.salaireMax) }}</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="d.peutInstruire" class="panel" style="border-color:#e9c98d">
          <div class="panel-head"><div><h2>Instruction RH</h2><p>Vous pouvez ajuster le salaire et les dates avant de transmettre la demande.</p></div></div>
          <div class="panel-body">
            <div class="form-grid">
              <div><label class="form-label" for="aj-sal">Salaire mensuel (Ar)</label><input id="aj-sal" v-model="aj.salaire" type="number" min="0" step="1000" class="form-control"></div>
              <div><label class="form-label" for="aj-eff">Date d'effet</label><input id="aj-eff" v-model="aj.dateEffet" type="date" class="form-control"></div>
              <div v-if="d.motifType !== 'AUGMENTATION'"><label class="form-label" for="aj-fin">Date de fin prévue</label><input id="aj-fin" v-model="aj.dateFinPrevue" type="date" class="form-control"></div>
              <div class="full"><label class="form-label" for="c-rh">Commentaire (obligatoire pour refuser)</label><textarea id="c-rh" v-model="commentaire" rows="2" class="form-control"></textarea></div>
            </div>
            <div class="d-flex gap-2 mt-3">
              <button type="button" class="btn btn-primary" :disabled="enCours" @click="instruire(true)"><Icon name="check" /> Transmettre</button>
              <button type="button" class="btn btn-outline-danger" :disabled="enCours" @click="instruire(false)">Refuser</button>
            </div>
          </div>
        </section>

        <section v-if="d.peutFinance || d.peutDecider" class="panel" style="border-color:#e9c98d">
          <div class="panel-head"><div><h2>{{ d.peutFinance ? 'Avis de la Finance' : 'Décision du DG' }}</h2></div></div>
          <div class="panel-body">
            <label class="form-label" for="c-dec">Commentaire (obligatoire pour refuser)</label>
            <textarea id="c-dec" v-model="commentaire" rows="2" class="form-control"></textarea>
            <div class="d-flex gap-2 mt-3">
              <button v-if="d.peutFinance" type="button" class="btn btn-primary" :disabled="enCours" @click="financer(true)"><Icon name="check" /> Avis favorable</button>
              <button v-if="d.peutDecider" type="button" class="btn btn-primary" :disabled="enCours" @click="decider(true)"><Icon name="check" /> Valider</button>
              <button type="button" class="btn btn-outline-danger" :disabled="enCours" @click="d.peutFinance ? financer(false) : decider(false)">Refuser</button>
            </div>
            <p v-if="d.peutDecider" class="small muted mt-2 mb-0">
              {{ d.motifType === 'AUGMENTATION' ? 'Le nouveau salaire s\'applique au contrat en cours à la date d\'effet.' : 'Un nouveau contrat est créé (à valider et signer par la RH) ; l\'actuel est terminé la veille.' }}
            </p>
          </div>
        </section>
      </div>
      <div class="col-lg-5">
        <section class="panel">
          <div class="panel-head"><h2>Suivi</h2></div>
          <div class="panel-body"><Rail :etapes="rail" /></div>
        </section>
      </div>
    </div>
  </template>
</template>
