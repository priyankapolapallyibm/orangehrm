<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  createEmployee,
  deleteEmployee,
  listEmployees,
  updateEmployee,
  type Employee,
  type EmployeeInput,
} from '../services/employees'

const props = defineProps<{ token: string }>()

const employees = ref<Employee[]>([])
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const formOpen = ref(false)
const editingId = ref<number | null>(null)

const emptyForm = (): EmployeeInput => ({
  employeeNumber: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  jobTitle: '',
  department: '',
  employmentStatus: 'ACTIVE',
  dateOfJoining: new Date().toISOString().slice(0, 10),
})

const form = reactive<EmployeeInput>(emptyForm())

async function loadEmployees() {
  loading.value = true
  error.value = ''

  try {
    employees.value = await listEmployees(props.token, search.value.trim())
  } catch (requestError) {
    error.value =
      requestError instanceof Error ? requestError.message : 'Unable to load employees.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(form, emptyForm())
  editingId.value = null
}

function openCreateForm() {
  resetForm()
  formOpen.value = true
}

function openEditForm(employee: Employee) {
  Object.assign(form, {
    employeeNumber: employee.employeeNumber,
    firstName: employee.firstName,
    middleName: employee.middleName ?? '',
    lastName: employee.lastName,
    email: employee.email,
    jobTitle: employee.jobTitle,
    department: employee.department,
    employmentStatus: employee.employmentStatus,
    dateOfJoining: employee.dateOfJoining.slice(0, 10),
  })
  editingId.value = employee.id
  formOpen.value = true
}

function formatCalendarDate(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

async function saveEmployee() {
  saving.value = true
  error.value = ''

  try {
    if (editingId.value) {
      await updateEmployee(props.token, editingId.value, form)
    } else {
      await createEmployee(props.token, form)
    }
    formOpen.value = false
    resetForm()
    await loadEmployees()
  } catch (requestError) {
    error.value =
      requestError instanceof Error ? requestError.message : 'Unable to save employee.'
  } finally {
    saving.value = false
  }
}

async function removeEmployee(employee: Employee) {
  const confirmed = window.confirm(
    `Delete ${employee.firstName} ${employee.lastName}? This cannot be undone.`,
  )
  if (!confirmed) return

  error.value = ''
  try {
    await deleteEmployee(props.token, employee.id)
    await loadEmployees()
  } catch (requestError) {
    error.value =
      requestError instanceof Error ? requestError.message : 'Unable to delete employee.'
  }
}

onMounted(loadEmployees)
</script>

<template>
  <section class="employees-page">
    <header class="page-header">
      <div>
        <p class="eyebrow accent">People information management</p>
        <h1>Employees</h1>
        <p>Maintain employee profiles, roles, departments, and employment status.</p>
      </div>
      <button class="primary-button" type="button" @click="openCreateForm">
        Add employee
      </button>
    </header>

    <p v-if="error" class="error-message page-error" role="alert">{{ error }}</p>

    <form class="search-bar" role="search" @submit.prevent="loadEmployees">
      <label class="sr-only" for="employee-search">Search employees</label>
      <input
        id="employee-search"
        v-model="search"
        type="search"
        placeholder="Search by name, number, email, or department"
      />
      <button class="secondary-button" type="submit">Search</button>
      <button
        v-if="search"
        class="text-button"
        type="button"
        @click="search = ''; loadEmployees()"
      >
        Clear
      </button>
    </form>

    <div class="employee-table-card">
      <p v-if="loading" class="table-message">Loading employees...</p>
      <p v-else-if="employees.length === 0" class="table-message">
        No employees match your search.
      </p>
      <div v-else class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Job title</th>
              <th>Department</th>
              <th>Status</th>
              <th>Joined</th>
              <th><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in employees" :key="employee.id">
              <td>
                <strong>{{ employee.firstName }} {{ employee.lastName }}</strong>
                <span>{{ employee.employeeNumber }} · {{ employee.email }}</span>
              </td>
              <td>{{ employee.jobTitle }}</td>
              <td>{{ employee.department }}</td>
              <td>
                <span class="employee-status" :class="employee.employmentStatus.toLowerCase()">
                  {{ employee.employmentStatus.replace('_', ' ') }}
                </span>
              </td>
              <td>{{ formatCalendarDate(employee.dateOfJoining) }}</td>
              <td class="row-actions">
                <button type="button" class="text-button" @click="openEditForm(employee)">
                  Edit
                </button>
                <button
                  type="button"
                  class="text-button danger"
                  @click="removeEmployee(employee)"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="formOpen" class="modal-backdrop" @click.self="formOpen = false">
      <form class="employee-form" @submit.prevent="saveEmployee">
        <div class="form-heading">
          <div>
            <p class="eyebrow accent">{{ editingId ? 'Update profile' : 'New profile' }}</p>
            <h2>{{ editingId ? 'Edit employee' : 'Add employee' }}</h2>
          </div>
          <button
            class="icon-button"
            type="button"
            aria-label="Close employee form"
            @click="formOpen = false"
          >
            ×
          </button>
        </div>

        <div class="form-grid">
          <label>
            Employee number
            <input v-model="form.employeeNumber" required maxlength="30" />
          </label>
          <label>
            Email
            <input v-model="form.email" type="email" required maxlength="160" />
          </label>
          <label>
            First name
            <input v-model="form.firstName" required maxlength="80" />
          </label>
          <label>
            Middle name
            <input v-model="form.middleName" maxlength="80" />
          </label>
          <label>
            Last name
            <input v-model="form.lastName" required maxlength="80" />
          </label>
          <label>
            Date of joining
            <input v-model="form.dateOfJoining" type="date" required />
          </label>
          <label>
            Job title
            <input v-model="form.jobTitle" required maxlength="120" />
          </label>
          <label>
            Department
            <input v-model="form.department" required maxlength="120" />
          </label>
          <label>
            Employment status
            <select v-model="form.employmentStatus">
              <option value="ACTIVE">Active</option>
              <option value="ON_LEAVE">On leave</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </label>
        </div>

        <div class="form-actions">
          <button class="secondary-button" type="button" @click="formOpen = false">
            Cancel
          </button>
          <button class="primary-button" type="submit" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save employee' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
