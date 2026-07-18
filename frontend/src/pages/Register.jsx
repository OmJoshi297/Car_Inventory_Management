import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined, general: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.username || form.username.length < 3) e.username = 'Username must be at least 3 characters'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address'
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      toast.success('Account created! Please sign in. 🎉')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Try again.'
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  const inputField = (name, label, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <input
        id={`register-${name}`}
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className={`form-input ${errors[name] ? 'border-red-500/60' : ''}`}
        required
      />
      {errors[name] && <p className="text-red-400 text-xs mt-1.5">{errors[name]}</p>}
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4"
         style={{ background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d1a 60%)' }}>
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                          bg-gradient-to-br from-indigo-500 to-violet-500 shadow-glow-lg mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gradient">Create Account</h1>
          <p className="text-slate-400 mt-2">Join AutoVault today</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 glow-box">
          <form id="register-form" onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                {errors.general}
              </div>
            )}

            {inputField('username', 'Username', 'text', 'Choose a username (min. 3 chars)')}
            {inputField('email', 'Email Address', 'email', 'you@example.com')}
            {inputField('password', 'Password', 'password', 'Min. 6 characters')}
            {inputField('confirmPassword', 'Confirm Password', 'password', 'Repeat your password')}

            <button
              id="register-submit-btn"
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
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
