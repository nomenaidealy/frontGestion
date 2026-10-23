<script setup>
import { onMounted, ref } from 'vue'
import { organisationApi } from '@/api/organisation'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { ariary, dateFr } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Statut from '@/components/ui/Statut.vue'
import Modal from '@/components/ui/Modal.vue'
import Chargement from '@/components/ui/Chargement.vue'
import PosteFormulaire from '@/components/postes/PosteFormulaire.vue'

const props = defineProps({ id: { type: [String, Number], required: true } })
const { a } = useAuth()
const toast = useToast()
const p = ref(null)
const edition = ref(null)
const confirmer = ref(false)

const charger = async () => { p.value = await organisationApi.poste(props.id) }
onMounted(charger)

function modifier() {
  edition.value = { libelle: p.value.libelle, idMetier: p.value.idMetier, idEchelon: p.value.idEchelon, idUniteOrga: p.value.idUnite, idSuperieurDirect: p.value.idSuperieur }
}
async function enregistrer() {
  try {
    p.value = await organisationApi.modifierPoste(p.value.id, edition.value)
    edition.value = null
    toast.ok('Poste modifié')
  } catch (e) { toast.erreur(e) }
}
async function supprimer() {
  try {
    p.value = await organisationApi.supprimerPoste(p.value.id)
    confirmer.value = false
    toast.ok('Poste supprimé')
  } catch (e) { confirmer.value = false; toast.erreur(e) }
}
async function decider(etat) {
  try { await organisationApi.deciderPoste(p.value.id, etat); await charger(); toast.ok(etat === 'ACTIF' ? 'Poste validé' : 'Poste refusé') } catch (e) { toast.erreur(e) }
}
</script>

<template>
  <Chargement v-if="!p" />
  <template v-else>
    <PageHeader :titre="p.libelle" retour="/postes" retour-libelle="Postes">
      <template #sous-titre>
        <p class="d-flex flex-wrap gap-2 align-items-center"><Statut type="poste" :valeur="p.etat" /> <Statut v-if="p.etat === 'ACTIF'" type="occupation" :valeur="p.statutOccupation" /> {{ p.code }} — {{ p.unite }}</p>
      </template>
      <template v-if="p.etat === 'PROPOSE' && !p.besoinReference && a('DG', 'ADMIN')">
        <button type="button" class="btn btn-outline-danger" @click="decider('REFUSE')">Refuser</button>
        <button type="button" class="btn btn-primary" @click="decider('ACTIF')">Valider le poste</button>
      </template>
      <template v-if="a('DG') && (p.etat === 'ACTIF' || p.etat === 'PROPOSE')">
        <button type="button" class="btn btn-light" @click="modifier">Modifier</button>
        <button v-if="p.etat === 'ACTIF'" type="button" class="btn btn-outline-danger" @click="confirmer = true">Supprimer</button>
      </template>
    </PageHeader>

    <div class="grid-2">
      <section class="panel">
        <div class="panel-head"><h2>Définition</h2></div>
        <div class="panel-body">
          <dl class="facts">
            <div><dt>Métier</dt><dd>{{ p.metier }}</dd></div>
            <div><dt>Catégorie</dt><dd>{{ p.categorie }}</dd></div>
            <div><dt>Échelon</dt><dd>{{ p.echelon }}</dd></div>
            <div><dt>Unité</dt><dd>{{ p.unite }}</dd></div>
            <div><dt>Supérieur direct</dt><dd><RouterLink v-if="p.idSuperieur" :to="`/postes/${p.idSuperieur}`">{{ p.superieur }}</RouterLink><template v-else>—</template></dd></div>
            <div><dt>Salaire mensuel (grille)</dt><dd>{{ p.salaireMin ? `${ariary(p.salaireMin)} à ${ariary(p.salaireMax)}` : 'Hors grille' }}</dd></div>
          </dl>
          <p v-if="p.besoinReference" class="small muted mt-3 mb-0">Créé par le besoin <RouterLink :to="`/besoins/${p.idBesoin}`">{{ p.besoinReference }}</RouterLink>.</p>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Occupant</h2></div>
        <div class="panel-body">
          <template v-if="p.occupant">
            <p class="mb-1"><RouterLink v-if="a('RH', 'DG', 'ADMIN')" :to="`/personnel/${p.idEmploye}`" class="fw-semibold">{{ p.occupant }}</RouterLink><b v-else>{{ p.occupant }}</b></p>
            <p class="small muted">{{ p.matricule }} — en poste depuis le {{ dateFr(p.depuis) }}</p>
          </template>
          <p v-else class="muted">Poste vacant.</p>
          <template v-if="p.subordonnes.length">
            <hr>
            <p class="small fw-semibold mb-2">Postes rattachés</p>
            <ul class="list-unstyled d-grid gap-1">
              <li v-for="s in p.subordonnes" :key="s.id"><RouterLink :to="`/postes/${s.id}`">{{ s.libelle }}</RouterLink></li>
            </ul>
          </template>
        </div>
      </section>
    </div>

    <Modal v-if="edition" titre="Modifier le poste" large @fermer="edition = null">
      <PosteFormulaire v-model="edition" :unite-fixe="p.statutOccupation === 'OCCUPE'" />
      <template #pied>
        <button type="button" class="btn btn-light" @click="edition = null">Annuler</button>
        <button type="button" class="btn btn-primary" @click="enregistrer">Enregistrer</button>
      </template>
    </Modal>
    <Modal v-if="confirmer" titre="Supprimer ce poste ?" @fermer="confirmer = false">
      <p>Le poste passe à l'état « supprimé » : il reste dans l'historique mais ne peut plus être pourvu.</p>
      <template #pied>
        <button type="button" class="btn btn-light" @click="confirmer = false">Garder le poste</button>
        <button type="button" class="btn btn-danger" @click="supprimer">Supprimer</button>
      </template>
    </Modal>
  </template>
</template>
