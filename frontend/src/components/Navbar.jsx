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
        className={`relative px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
          active
            ? 'text-[#0071e3] shadow-[inset_2px_2px_5px_#c2cbda,inset_-2px_-2px_5px_#ffffff]'
            : 'text-[#51576c] hover:text-[#1d1d1f] hover:shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff]'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#e6eef8] border-b border-[#d8e0ed] py-2">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 bg-[#e6eef8] px-4 rounded-2xl shadow-[4px_4px_10px_#c2cbda,-4px_-4px_10px_#ffffff]">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#e6eef8] flex items-center justify-center transition-all shadow-[3px_3px_6px_#c2cbda,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff]">
              <svg className="w-4.5 h-4.5 text-[#0071e3]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 13h4l3-9 4 16 3-7h4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-extrabold text-[#1d1d1f] tracking-tight">AutoVault</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-2">
            {navLink('/', 'Inventory')}
            {isAuthenticated && isAdmin && navLink('/admin', 'Admin')}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-xl shadow-[inset_2px_2px_5px_#c2cbda,inset_-2px_-2px_5px_#ffffff]">
                  <div className="w-7 h-7 rounded-lg bg-[#e6eef8] flex items-center justify-center text-[#0071e3] text-xs font-extrabold shadow-[2px_2px_4px_#c2cbda,-2px_-2px_4px_#ffffff]">
                    {user?.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="leading-none">
                    <p className="text-xs font-bold text-[#1d1d1f]">{user?.username}</p>
                    {isAdmin && (
                      <p className="text-[10px] text-[#8e98aa] mt-0.5 font-semibold">Admin</p>
                    )}
                  </div>
                </div>
                <button
                  id="logout-btn"
                  onClick={handleLogout}
                  className="btn-secondary text-xs py-2 px-3 shadow-[2px_2px_5px_#c2cbda,-2px_-2px_5px_#ffffff] active:shadow-[inset_2px_2px_4px_#c2cbda,inset_-2px_-2px_4px_#ffffff]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-xs py-2 px-4">Login</Link>
                <Link to="/register" className="btn-primary text-xs py-2 px-4">Sign up</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
