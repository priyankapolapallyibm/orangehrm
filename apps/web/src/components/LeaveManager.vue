<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { listEmployees, type Employee } from "../services/employees";
import {
  createLeaveRequest,
  listLeaveRequests,
  reviewLeaveRequest,
  type LeaveInput,
  type LeaveRequest,
} from "../services/hr";

const props = defineProps<{ token: string }>();
const requests = ref<LeaveRequest[]>([]);
const employees = ref<Employee[]>([]);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const formOpen = ref(false);
const form = reactive<LeaveInput>({
  employeeId: 0,
  leaveType: "ANNUAL",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  reason: "",
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    [requests.value, employees.value] = await Promise.all([
      listLeaveRequests(props.token),
      listEmployees(props.token),
    ]);
    if (!form.employeeId && employees.value[0])
      form.employeeId = employees.value[0].id;
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Unable to load leave.";
  } finally {
    loading.value = false;
  }
}

async function submit() {
  saving.value = true;
  error.value = "";
  try {
    await createLeaveRequest(props.token, form);
    form.reason = "";
    formOpen.value = false;
    await load();
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Unable to save leave.";
  } finally {
    saving.value = false;
  }
}

async function review(id: number, status: "APPROVED" | "REJECTED") {
  error.value = "";
  try {
    await reviewLeaveRequest(props.token, id, status);
    await load();
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Unable to review leave.";
  }
}

const date = (value: string) =>
  new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString();
onMounted(load);
</script>

<template>
  <section class="module-page">
    <header class="page-header">
      <div>
        <p class="eyebrow accent">Time away</p>
        <h1>Leave Management</h1>
        <p>Create, review, and track employee leave requests.</p>
      </div>
      <button
        class="primary-button"
        type="button"
        @click="formOpen = !formOpen"
      >
        {{ formOpen ? "Close form" : "New request" }}
      </button>
    </header>
    <p v-if="error" class="error-message" role="alert">{{ error }}</p>

    <form v-if="formOpen" class="inline-form" @submit.prevent="submit">
      <label
        >Employee<select v-model.number="form.employeeId" required>
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
      <label
        >Leave type<select v-model="form.leaveType">
          <option value="ANNUAL">Annual</option>
          <option value="SICK">Sick</option>
          <option value="PERSONAL">Personal</option>
        </select></label
      >
      <label
        >Start date<input v-model="form.startDate" type="date" required
      /></label>
      <label
        >End date<input v-model="form.endDate" type="date" required
      /></label>
      <label class="wide"
        >Reason<textarea
          v-model="form.reason"
          required
          maxlength="500"
        ></textarea>
      </label>
      <button class="primary-button" type="submit" :disabled="saving">
        {{ saving ? "Saving..." : "Submit request" }}
      </button>
    </form>

    <div class="data-card">
      <p v-if="loading" class="table-message">Loading leave requests...</p>
      <p v-else-if="!requests.length" class="table-message">
        No leave requests yet.
      </p>
      <div v-else class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Dates</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in requests" :key="request.id">
              <td>
                <strong
                  >{{ request.employee.firstName }}
                  {{ request.employee.lastName }}</strong
                ><span>{{ request.employee.employeeNumber }}</span>
              </td>
              <td>{{ request.leaveType }}</td>
              <td>
                {{ date(request.startDate) }} - {{ date(request.endDate) }}
              </td>
              <td>{{ request.reason }}</td>
              <td>
                <span
                  class="record-status"
                  :class="request.status.toLowerCase()"
                  >{{ request.status }}</span
                >
              </td>
              <td class="row-actions">
                <template v-if="request.status === 'PENDING'">
                  <button
                    class="text-button"
                    type="button"
                    @click="review(request.id, 'APPROVED')"
                  >
                    Approve
                  </button>
                  <button
                    class="text-button danger"
                    type="button"
                    @click="review(request.id, 'REJECTED')"
                  >
                    Reject
                  </button>
                </template>
                <span v-else>Reviewed</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
