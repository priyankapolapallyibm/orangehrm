interface ApiError {
  message?: string | string[];
}

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    const message = Array.isArray(body.message)
      ? body.message[0]
      : body.message;
    throw new Error(message ?? "Unable to complete the request.");
  }
  return response.json() as Promise<T>;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveType: "ANNUAL" | "SICK" | "PERSONAL";
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  employee: { firstName: string; lastName: string; employeeNumber: string };
}

export interface LeaveInput {
  employeeId: number;
  leaveType: LeaveRequest["leaveType"];
  startDate: string;
  endDate: string;
  reason: string;
}

export const listLeaveRequests = (token: string) =>
  request<LeaveRequest[]>("/leave-requests", token);

export const createLeaveRequest = (token: string, input: LeaveInput) =>
  request<LeaveRequest>("/leave-requests", token, {
    method: "POST",
    body: JSON.stringify(input),
  });

export const reviewLeaveRequest = (
  token: string,
  id: number,
  status: "APPROVED" | "REJECTED",
) =>
  request<LeaveRequest>(`/leave-requests/${id}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export interface Vacancy {
  id: number;
  title: string;
  department: string;
  description: string;
  positions: number;
  status: "OPEN" | "CLOSED";
  _count?: { candidates: number };
}

export interface Candidate {
  id: number;
  vacancyId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: "APPLIED" | "SHORTLISTED" | "INTERVIEW" | "HIRED" | "REJECTED";
  vacancy: Vacancy;
}

export const listVacancies = (token: string) =>
  request<Vacancy[]>("/recruitment/vacancies", token);

export const createVacancy = (
  token: string,
  input: Omit<Vacancy, "id" | "status" | "_count">,
) =>
  request<Vacancy>("/recruitment/vacancies", token, {
    method: "POST",
    body: JSON.stringify(input),
  });

export const setVacancyStatus = (
  token: string,
  id: number,
  status: Vacancy["status"],
) =>
  request<Vacancy>(`/recruitment/vacancies/${id}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const listCandidates = (token: string) =>
  request<Candidate[]>("/recruitment/candidates", token);

export const createCandidate = (
  token: string,
  input: {
    vacancyId: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  },
) =>
  request<Candidate>("/recruitment/candidates", token, {
    method: "POST",
    body: JSON.stringify(input),
  });

export const setCandidateStatus = (
  token: string,
  id: number,
  status: Candidate["status"],
) =>
  request<Candidate>(`/recruitment/candidates/${id}/status`, token, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export interface Account {
  id: number;
  username: string;
  displayName: string;
  role: "ADMIN" | "EMPLOYEE";
  active: boolean;
  employeeId: number | null;
  employee?: {
    employeeNumber: string;
    firstName: string;
    lastName: string;
  } | null;
}

export const listAccounts = (token: string) =>
  request<Account[]>("/users", token);

export const createAccount = (
  token: string,
  input: {
    username: string;
    password: string;
    displayName: string;
    role: Account["role"];
    employeeId?: number;
  },
) =>
  request<Account>("/users", token, {
    method: "POST",
    body: JSON.stringify(input),
  });

export const updateAccount = (
  token: string,
  id: number,
  input: { role?: Account["role"]; active?: boolean },
) =>
  request<Account>(`/users/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
