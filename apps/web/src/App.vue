<script setup lang="ts">
import { ref } from "vue";
import EmployeeManager from "./components/EmployeeManager.vue";
import LeaveManager from "./components/LeaveManager.vue";
import RecruitmentManager from "./components/RecruitmentManager.vue";
import UserManager from "./components/UserManager.vue";
import { login, type User } from "./services/auth";

const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const currentUser = ref<User | null>(null);
const accessToken = ref("");
type Page = "dashboard" | "admin" | "employees" | "leave" | "recruitment";
const currentPage = ref<Page>("dashboard");

const modules = [
  {
    name: "Admin",
    page: "admin",
    description: "Users, roles, and access",
    icon: "AD",
    available: true,
  },
  {
    name: "Employees",
    page: "employees",
    description: "Manage employee profiles",
    icon: "PE",
    available: true,
  },
  {
    name: "Leave",
    page: "leave",
    description: "Requests and approvals",
    icon: "LV",
    available: true,
  },
  {
    name: "Recruitment",
    page: "recruitment",
    description: "Candidates and vacancies",
    icon: "RC",
    available: true,
  },
  {
    name: "Time",
    page: null,
    description: "Attendance and timesheets",
    icon: "TM",
    available: false,
  },
  {
    name: "Performance",
    page: null,
    description: "Reviews and goals",
    icon: "PF",
    available: false,
  },
  {
    name: "Directory",
    page: null,
    description: "Organization directory",
    icon: "DR",
    available: false,
  },
  {
    name: "Claims",
    page: null,
    description: "Expense claims",
    icon: "CL",
    available: false,
  },
];

async function submitLogin() {
  error.value = "";
  loading.value = true;

  try {
    const response = await login(username.value.trim(), password.value);
    currentUser.value = response.user;
    accessToken.value = response.accessToken;
    password.value = "";
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Unable to sign in.";
  } finally {
    loading.value = false;
  }
}

function logout() {
  currentUser.value = null;
  accessToken.value = "";
  currentPage.value = "dashboard";
  username.value = "";
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
          A practical HR platform for employees, leave, attendance, and recruitment.
        </p>
      </div>
      <p class="copyright">Local development workspace</p>
    </section>

    <section class="form-panel">
      <form class="login-card" @submit.prevent="submitLogin">
        <div class="mobile-brand">
          <span class="brand-mark small" aria-hidden="true">PF</span>
          <strong>PeopleFlow</strong>
        </div>
        <p class="eyebrow accent">Secure workspace</p>
        <h2>Sign in</h2>
        <p class="form-intro">
          Enter your administrator credentials to continue.
        </p>

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
          {{ loading ? "Signing in..." : "Sign in" }}
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
          :class="{ active: currentPage === module.page }"
          :disabled="!module.available"
          @click="module.page && (currentPage = module.page as Page)"
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
        <button class="secondary-button" type="button" @click="logout">
          Sign out
        </button>
      </header>

      <section class="welcome-card">
        <div>
          <h2>Your HR workspace is ready</h2>
          <p>
            Employee, leave, recruitment, and user administration workflows are
            available from this workspace.
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
            :class="{ available: module.available }"
            @click="module.page && (currentPage = module.page as Page)"
          >
            <span class="module-icon" aria-hidden="true">{{
              module.icon
            }}</span>
            <h3>{{ module.name }}</h3>
            <p>{{ module.description }}</p>
            <button
              v-if="module.available"
              class="text-button"
              type="button"
              @click.stop="module.page && (currentPage = module.page as Page)"
            >
              Open module
            </button>
            <span v-else class="coming-soon">Coming next</span>
          </article>
        </div>
      </section>
    </main>
    <main v-else class="dashboard">
      <EmployeeManager
        v-if="currentPage === 'employees'"
        :token="accessToken"
      />
      <LeaveManager v-else-if="currentPage === 'leave'" :token="accessToken" />
      <RecruitmentManager
        v-else-if="currentPage === 'recruitment'"
        :token="accessToken"
      />
      <UserManager
        v-else-if="currentPage === 'admin'"
        :token="accessToken"
        :current-user-id="currentUser.id"
      />
    </main>
  </div>
</template>
