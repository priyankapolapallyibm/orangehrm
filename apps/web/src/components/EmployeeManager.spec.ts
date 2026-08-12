import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EmployeeManager from './EmployeeManager.vue'

describe('EmployeeManager', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads employees and opens the add form', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 1,
            employeeNumber: 'EMP-1001',
            firstName: 'Aarav',
            middleName: null,
            lastName: 'Sharma',
            email: 'aarav.sharma@example.test',
            jobTitle: 'Software Engineer',
            department: 'Engineering',
            employmentStatus: 'ACTIVE',
            dateOfJoining: '2024-02-12T00:00:00.000Z',
            createdAt: '2024-02-12T00:00:00.000Z',
            updatedAt: '2024-02-12T00:00:00.000Z',
          },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const wrapper = mount(EmployeeManager, { props: { token: 'test-token' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Aarav Sharma')
    expect(wrapper.text()).toContain('Software Engineer')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/employees',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    )

    await wrapper.get('button.primary-button').trigger('click')
    expect(wrapper.text()).toContain('Add employee')
    expect(wrapper.find('.employee-form').exists()).toBe(true)
  })
})
