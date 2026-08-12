<script setup lang="ts">
import { ref } from 'vue'
import EmployeeManager from './components/EmployeeManager.vue'
import { login, type User } from './services/auth'

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const currentUser = ref<User | null>(null)
const accessToken = ref('')
const currentPage = ref<'dashboard' | 'employees'>('dashboard')

const modules = [
  { name: 'Employees', description: 'Manage employee profiles', icon: 'PE' },
  { name: 'Leave', description: 'Requests and approvals', icon: 'LV' },
  { name: 'Attendance', description: 'Track working time', icon: 'AT' },
  { name: 'Recruitment', description: 'Candidates and vacancies', icon: 'RC' },
]

async function submitLogin() {
  error.value = ''
  loading.value = true

  try {
    const response = await login(username.value.trim(), password.value)
    currentUser.value = response.user
    accessToken.value = response.accessToken
    password.value = ''
  } catch (requestError) {
    error.value =
      requestError instanceof Error ? requestError.message : 'Unable to sign in.'
  } finally {
    loading.value = false
  }
}

function logout() {
  currentUser.value = null
  accessToken.value = ''
  currentPage.value = 'dashboard'
  username.value = ''
}
</script>

<template>
  <main v-if="!currentUser" class="login-layout">
    <section class="brand-panel">
      <div class="brand-mark" aria-hidden="true">PF</div>
      <div>
        <p class="eyebrow">People operations, simplified</p>
        <h1>Welcome to PeopleFlow</h1>
        <p class="brand-copy">
          A learning-focused HR platform for employees, leave, attendance, and
          recruitment.
        </p>
      </div>
      <p class="copyright">Local development environment</p>
    </section>

    <section class="form-panel">
      <form class="login-card" @submit.prevent="submitLogin">
        <div class="mobile-brand">
          <span class="brand-mark small" aria-hidden="true">PF</span>
          <strong>PeopleFlow</strong>
        </div>
        <p class="eyebrow accent">Secure workspace</p>
        <h2>Sign in</h2>
        <p class="form-intro">Enter your administrator credentials to continue.</p>

        <label for="username">Username</label>
        <input
          id="username"
          v-model="username"
          name="username"
          type="text"
          autocomplete="username"
          required
          autofocus
        />

        <label for="password">Password</label>
        <input
          id="password"
          v-model="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
        />

        <p v-if="error" class="error-message" role="alert">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>

        <div class="demo-credentials">
          <strong>Demo credentials</strong>
          <span>Username: Admin</span>
          <span>Password: admin123</span>
        </div>
      </form>
    </section>
  </main>

  <div v-else class="app-shell">
    <aside>
      <div class="sidebar-brand">
        <span class="brand-mark small" aria-hidden="true">PF</span>
        <strong>PeopleFlow</strong>
      </div>
      <nav aria-label="Main navigation">
        <button
          type="button"
          :class="{ active: currentPage === 'dashboard' }"
          @click="currentPage = 'dashboard'"
        >
          Dashboard
        </button>
        <button
          v-for="module in modules"
          :key="module.name"
          type="button"
          :class="{ active: currentPage === 'employees' && module.name === 'Employees' }"
          :disabled="module.name !== 'Employees'"
          @click="module.name === 'Employees' && (currentPage = 'employees')"
        >
          {{ module.name }}
        </button>
      </nav>
    </aside>

    <main v-if="currentPage === 'dashboard'" class="dashboard">
      <header>
        <div>
          <p class="eyebrow accent">Administrator workspace</p>
          <h1>Good day, {{ currentUser.displayName }}</h1>
        </div>
        <button class="secondary-button" type="button" @click="logout">Sign out</button>
      </header>

      <section class="welcome-card">
        <div>
          <h2>Your HR workspace is ready</h2>
          <p>
            This first release includes authentication and the application shell.
            Employee management will be the next functional module.
          </p>
        </div>
        <span class="status-badge">Local environment</span>
      </section>

      <section aria-labelledby="modules-title">
        <h2 id="modules-title" class="section-title">Modules</h2>
        <div class="module-grid">
          <article
            v-for="module in modules"
            :key="module.name"
            :class="{ available: module.name === 'Employees' }"
            @click="module.name === 'Employees' && (currentPage = 'employees')"
          >
            <span class="module-icon" aria-hidden="true">{{ module.icon }}</span>
            <h3>{{ module.name }}</h3>
            <p>{{ module.description }}</p>
            <button
              v-if="module.name === 'Employees'"
              class="text-button"
              type="button"
              @click.stop="currentPage = 'employees'"
            >
              Open module
            </button>
            <span v-else class="coming-soon">Coming next</span>
          </article>
        </div>
      </section>
    </main>
    <main v-else class="dashboard">
      <EmployeeManager :token="accessToken" />
    </main>
  </div>
</template>
