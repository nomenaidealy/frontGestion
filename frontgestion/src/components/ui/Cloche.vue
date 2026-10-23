<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { notificationsApi } from '@/api/notifications'
import { depuis } from '@/utils/format'
import Icon from './Icon.vue'

// Cloche de la barre du haut : nombre de notifications non lues, liste au clic.
const emit = defineEmits(['lu'])
const router = useRouter()
const ouvert = ref(false)
const nonLues = ref(0)
const liste = ref([])
let minuteur = null

async function compter() {
  try { nonLues.value = (await notificationsApi.compteur()).nonLues } catch { /* silencieux */ }
}
async function ouvrir() {
  ouvert.value = !ouvert.value
  if (ouvert.value) {
    try { liste.value = await notificationsApi.lister(false, 15) } catch { liste.value = [] }
  }
}
async function suivre(n) {
  ouvert.value = false
  if (!n.lu) {
    try { await notificationsApi.marquerLue(n.id) } catch { /* rien */ }
    compter(); emit('lu')
  }
  if (n.lien) router.push(n.lien)
}
async function toutLire() {
  await notificationsApi.toutLire()
  liste.value = liste.value.map((n) => ({ ...n, lu: true }))
  nonLues.value = 0
  emit('lu')
}
const fermer = (e) => { if (!e.target.closest('.cloche')) ouvert.value = false }
onMounted(() => { compter(); minuteur = setInterval(compter, 60000); document.addEventListener('click', fermer) })
onBeforeUnmount(() => { clearInterval(minuteur); document.removeEventListener('click', fermer) })
</script>

<template>
  <div class="cloche" style="position:relative">
    <button type="button" class="icon-btn" :aria-label="`Notifications (${nonLues} non lues)`" @click="ouvrir">
      <Icon name="bell" />
      <span v-if="nonLues" class="dot">{{ nonLues > 99 ? '99+' : nonLues }}</span>
    </button>
    <div v-if="ouvert" class="menu" style="width:360px;padding:8px">
      <div class="d-flex justify-content-between align-items-center" style="padding:4px 6px 8px">
        <b style="font-size:.875rem">Notifications</b>
        <button v-if="nonLues" type="button" class="btn btn-link btn-sm" style="width:auto;padding:0" @click="toutLire">Tout marquer comme lu</button>
      </div>
      <div class="notif-list">
        <div v-if="!liste.length" class="muted small" style="padding:14px 8px">Aucune notification pour le moment.</div>
        <a v-for="n in liste" :key="n.id" href="#" class="notif" :class="{ 'non-lue': !n.lu }" @click.prevent="suivre(n)">
          {{ n.message }}
          <small>{{ depuis(n.dateCreation) }}</small>
        </a>
      </div>
    </div>
  </div>
</template>
