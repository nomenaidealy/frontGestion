import { computed, onMounted, ref } from 'vue'
import { besoinService } from '../services/besoinService'

function normalizeCollection(result) {
  if (Array.isArray(result)) return result
  return result?.content || result?.data || []
}

export function useBesoins() {
  const besoins = ref([])
  const selectedBesoin = ref(null)
  const loading = ref(false)
  const validating = ref(false)
  const error = ref('')
  const success = ref('')

  const hasBesoins = computed(() => besoins.value.length > 0)
  // Seul un besoin EN_ATTENTE attend une décision ; le back vérifie que c'est bien votre étape (RH, Finance, DG)
  const canValidate = computed(() => String(selectedBesoin.value?.etatActuel ?? '').toUpperCase() === 'EN_ATTENTE')

  async function loadBesoins() {
    loading.value = true
    error.value = ''
    try {
      besoins.value = normalizeCollection(await besoinService.list())
      if (selectedBesoin.value) {
        selectedBesoin.value = besoins.value.find((besoin) => besoin.id === selectedBesoin.value.id) || selectedBesoin.value
      }
    } catch (requestError) {
      error.value = requestError.message
    } finally {
      loading.value = false
    }
  }

  async function selectBesoin(besoin) {
    error.value = ''
    try {
      selectedBesoin.value = await besoinService.getById(besoin.id)
    } catch (requestError) {
      error.value = requestError.message
    }
  }

  async function validateSelected() {
    if (!selectedBesoin.value || !canValidate.value) return
    validating.value = true
    error.value = ''
    success.value = ''
    try {
      await besoinService.validate(selectedBesoin.value.id)
      success.value = 'Le besoin a été validé : il passe à l\'étape suivante.'
      await loadBesoins()
      await selectBesoin(selectedBesoin.value)
    } catch (requestError) {
      error.value = requestError.message
    } finally {
      validating.value = false
    }
  }

  async function refuseSelected() {
    if (!selectedBesoin.value || !canValidate.value) return
    if (!window.confirm(`Refuser le besoin ${selectedBesoin.value.reference} ? Il sera annulé.`)) return
    validating.value = true
    error.value = ''
    success.value = ''
    try {
      await besoinService.refuse(selectedBesoin.value.id)
      success.value = 'Le besoin a été refusé.'
      await loadBesoins()
      await selectBesoin(selectedBesoin.value)
    } catch (requestError) {
      error.value = requestError.message
    } finally {
      validating.value = false
    }
  }

  onMounted(loadBesoins)

  return { besoins, selectedBesoin, loading, validating, error, success, hasBesoins, canValidate, loadBesoins, selectBesoin, validateSelected, refuseSelected }
}
