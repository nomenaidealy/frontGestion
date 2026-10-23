<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { adminApi } from '@/api/admin'
import { dateHeure } from '@/utils/format'
import PageHeader from '@/components/ui/PageHeader.vue'
import Vide from '@/components/ui/Vide.vue'
import Chargement from '@/components/ui/Chargement.vue'

const f = reactive({ q: '', du: '', au: '', resultat: '' })
const lignes = ref(null)
async function charger() { lignes.value = null; lignes.value = await adminApi.audit({ ...f, limite: 300 }) }
let minuteur
watch(f, () => { clearTimeout(minuteur); minuteur = setTimeout(charger, 300) })
onMounted(charger)
</script>

<template>
  <PageHeader titre="Journal d'audit" sous-titre="Toutes les actions qui modifient des données, avec leur auteur, la date et le résultat. Les 300 plus récentes selon les filtres." />
  <div class="filters">
    <input v-model="f.q" type="search" class="form-control form-control-sm search" placeholder="Utilisateur, action, adresse…" aria-label="Rechercher">
    <label class="small muted" for="du">Du</label><input id="du" v-model="f.du" type="date" class="form-control form-control-sm w-auto">
    <label class="small muted" for="au">au</label><input id="au" v-model="f.au" type="date" class="form-control form-control-sm w-auto">
    <div class="segment">
      <button v-for="[k, l] in [['', 'Tout'], ['SUCCES', 'Réussies'], ['ECHEC', 'Refusées']]" :key="k" type="button" :class="{ on: f.resultat === k }" @click="f.resultat = k">{{ l }}</button>
    </div>
  </div>
  <section class="panel">
    <Chargement v-if="lignes === null" />
    <Vide v-else-if="!lignes.length" titre="Aucune action" texte="Aucune action ne correspond à ces filtres." />
    <div v-else class="table-responsive">
      <table class="table table-sm">
        <thead><tr><th>Date</th><th>Utilisateur</th><th>Action</th><th>Détail</th><th>Résultat</th></tr></thead>
        <tbody>
          <tr v-for="j in lignes" :key="j.id">
            <td class="nowrap">{{ dateHeure(j.dateAction) }}</td>
            <td>{{ j.login || 'Anonyme' }}<span class="cell-sub">{{ j.adresseIp }}</span></td>
            <td class="cell-main">{{ j.action }}</td>
            <td><code>{{ j.methode }} {{ j.chemin }}</code></td>
            <td><span class="status" :class="j.statutHttp < 400 ? 'ok' : j.statutHttp === 403 ? 'wait' : 'ko'">{{ j.statutHttp < 400 ? 'Réussie' : j.statutHttp === 403 ? 'Accès refusé' : `Refusée (${j.statutHttp})` }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
