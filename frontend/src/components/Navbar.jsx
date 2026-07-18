import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLink = (to, label) => {
    const active = location.pathname === to
    return (
      <Link
        to={to}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${active
            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-shadow duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gradient">AutoVault</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLink('/', 'Inventory')}
            {isAuthenticated && isAdmin && navLink('/admin', 'Admin Panel')}
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-sm">
                    <p className="text-slate-200 font-medium">{user?.username}</p>
                    {isAdmin && (
                      <p className="text-xs text-indigo-400 font-medium">Admin</p>
                    )}
                  </div>
                </div>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm px-4 py-2">Login</Link>
                <Link to="/register" className="btn-primary text-sm px-4 py-2">Register</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
