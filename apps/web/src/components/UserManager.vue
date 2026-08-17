<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { listEmployees, type Employee } from "../services/employees";
import {
  createAccount,
  listAccounts,
  updateAccount,
  type Account,
} from "../services/hr";

const props = defineProps<{ token: string; currentUserId: number }>();
const accounts = ref<Account[]>([]);
const employees = ref<Employee[]>([]);
const error = ref("");
const form = reactive({
  username: "",
  password: "",
  displayName: "",
  role: "EMPLOYEE" as Account["role"],
  employeeId: 0,
});

async function load() {
  error.value = "";
  try {
    [accounts.value, employees.value] = await Promise.all([
      listAccounts(props.token),
      listEmployees(props.token),
    ]);
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Unable to load accounts.";
  }
}

async function submit() {
  error.value = "";
  try {
    await createAccount(props.token, {
      ...form,
      employeeId: form.employeeId || undefined,
    });
    Object.assign(form, {
      username: "",
      password: "",
      displayName: "",
      role: "EMPLOYEE",
      employeeId: 0,
    });
    await load();
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Unable to create account.";
  }
}

async function change(
  account: Account,
  input: { role?: Account["role"]; active?: boolean },
) {
  try {
    await updateAccount(props.token, account.id, input);
    await load();
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Unable to update account.";
  }
}

onMounted(load);
</script>

<template>
  <section class="module-page">
    <header class="page-header">
      <div>
        <p class="eyebrow accent">System administration</p>
        <h1>User Accounts</h1>
        <p>
          Create accounts, assign roles, link employees, and control access.
        </p>
      </div>
    </header>
    <p v-if="error" class="error-message" role="alert">{{ error }}</p>
    <form class="inline-form" @submit.prevent="submit">
      <label
        >Username<input v-model="form.username" required maxlength="80"
      /></label>
      <label
        >Display name<input v-model="form.displayName" required maxlength="120"
      /></label>
      <label
        >Temporary password<input
          v-model="form.password"
          type="password"
          required
          minlength="8"
          maxlength="128"
      /></label>
      <label
        >Role<select v-model="form.role">
          <option value="EMPLOYEE">Employee</option>
          <option value="ADMIN">Administrator</option>
        </select></label
      >
      <label
        >Employee (optional)<select v-model.number="form.employeeId">
          <option :value="0">Not linked</option>
          <option
            v-for="employee in employees"
            :key="employee.id"
            :value="employee.id"
          >
            {{ employee.employeeNumber }} - {{ employee.firstName }}
            {{ employee.lastName }}
          </option>
        </select></label
      >
      <button class="primary-button" type="submit">Create account</button>
    </form>
    <div class="data-card table-scroll">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Linked employee</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in accounts" :key="account.id">
            <td>
              <strong>{{ account.displayName }}</strong
              ><span>{{ account.username }}</span>
            </td>
            <td>
              {{
                account.employee
                  ? `${account.employee.employeeNumber} - ${account.employee.firstName} ${account.employee.lastName}`
                  : "Not linked"
              }}
            </td>
            <td>
              <select
                :value="account.role"
                @change="
                  change(account, {
                    role: ($event.target as HTMLSelectElement)
                      .value as Account['role'],
                  })
                "
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </td>
            <td>
              <span
                class="record-status"
                :class="account.active ? 'approved' : 'rejected'"
                >{{ account.active ? "ACTIVE" : "DISABLED" }}</span
              >
            </td>
            <td>
              <button
                class="text-button"
                type="button"
                :disabled="account.id === currentUserId"
                @click="change(account, { active: !account.active })"
              >
                {{ account.active ? "Disable" : "Enable" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
