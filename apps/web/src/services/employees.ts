export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED'

export interface Employee {
  id: number
  employeeNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  email: string
  jobTitle: string
  department: string
  employmentStatus: EmploymentStatus
  dateOfJoining: string
  createdAt: string
  updatedAt: string
}

export interface EmployeeInput {
  employeeNumber: string
  firstName: string
  middleName?: string
  lastName: string
  email: string
  jobTitle: string
  department: string
  employmentStatus: EmploymentStatus
  dateOfJoining: string
}

interface ApiError {
  message?: string | string[]
}

async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError
    const message = Array.isArray(error.message) ? error.message[0] : error.message
    throw new Error(message ?? 'Unable to complete the employee request.')
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function listEmployees(token: string, search = '') {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiRequest<Employee[]>(`/employees${query}`, token)
}

export function createEmployee(token: string, input: EmployeeInput) {
  return apiRequest<Employee>('/employees', token, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateEmployee(token: string, id: number, input: EmployeeInput) {
  return apiRequest<Employee>(`/employees/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteEmployee(token: string, id: number) {
  return apiRequest<void>(`/employees/${id}`, token, { method: 'DELETE' })
}
