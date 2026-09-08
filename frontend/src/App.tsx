import { useState, useEffect } from 'react'
import { authAPI } from './api.js'
import LoginPage from './pages/LoginPage.js'
import LandingPage from './pages/LandingPage.js'
import Logo from './components/Logo.js'
import DriverDashboard from './pages/DriverDashboard.js'
import WarehouseDashboard from './pages/WarehouseDashboard.js'
import CustomerDashboard from './pages/CustomerDashboard.js'
import { formatRole } from './lib/format.js'
import { AuthUser } from './types.js'
import './App.css'
import './styles/dashboard.css'
import './styles/customer.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedRole = localStorage.getItem('userRole')
    const storedUser = localStorage.getItem('user')

    if (token && storedRole && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
        setUserRole(storedRole)
        setIsLoggedIn(true)
      } catch {
        // corrupted session, treat as logged out
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = async (email: string, password: string) => {
    const response = await authAPI.login(email, password)
    const { accessToken, refreshToken, user: userData } = response.data

    localStorage.setItem('token', accessToken)
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('userRole', userData.role)
    localStorage.setItem('user', JSON.stringify(userData))

    setIsLoggedIn(true)
    setUserRole(userData.role)
    setUser(userData)
  }

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (refreshToken) {
        await authAPI.logout(refreshToken)
      }
    } catch {
      // best effort — clear local session regardless
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userRole')
      localStorage.removeItem('user')
      setIsLoggedIn(false)
      setUserRole(null)
      setUser(null)
    }
  }

  const switchRole = (role: string) => {
    localStorage.setItem('userRole', role)
    setUserRole(role)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading Shiplio…</p>
      </div>
    )
  }

  if (!isLoggedIn) {
    if (showAuth) {
      return <LoginPage onLogin={handleLogin} onBack={() => setShowAuth(false)} />
    }
    return <LandingPage onSignIn={() => setShowAuth(true)} />
  }

  if (userRole === 'USER') {
    return <CustomerDashboard user={user} onLogout={() => void handleLogout()} />
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <Logo size={36} />
          <div className="brand-text">
            <strong>Shiplio</strong>
            <span>Operations console</span>
          </div>
        </div>
        <div className="header-info">
          <div className="user-chip">
            <span className="avatar">{user?.fullName?.[0]?.toUpperCase() || 'S'}</span>
            <span className="name">{user?.fullName || 'User'}</span>
            <span className="role-pill">{formatRole(userRole)}</span>
          </div>
          <button onClick={() => void handleLogout()} className="logout-btn">
            Sign out
          </button>
        </div>
      </header>

      <main className="app-main">
        {userRole === 'DRIVER' && <DriverDashboard />}
        {userRole === 'WAREHOUSE' && <WarehouseDashboard />}
        {userRole === 'SUPER_ADMIN' && (
          <div className="admin-view">
            <h2>Admin preview</h2>
            <p>Switch into a workspace to inspect the operator experience.</p>
            <div className="test-links">
              <button onClick={() => switchRole('DRIVER')}>Driver workspace</button>
              <button onClick={() => switchRole('WAREHOUSE')}>Warehouse workspace</button>
              <button onClick={() => switchRole('USER')}>Customer workspace</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
