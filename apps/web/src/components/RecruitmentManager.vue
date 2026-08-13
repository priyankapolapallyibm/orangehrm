<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import {
  createCandidate,
  createVacancy,
  listCandidates,
  listVacancies,
  setCandidateStatus,
  setVacancyStatus,
  type Candidate,
  type Vacancy,
} from "../services/hr";

const props = defineProps<{ token: string }>();
const vacancies = ref<Vacancy[]>([]);
const candidates = ref<Candidate[]>([]);
const tab = ref<"vacancies" | "candidates">("vacancies");
const error = ref("");
const vacancyForm = reactive({
  title: "",
  department: "",
  description: "",
  positions: 1,
});
const candidateForm = reactive({
  vacancyId: 0,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
});

async function load() {
  error.value = "";
  try {
    [vacancies.value, candidates.value] = await Promise.all([
      listVacancies(props.token),
      listCandidates(props.token),
    ]);
    if (!candidateForm.vacancyId && vacancies.value[0])
      candidateForm.vacancyId = vacancies.value[0].id;
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Unable to load recruitment.";
  }
}

async function addVacancy() {
  try {
    await createVacancy(props.token, vacancyForm);
    Object.assign(vacancyForm, {
      title: "",
      department: "",
      description: "",
      positions: 1,
    });
    await load();
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Unable to add vacancy.";
  }
}

async function addCandidate() {
  try {
    await createCandidate(props.token, candidateForm);
    Object.assign(candidateForm, {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    });
    await load();
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Unable to add candidate.";
  }
}

async function toggleVacancy(vacancy: Vacancy) {
  error.value = "";
  try {
    await setVacancyStatus(
      props.token,
      vacancy.id,
      vacancy.status === "OPEN" ? "CLOSED" : "OPEN",
    );
    await load();
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Unable to update vacancy.";
  }
}

async function moveCandidate(
  candidate: Candidate,
  status: Candidate["status"],
) {
  error.value = "";
  try {
    await setCandidateStatus(props.token, candidate.id, status);
    await load();
  } catch (requestError) {
    error.value =
      requestError instanceof Error
        ? requestError.message
        : "Unable to update candidate.";
  }
}

onMounted(load);
</script>

<template>
  <section class="module-page">
    <header class="page-header">
      <div>
        <p class="eyebrow accent">Talent acquisition</p>
        <h1>Recruitment</h1>
        <p>Manage vacancies and move candidates through the hiring pipeline.</p>
      </div>
      <div class="segmented">
        <button
          type="button"
          :class="{ active: tab === 'vacancies' }"
          @click="tab = 'vacancies'"
        >
          Vacancies</button
        ><button
          type="button"
          :class="{ active: tab === 'candidates' }"
          @click="tab = 'candidates'"
        >
          Candidates
        </button>
      </div>
    </header>
    <p v-if="error" class="error-message" role="alert">{{ error }}</p>

    <template v-if="tab === 'vacancies'">
      <form class="inline-form" @submit.prevent="addVacancy">
        <label
          >Job title<input v-model="vacancyForm.title" required maxlength="120"
        /></label>
        <label
          >Department<input
            v-model="vacancyForm.department"
            required
            maxlength="120"
        /></label>
        <label
          >Positions<input
            v-model.number="vacancyForm.positions"
            type="number"
            min="1"
            max="100"
            required
        /></label>
        <label class="wide"
          >Description<textarea
            v-model="vacancyForm.description"
            required
            maxlength="1000"
          ></textarea>
        </label>
        <button class="primary-button" type="submit">Add vacancy</button>
      </form>
      <div class="record-grid">
        <article
          v-for="vacancy in vacancies"
          :key="vacancy.id"
          class="record-card"
        >
          <div>
            <span class="record-status" :class="vacancy.status.toLowerCase()">{{
              vacancy.status
            }}</span>
            <h2>{{ vacancy.title }}</h2>
            <p>
              {{ vacancy.department }} · {{ vacancy.positions }} position(s)
            </p>
          </div>
          <p>{{ vacancy.description }}</p>
          <footer>
            <span>{{ vacancy._count?.candidates ?? 0 }} candidates</span
            ><button
              class="text-button"
              type="button"
              @click="toggleVacancy(vacancy)"
            >
              {{
                vacancy.status === "OPEN" ? "Close vacancy" : "Reopen vacancy"
              }}
            </button>
          </footer>
        </article>
      </div>
    </template>

    <template v-else>
      <form class="inline-form" @submit.prevent="addCandidate">
        <label
          >Vacancy<select v-model.number="candidateForm.vacancyId" required>
            <option
              v-for="vacancy in vacancies.filter(
                (item) => item.status === 'OPEN',
              )"
              :key="vacancy.id"
              :value="vacancy.id"
            >
              {{ vacancy.title }}
            </option>
          </select></label
        >
        <label
          >First name<input v-model="candidateForm.firstName" required
        /></label>
        <label
          >Last name<input v-model="candidateForm.lastName" required
        /></label>
        <label
          >Email<input v-model="candidateForm.email" type="email" required
        /></label>
        <label>Phone<input v-model="candidateForm.phone" /></label>
        <button class="primary-button" type="submit">Add candidate</button>
      </form>
      <div class="data-card table-scroll">
        <table>
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Vacancy</th>
              <th>Contact</th>
              <th>Stage</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="candidate in candidates" :key="candidate.id">
              <td>
                <strong
                  >{{ candidate.firstName }} {{ candidate.lastName }}</strong
                >
              </td>
              <td>{{ candidate.vacancy.title }}</td>
              <td>
                {{ candidate.email
                }}<span>{{ candidate.phone || "No phone" }}</span>
              </td>
              <td>
                <select
                  :value="candidate.status"
                  @change="
                    moveCandidate(
                      candidate,
                      ($event.target as HTMLSelectElement)
                        .value as Candidate['status'],
                    )
                  "
                >
                  <option>APPLIED</option>
                  <option>SHORTLISTED</option>
                  <option>INTERVIEW</option>
                  <option>HIRED</option>
                  <option>REJECTED</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
