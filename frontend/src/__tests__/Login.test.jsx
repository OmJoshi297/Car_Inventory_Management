import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'

// Mock the AuthContext
const mockLogin = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

// Mock react-router-dom's useNavigate and useLocation
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ state: null, pathname: '/login' }),
  }
})

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  )

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the login form with username and password inputs', () => {
    renderLogin()
    expect(screen.getByPlaceholderText(/enter your username/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows an error when submitting with empty fields', async () => {
    const { container } = renderLogin()
    // Submit the form directly to bypass JSDOM native required validation
    const form = container.querySelector('#login-form')
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    })
  })



  it('calls login with correct credentials on submit', async () => {
    mockLogin.mockResolvedValue({ username: 'testuser', is_admin: false })
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText(/enter your username/i), {
      target: { name: 'username', value: 'testuser' },
    })
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { name: 'password', value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
    })
  })

  it('shows error message when login fails', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { detail: 'Invalid username or password' } },
    })
    renderLogin()

    fireEvent.change(screen.getByPlaceholderText(/enter your username/i), {
      target: { name: 'username', value: 'baduser' },
    })
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { name: 'password', value: 'wrongpass' },
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument()
    })
  })

  it('has a link to the register page', () => {
    renderLogin()
    expect(screen.getByText(/register here/i)).toBeInTheDocument()
  })

  it('shows demo credentials hint', () => {
    renderLogin()
    expect(screen.getByText(/demo credentials/i)).toBeInTheDocument()
  })
})
