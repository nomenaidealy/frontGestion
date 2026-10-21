<script setup>
import BesoinDetails from '../../components/besoins/BesoinDetails.vue'
import BesoinList from '../../components/besoins/BesoinList.vue'
import { useBesoins } from '../../composables/useBesoins'
import { apiConfig } from '../../services/api'

const { besoins, selectedBesoin, loading, validating, error, success, hasBesoins, canValidate, loadBesoins, selectBesoin, validateSelected } = useBesoins()
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><span class="brand-mark">S</span><span><b>SIRH</b><small>Gestion entreprise</small></span></div>
      <p class="nav-caption">PILOTAGE RH</p>
      <div class="feature-link active"><span class="feature-icon">◈</span><span><strong>Besoins</strong><small>Demandes et validations</small></span></div>
      <div class="sidebar-footer"><span class="status-dot"></span> API {{ apiConfig.baseUrl || 'locale' }}<small>Gestion des besoins</small></div>
    </aside>
    <main class="main-content">
      <header class="topbar"><div><span class="eyebrow">ESPACE ADMINISTRATION</span><h1>Fiche de besoin</h1></div><div class="profile"><span class="avatar">AD</span><span><b>Administrateur</b><small>Ressources humaines</small></span></div></header>
      <section class="content-wrap">
        <div class="intro-row"><div><p class="lead">Demandes de recrutement</p><p class="muted">Consultez une fiche et validez-la selon le workflow RH.</p></div><button class="quiet-button" :disabled="loading" @click="loadBesoins">↻ Actualiser</button></div>
        <div v-if="success" class="notice success">{{ success }}</div><div v-if="error" class="notice error">{{ error }}</div>
        <div class="besoins-layout"><BesoinList :besoins="besoins" :selected-id="selectedBesoin?.id" @select="selectBesoin" /><BesoinDetails :besoin="selectedBesoin" :can-validate="canValidate" :validating="validating" @validate="validateSelected" /></div>
        <div v-if="loading && !hasBesoins" class="loading-line"><span class="loader"></span> Chargement des fiches...</div>
      </section>
    </main>
  </div>
</template>
