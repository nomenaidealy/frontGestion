<script setup>
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'

const { login } = useAuth()

const username     = ref('')
const password     = ref('')
const showPassword = ref(false)
const loading      = ref(false)
const error        = ref('')

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await login(username.value, password.value)
    // La réactivité fait basculer App.vue vers BesoinsView
  } catch (e) {
    error.value = e.message || 'Connexion impossible'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <header class="brand">
        <div class="brand-badge">RH</div>
        <h1>Gestion RH</h1>
        <p>Connectez-vous à votre espace</p>
      </header>

      <form class="login-form" @submit.prevent="onSubmit" novalidate>
        <div class="field">
          <label for="username">Login</label>
          <input
            id="username"
            v-model.trim="username"
            type="text"
            autocomplete="username"
            placeholder="votre login"
            required
            :disabled="loading"
            autofocus
          />
        </div>

        <div class="field">
          <label for="password">Mot de passe</label>
          <div class="password-wrapper">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="••••••••"
              required
              :disabled="loading"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Masquer' : 'Afficher'"
            >
              {{ showPassword ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <transition name="fade">
          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </transition>

        <button type="submit" class="btn-submit" :disabled="loading">
          <span v-if="!loading">Se connecter</span>
          <span v-else class="spinner" aria-label="Chargement"></span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #1e3a8a 0%, #4f46e5 50%, #7c3aed 100%);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 18px;
  padding: 2.5rem 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
  animation: slideUp 0.35s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.brand {
  text-align: center;
  margin-bottom: 2rem;
}
.brand-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff;
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  margin-bottom: 1rem;
  box-shadow: 0 10px 20px -8px rgba(79, 70, 229, 0.55);
}
.brand h1 {
  margin: 0 0 0.25rem;
  font-size: 1.4rem;
  font-weight: 700;
  color: #111827;
}
.brand p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
}

.login-form { display: flex; flex-direction: column; gap: 1.1rem; }

.field { display: flex; flex-direction: column; gap: 0.4rem; }
.field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}
.field input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.7rem 0.9rem;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  background: #f9fafb;
  color: #111827;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  outline: none;
}
.field input:focus {
  border-color: #4f46e5;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.12);
}
.field input:disabled { opacity: 0.6; cursor: not-allowed; }

.password-wrapper { position: relative; }
.password-wrapper input { padding-right: 2.8rem; }
.toggle-password {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  border-radius: 6px;
  line-height: 1;
}
.toggle-password:hover { background: #eef2ff; }

.error {
  margin: 0;
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 0.88rem;
}

.btn-submit {
  margin-top: 0.5rem;
  padding: 0.85rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.15s, opacity 0.15s;
  box-shadow: 0 10px 20px -8px rgba(79, 70, 229, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 24px -8px rgba(79, 70, 229, 0.65);
}
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

.spinner {
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>