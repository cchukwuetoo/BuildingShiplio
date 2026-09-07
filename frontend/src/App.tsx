import { useState, useEffect } from 'react'
import { authAPI } from './api.js'
import LoginPage from './pages/LoginPage.js'
import DriverDashboard from './pages/DriverDashboard.js'
import WarehouseDashboard from './pages/WarehouseDashboard.js'
import CustomerDashboard from './pages/CustomerDashboard.js'
import { formatRole } from './lib/format.js'
import { User } from './types.js'
import './App.css'
import './styles/dashboard.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedRole = localStorage.getItem('userRole')
    const storedUser = localStorage.getItem('user')

    if (token && storedRole && storedUser) {
      setIsLoggedIn(true)
      setUserRole(storedRole)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = async (email: string, password: string) => {
    const response = await authAPI.login(email, password)
    const { accessToken, user: userData } = response.data

    localStorage.setItem('token', accessToken)
    localStorage.setItem('userRole', userData.role)
    localStorage.setItem('user', JSON.stringify(userData))

    setIsLoggedIn(true)
    setUserRole(userData.role)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    setUserRole(null)
    setUser(null)
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
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-text">
            <strong>Shiplio</strong>
            <span>Operations console</span>
          </div>
        </div>
        <div className="header-info">
          <div className="user-chip">
            <span className="name">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="role-pill">{formatRole(userRole)}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Sign out
          </button>
        </div>
      </header>

      <main className="app-main">
        {userRole === 'DRIVER' && <DriverDashboard />}
        {userRole === 'WAREHOUSE' && <WarehouseDashboard />}
        {userRole === 'USER' && <CustomerDashboard />}
        {userRole === 'SUPER_ADMIN' && (
          <div className="admin-view">
            <h2>Admin preview</h2>
            <p>Switch into a workspace to inspect the operator experience.</p>
            <div className="test-links">
              <button
                onClick={() => {
                  localStorage.setItem('userRole', 'DRIVER')
                  setUserRole('DRIVER')
                }}
              >
                Driver workspace
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('userRole', 'WAREHOUSE')
                  setUserRole('WAREHOUSE')
                }}
              >
                Warehouse workspace
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('userRole', 'USER')
                  setUserRole('USER')
                }}
              >
                Customer workspace
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
