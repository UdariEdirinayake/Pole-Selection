import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../App'
import { AuthProvider } from '../context/AuthContext'
import { SignInPage } from '../pages/SignInPage'

// Mock fetch for AuthProvider
vi.stubGlobal('fetch', vi.fn((url: string) => {
  if (url === '/api/auth/me') {
    // Return 401 Unauthorized for unauthenticated state
    return Promise.resolve({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: 'Authentication required' }),
    } as Response)
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  } as Response)
}))

describe('Auth & Route Guard Tests (Step 2A)', () => {
  it('redirects unauthenticated users from protected routes to /signin', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/signin" element={<div>Sign In Screen Mock</div>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Secret Dashboard Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    )

    // Should not show protected dashboard content
    expect(screen.queryByText('Secret Dashboard Content')).not.toBeInTheDocument()

    // Should navigate and display the Sign In screen
    expect(await screen.findByText('Sign In Screen Mock')).toBeInTheDocument()
  })

  it('renders SignInPage with email, password inputs, submit button, and quick demo credentials', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <SignInPage />
        </MemoryRouter>
      </AuthProvider>
    )

    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Sign In$/i })).toBeInTheDocument()
    expect(screen.getByText(/Quick demo logins:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Designer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reviewer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Admin/i })).toBeInTheDocument()
  })
})
