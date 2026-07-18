import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.username || !form.password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Welcome back! 🚗')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check your credentials.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-[#e6eef8]">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-[#e6eef8] shadow-[5px_5px_10px_#c2cbda,-5px_-5px_10px_#ffffff] mb-4">
            <svg className="w-8 h-8 text-[#0071e3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-[#1d1d1f] tracking-tight">Welcome Back</h1>
          <p className="text-[#8e98aa] mt-2 font-bold">Sign in to your AutoVault account</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 glow-box">
          <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-username" className="block text-sm font-semibold text-[#1d1d1f] mb-2">Username</label>
              <input
                id="login-username"
                name="username"
                type="text"
                autoComplete="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className="form-input"
                required
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-[#1d1d1f] mb-2">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="form-input"
                required
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-3 bg-[#e6eef8] rounded-xl text-xs text-[#8e98aa] shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff]">
            <p className="font-bold text-[#1d1d1f] mb-1">🔑 Demo credentials</p>
            <p>Admin: <span className="text-[#1d1d1f] font-bold">admin / admin123</span></p>
          </div>

          <p className="text-center text-[#8e98aa] text-sm mt-6 font-bold flex items-center justify-center gap-1.5">
            Don't have an account?
            <Link to="/register" className="text-[#0071e3] hover:underline font-bold px-2 py-0.5 rounded-lg shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff] active:shadow-[inset_1.5px_1.5px_3px_#c2cbda,inset_-1.5px_-1.5px_3px_#ffffff]">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
