import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('signs in with valid credentials and shows the dashboard', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          accessToken: 'test-token',
          user: {
            id: 1,
            username: 'Admin',
            displayName: 'System Administrator',
            role: 'ADMIN',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const wrapper = mount(App)
    await wrapper.get('#username').setValue('Admin')
    await wrapper.get('#password').setValue('admin123')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Good day, System Administrator')
    })
  })

  it('shows an error when authentication fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 401 }))

    const wrapper = mount(App)
    await wrapper.get('#username').setValue('Admin')
    await wrapper.get('#password').setValue('wrong')
    await wrapper.get('form').trigger('submit')
    await vi.waitFor(() => {
      expect(wrapper.get('[role="alert"]').text()).toBe('Invalid username or password.')
    })
  })
})
